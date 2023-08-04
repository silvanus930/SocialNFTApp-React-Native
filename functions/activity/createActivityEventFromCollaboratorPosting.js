const { db, functions, admin } = require("../admin");
const {
  createActivityEvent,
  getPostCommonData,
  getPersonaCommonData,
  getEntityCommonData,
  getCreatedByUserCommonData,
  getIdentity,
  getPostPreviewData,
} = require("./helpers");

exports.createActivityEventFromCollaboratorPosting = functions
  .runWith({ minInstances: 1 })
  .firestore.document("{entity}/{entityId}/posts/{postId}")
  .onCreate(async (postSnapshot, context) => {
    functions.logger.log(
      `New post at ${context.params.entityId}/${context.params.postId} - creating activity event`,
    );

    const ref = postSnapshot.ref;
    const postUserId = postSnapshot.get("userID");

    if (!postUserId) {
      functions.logger.error(
        `Post missing user ID: ${context.params.entity}/${context.params.entityId}/posts/${context.params.postId}`,
      );
      return null;
    }

    if (postSnapshot.get("isOnboardingPost")) {
      functions.logger.log(
        `Onboarding post: ${context.params.entity}/${context.params.entityId}/posts/${context.params.postId}. Skipping notification.`,
      );
      return null;
    }

    if (
      postSnapshot.get("type") === "proposal" ||
      (typeof postSnapshot.get("proposal") === "object" &&
        Object.keys(postSnapshot.get("proposal")).length > 0)
    ) {
      functions.logger.log(
        `Proposal post: ${postSnapshot.ref.path}. Skipping notification.`,
      );
      return;
    }

    if (
      postSnapshot.get("type") === "transfer" ||
      (typeof postSnapshot.get("transfer") === "object" &&
        Object.keys(postSnapshot.get("transfer")).length > 0)
    ) {
      functions.logger.log(
        `Transfer post: ${postSnapshot.ref.path}. Skipping notification.`,
      );
      return;
    }

    const entity = await ref.parent.parent.get();
    const entityType =
      context.params.entity === "communities" ? "community" : "persona";
    const createdByUser = await db.collection("users").doc(postUserId).get();
    let identity = null;
    const identityID = postSnapshot.get("identityID");
    const isAnonymous = !!postSnapshot.get("anonymous");
    if (isAnonymous && !identityID) {
      throw new Error(
        `Anonymous post created without identityID. Post ID: ${postSnapshot.id}`,
      );
    }
    if (identityID) {
      identity = await getIdentity(identityID);
    }
    const eventData = {
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      ref,
      event_type: "new_post_from_collaborator",
      seen: false,
      deleted: postSnapshot.get("deleted") || false,
      isAnonymous,
      post: {
        id: postSnapshot.id,
        data: {
          ...getPostCommonData(postSnapshot),
          ...getPostPreviewData(postSnapshot),
        },
        ref: postSnapshot.ref,
      },
      [entityType]: {
        id: entity.id,
        data: {
          ...getPersonaCommonData(entity),
        },
        ref: entity.ref,
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

    let usersToNotify = entity.get("members") || entity.get("authors") || [];
    if (postSnapshot.get("published")) {
      const communityMembers = entity.get("communityMembers") || [];
      usersToNotify = usersToNotify.concat(communityMembers);
      // const isUnattributedAnonymous = isAnonymous && !!entity.get("anonymous");
      // if (!persona.get("private") && !isUnattributedAnonymous) {
      //   const userFollowersDoc = await createdByUser.ref
      //     .collection("live")
      //     .doc("followers")
      //     .get();
      //   const userFollowers = userFollowersDoc.get("profileFollow") || [];
      //   usersToNotify = usersToNotify.concat(userFollowers);
      // }
    }

    // Dedupe users to notify
    const usersToNotifySet = new Set(usersToNotify);
    usersToNotifySet.delete(postUserId);

    await Promise.all(
      Array.from(usersToNotifySet).map(async (userID) => {
        const activityCollection = db
          .collection("users")
          .doc(userID)
          .collection("activity");
        const existingActivitySnap = await activityCollection
          .where("ref", "==", ref)
          .where("event_type", "==", "new_post_from_collaborator")
          .get();
        if (existingActivitySnap.empty) {
          // TODO: Reincorporate centralized createActivityEvent logic
          // Skipping for now for speed bc it would involve more extensive
          // refactoring to account for both communities and channels
          const createdRef = await activityCollection.add(eventData);
          if (createdRef !== null) {
            functions.logger.log(
              `Creating new_post_from_collaborator event for ${userID}`,
              ref.path,
              createdRef.path,
            );
          }
        } else {
          functions.logger.error(
            `Error creating new_post_from_collaborator event for ${userID}`,
            ref.path,
            "Already existing activity events",
            existingActivitySnap.docs.map((d) => d.ref.path),
          );
        }
      }),
    );
  });
