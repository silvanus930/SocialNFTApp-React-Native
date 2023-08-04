const { db, functions } = require("../admin");
const _ = require("lodash");
const {
  findMentions,
  getPostCommonData,
  getPersonaCommonData,
  getCreatedByUserCommonData,
  getIdentity,
  getPostPreviewData,
  newCreateActivityEvent,
} = require("./helpers");

exports.createActivityEventFromPostMention = functions
  .runWith({ minInstances: 1 })
  .firestore.document("{entity}/{entityId}/posts/{postId}")
  .onWrite(async (change, context) => {
    const before = change.before;
    const after = change.after;

    const justPublished = !before.get("published") && after.get("published");

    // Don't bother if: (1) the text hasn't changed (except if it's just
    // published) (2) we have no text (3) it's an onboarding post
    if (
      (after && before.get("text") === after.get("text") && !justPublished) ||
      after.get("text") === "" ||
      after.get("isOnboardingPost")
    ) {
      return;
    }

    let newMentions;
    if (justPublished) {
      const afterMentions = findMentions(after.get("text"));
      newMentions = [...afterMentions];
    } else {
      const beforeMentions = findMentions(before.get("text"));
      const afterMentions = findMentions(after.get("text"));
      if (
        _.isEqual(beforeMentions, afterMentions) ||
        afterMentions.length === 0
      ) {
        return;
      }
      newMentions = [...afterMentions].filter((x) => !beforeMentions.has(x));
    }

    if (newMentions.length === 0) {
      return;
    }

    const entityType =
      context.params.entity === "communities" ? "community" : "persona";
    const post = after;
    const ref = post.ref;
    const entityDoc = await ref.parent.parent.get();
    const identityID = post.get("identityID");
    const isAnonymous = !!post.get("anonymous") && !!identityID;
    let identity = null;
    if (identityID) {
      identity = await getIdentity(identityID);
    }
    const createdByUser = await db
      .collection("users")
      .doc(post.get("userID"))
      .get();

    newMentions.forEach(async (userName) => {
      const userQuerySnapshot = await db
        .collection("users")
        .where("userName", "==", userName)
        .get();
      if (userQuerySnapshot.empty) {
        functions.logger.warn("Username does not exist:", userName);
        return;
      }
      // FIXME: As of right now usernames are not unique and we have no way
      // to disambiguate between two users with the same username.
      userQuerySnapshot.docs.forEach(async (doc) => {
        // No self-mentions
        functions.logger.log(`About to create notification for ${userName}`);
        if (doc.id === createdByUser.id) {
          return;
        }

        // Don't create an event for non author/community users on a
        // private persona
        if (entityDoc.get("private")) {
          const isAuthorOrCommunityMember = (
            entityDoc.get("authors")?.includes(doc.id) ||
            entityDoc.get("members")?.includes(doc.id)
          )(entityDoc.get("communityMembers") || []).includes(doc.id);
          if (!isAuthorOrCommunityMember) {
            return;
          }
        }

        const eventData = {
          created_at: after.get("editDate"),
          ref,
          event_type: "post_mention",
          seen: false,
          deleted: after.get("deleted") || false,
          ...(entityType === "persona" && {
            persona_id: context.params.entityId,
          }),
          ...(entityType === "community" && {
            communityID: context.params.entityId,
          }),
          isAnonymous,
          post: {
            id: post.id,
            data: {
              ...getPostCommonData(post),
              ...getPostPreviewData(post),
            },
            ref: post.ref,
          },
          [entityType]: {
            id: entityDoc.id,
            data: {
              ...getPersonaCommonData(entityDoc),
            },
            ref: entityDoc.ref,
          },
          createdByUser: {
            id: createdByUser.id,
            data: {
              ...getCreatedByUserCommonData(createdByUser),
            },
            ref: createdByUser.ref,
          },
          ...(identity !== null && {
            identity: {
              ...identity,
            },
          }),
        };

        functions.logger.log(
          `Creating post_mention event for ${userName} on post ${post.id}`,
        );

        await newCreateActivityEvent({
          userID: doc.id,
          eventData,
          entity: entityDoc,
          entityType,
          post,
        });
      });
    });
  });
