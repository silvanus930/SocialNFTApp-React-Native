const { db, admin, functions } = require("../admin");
const {
  createActivityEvent,
  getDocumentChanges,
  getIdentity,
  getPostCommonData,
  getPostPreviewData,
  getPersonaCommonData,
  getCreatedByUserCommonData,
  markActivityEntriesDeleted,
} = require("./helpers");

exports.createOrUpdateActivityEventFromUpdateCollaboratorPosting =
  functions.firestore
    .document("personas/{personaId}/posts/{postId}")
    .onUpdate(async (change, context) => {
      const postSnapshot = change.after;
      const ref = postSnapshot.ref;
      const postUserId = postSnapshot.get("userID");

      // Don't update the event if something substantial didn't change
      const excludedFields = ["seen", "typing", "usersPresent"];
      const shouldUpdateEvent =
        getDocumentChanges({
          before: change.before,
          after: change.after,
          trackedFields: excludedFields,
        }) === null;

      const justPublished =
        !change.before.get("published") && change.after.get("published");
      const justDeleted =
        !change.before.get("deleted") && change.after.get("deleted");
      const publishDate = postSnapshot.get("publishDate");
      const nowSeconds = Date.now() / 1000;
      if (
        !justPublished &&
        !justDeleted &&
        publishDate &&
        (nowSeconds - publishDate.seconds) / 60 < 30
      ) {
        // Don't create an event if we're editing right after we publish
        return;
      }

      if (postSnapshot.get("deleted")) {
        const activityCollection = await db
          .collectionGroup("activity")
          .where("ref", "==", ref)
          .get();
        for (const activity of activityCollection.docs) {
          functions.logger.log(
            "Updating activity reference to deleted",
            activity.ref.path,
          );
          await activity.ref.update({
            deleted: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      } else if (shouldUpdateEvent) {
        // Turned this off because these notifications are mostly noise
        // right now.
        return;
        const personaSnap = await ref.parent.parent.get();
        const createdByUser = await db
          .collection("users")
          .doc(postSnapshot.get("userID"))
          .get();
        let identity = null;
        const identityID = postSnapshot.get("identityID");
        const isAnonymous = !!postSnapshot.get("anonymous");
        if (isAnonymous && !identityID) {
          throw new Error(
            `Anonymous post edited without identityID. Post ID: ${postSnapshot.id}`,
          );
        }
        if (identityID) {
          identity = await getIdentity(identityID);
        }
        const eventData = {
          created_at: postSnapshot.get("editDate"),
          ref,
          event_type: "post_edit_from_collaborator",
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
          persona: {
            id: personaSnap.id,
            data: {
              ...getPersonaCommonData(personaSnap),
            },
            ref: personaSnap.ref,
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

        let usersToNotifySet = new Set(personaSnap.get("authors"));
        const communityMembers = personaSnap.get("communityMembers") || [];

        if (justPublished) {
          usersToNotifySet = new Set([
            ...usersToNotifySet,
            ...communityMembers,
          ]);
        }

        usersToNotifySet.delete(postUserId);
        const usersToNotify = [...usersToNotifySet];

        await Promise.all(
          usersToNotify.map(async (userID) => {
            const activityCollection = db
              .collection("users")
              .doc(userID)
              .collection("activity");
            const existingActivitySnap = await activityCollection
              .where("ref", "==", ref)
              .where("event_type", "==", "post_edit_from_collaborator")
              .get();
            if (existingActivitySnap.docs.length === 0) {
              // Must check author status because there's no restriction
              // on someone being both a community member and author
              const isCommunityMember =
                communityMembers.includes(userID) &&
                !personaSnap.get("authors").includes(userID);
              if (justPublished && isCommunityMember) {
                // FIXME: Really everyone should be getting a new post event
                // if a post changes from draft -> published. Right now
                // authors get an edit event instead.
                eventData.event_type = "new_post_from_collaborator";
              }
              const createdRef = await createActivityEvent({
                userID,
                eventData,
                persona: personaSnap,
                post: postSnapshot,
              });
              if (createdRef !== null) {
                functions.logger.log(
                  `Created ${eventData.event_type} event for ${
                    isCommunityMember ? "community member" : "author"
                  } ${userID}`,
                  ref.path,
                  createdRef.path,
                );
              }
            } else if (existingActivitySnap.docs.length === 1) {
              await existingActivitySnap.docs[0].ref.set(eventData);
              functions.logger.log(
                `Updating post_edit_from_collaborator event for ${userID}`,
                ref.path,
                existingActivitySnap.docs[0].ref.path,
              );
            } else {
              functions.logger.error(
                `Error creating/modifying post_edit_from_collaborator event for ${userID}`,
                ref.path,
                "Many existing activity events",
                existingActivitySnap.docs.map((d) => d.ref.path),
              );
            }
          }),
        );
      } else if (justDeleted) {
        functions.logger.log(
          `Post deleted ${postSnapshot.id} - deleting related events`,
        );
        return await markActivityEntriesDeleted(postSnapshot);
      } else {
        functions.logger.log("Skipping post_edit_from_collaborator event");
      }
    });
