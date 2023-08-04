const { db, admin, functions } = require("./admin");
const _ = require("lodash");
const { algoliaIndex } = require("./algolia/config");

const getDocumentChanges = ({ before, after, trackedFields }) => {
  const changes = {};
  for (let i = 0; i < trackedFields.length; i++) {
    const beforeVal = before.get(trackedFields[i]);
    const afterVal = after.get(trackedFields[i]);
    if (!_.isEqual(beforeVal, afterVal)) {
      changes[trackedFields[i]] = [beforeVal, afterVal];
    }
  }
  return changes;
};

exports.createInlinePostMessage = functions.firestore
  .document("{collectionName}/{entityID}/posts/{postID}")
  .onCreate(async (postSnapshot, context) => {
    const { postID } = context.params;
    if (!["personas", "communities"].includes(context.params.collectionName)) {
      functions.logger.warn(
        "Post found unrecognized collection type - returning early",
        postSnapshot.ref.path,
      );
      return;
    }

    if (!postSnapshot.get("published")) {
      functions.logger.warn(
        "Found post but it's unpublished - returning early",
        postSnapshot.ref.path,
      );
      return;
    }

    if (postSnapshot.get("deleted")) {
      functions.logger.warn(
        "Found post but it's deleted - returning early",
        postSnapshot.ref.path,
      );
      return;
    }

    if (
      postSnapshot.get("type") !== "media" &&
      postSnapshot.get("type") !== "event"
    ) {
      functions.logger.warn(
        "Found post but not a media or a event post - returning early",
        postSnapshot.ref.path,
        postSnapshot.get("type"),
      );
      return;
    }

    const isProjectPost = context.params.collectionName === "personas";
    const isCommunityPost = !isProjectPost;

    const messageData = {
      messageType: "post",
      isProjectPost,
      isCommunityPost,
      post: {
        id: postSnapshot.id,
        ref: postSnapshot.ref,
        data: {
          entityID: context.params.entityID,
          title: postSnapshot.get("title") || "",
          text: postSnapshot.get("text") || "",
          mediaType: postSnapshot.get("mediaType") || "photo",
          galleryUris: postSnapshot.get("galleryUris") || [],
          mediaUrl: postSnapshot.get("mediaUrl") || "",
          mediaMuted: postSnapshot.get("mediaMuted") || true,
          mediaRotate: postSnapshot.get("mediaRotate") || false,
          userID: postSnapshot.get("userID"),
          userName: postSnapshot.get("userName"),
          userProfileImgUrl: postSnapshot.get("userProfileImgUrl") || "",
          anonymous: postSnapshot.get("anonymous") || false,
        },
      },
      userID: "system",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      text: "New post created",
      mediaUrl: "",
      mediaWidth: 0,
      mediaHeight: 0,
      deleted: false,
      isThread: false,
      seen: {},
    };

    const messagesRef = db
      .collection(context.params.collectionName)
      .doc(context.params.entityID)
      .collection(isProjectPost ? "chats" : "chat")
      .doc("all")
      .collection("messages");

    const doc = await messagesRef.add(messageData);


    functions.logger.log(`Added ${doc.id}`);

    await algoliaIndex.saveObject({ ...messageData, objectID: postID });

    functions.logger.log(`Added index to algolia ${doc.id}`);


    const updateData = {
      editDate: admin.firestore.FieldValue.serverTimestamp(),
      streams: {
        [context.params.entityID]: admin.firestore.FieldValue.serverTimestamp(),
      },
    };
    const communityActivityUpdate = {
      lastActive: admin.firestore.FieldValue.serverTimestamp(),
      chats: {
        [messagesRef.path]: {
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
          messageCount: admin.firestore.FieldValue.increment(1),
        },
      },
    };

    let project;
    if (isProjectPost) {
      project = await db
        .collection(context.params.collectionName)
        .doc(context.params.entityID)
        .get();

      // TODO: timestamps doc will be deprecated
      const tdoc = await db
        .collection("communities")
        .doc(project.get("communityID"))
        .collection("live")
        .doc("timestamps")
        .set(updateData, { merge: true });

      functions.logger.log(`Updated timestamps in persona channel ${tdoc.id}`);

      if (!project.get("private")) {
        const communityID = project.get("communityID");
        const communityMessagesRef = db
          .collection("communities")
          .doc(communityID)
          .collection("chat")
          .doc("all")
          .collection("messages");
        const communityPostStub = await communityMessagesRef.add(messageData);

        functions.logger.log(
          `Added stub in community chat: ${communityPostStub.id}`,
        );

        communityActivityUpdate.chats[communityMessagesRef.path] = {
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
          messageCount: admin.firestore.FieldValue.increment(1),
        };
      }
    } else {
      // TODO: timestamps doc will be deprecated
      const tdoc = await db
        .collection("communities")
        .doc(context.params.entityID)
        .collection("live")
        .doc("timestamps")
        .set(updateData, { merge: true });
      functions.logger.log(`Updated timestamps in home channel ${tdoc.name}`);
    }

    await db
      .collection("communities")
      .doc(project ? project.get("communityID") : context.params.entityID)
      .collection("live")
      .doc("activity")
      .set(communityActivityUpdate, { merge: true });
  });

exports.updateInlinePostMessage = functions.firestore
  .document("{collectionName}/{entityID}/posts/{postID}")
  .onUpdate(async (change, context) => {
    const { postID } = context.params;
    const postSnapshot = change.after;
    if (!["personas", "communities"].includes(context.params.collectionName)) {
      functions.logger.warn(
        "Post found unrecognized collection type - returning early",
        postSnapshot.ref.path,
      );
      return;
    }

    const trackedFields = [
      "deleted",
      "published",
      "text",
      "title",
      "userID",
      "userName",
      "galleryUris",
      "mediaUrl",
      "mediaRotate",
      "mediaType",
      "userProfileImgUrl",
      "anonymous",
    ];

    const changedValues = getDocumentChanges({
      before: change.before,
      after: change.after,
      trackedFields,
    });

    if (Object.keys(changedValues)?.length === 0) {
      functions.logger.warn(
        "Post updated but no tracked fields changed",
        postSnapshot.ref.path,
      );
      return;
    }

    const querySnaphsot = await db
      .collectionGroup("messages")
      .where("post.ref", "==", postSnapshot.ref)
      .get();

    const docs = querySnaphsot.docs;

    if (docs.length === 0) {
      functions.logger.warn(
        "Post updated with changes to tracked fields but no inline post messages found",
        postSnapshot.ref.path,
      );
      return;
    }

    const postIsDeleted =
      !change.before.get("deleted") && change.after.get("deleted");

    const postIsUnpublished =
      change.before.get("published") && !change.after.get("published");

    const updateObj = {};
    Object.keys(changedValues).forEach((fieldName) => {
      updateObj[`post.data.${fieldName}`] = changedValues[fieldName][1];
    });

    await Promise.all(
      docs.map(async (doc) => {
        if (postIsDeleted || postIsUnpublished) {
          functions.logger.log(`Deleting ${doc.id}`);
          await doc.ref.update({ deleted: true });
          await algoliaIndex.deleteObject(postID);
          functions.logger.log(`deleted index to algolia ${postID}`);
          return;
        }
        // Update if certain attributes changed
        functions.logger.log(`Updating ${doc.id}`, updateObj);
        await doc.ref.update(updateObj);
        await algoliaIndex.partialUpdateObject({
          ...updateObj,
          objectID: postID,
        });
        functions.logger.log(
          `Updated algolia index ${postID}`,
        );

        return;
      }),
    );
  });
