const { db, admin, functions } = require("./admin");
const _ = require("lodash");

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

exports.createInlineProposalMessage = functions.firestore
  .document("proposals/{proposalID}")
  .onCreate(async (proposalSnapshot, context) => {
    const postRef = proposalSnapshot.get("postRef");
    const sourceRef = proposalSnapshot.get("sourceRef");
    const post = await postRef.get();
    const isSourceProject = sourceRef.path.includes("personas");

    const messageData = {
      messageType: "proposal",
      proposal: {
        proposalTitle: post.get("title"),
        postID: post.id,
        entityID: sourceRef.id,
        proposalRef: proposalSnapshot.ref,
        ...proposalSnapshot.data(),
      },
      userID: "system",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      text: "New proposal created",
      mediaUrl: "",
      mediaWidth: 0,
      mediaHeight: 0,
      deleted: false,
      isThread: false,
      seen: {},
    };

    const messagesRef = db
      .collection(isSourceProject ? "personas" : "communities")
      .doc(sourceRef.id)
      .collection(isSourceProject ? "chats" : "chat")
      .doc("all")
      .collection("messages");
    const doc = await messagesRef.add(messageData);

    functions.logger.log(`Added ${doc.id}`);

    const updateData = {
      editDate: admin.firestore.FieldValue.serverTimestamp(),
      streams: {
        [sourceRef.id]: admin.firestore.FieldValue.serverTimestamp(),
      },
    };
    const sourceData = await sourceRef.get();
    // TODO: timestamps doc will be deprecated
    const tdoc = await db
      .collection("communities")
      .doc(
        isSourceProject
          ? sourceData.get("communityID")
          : sourceRef.id,
      )
      .collection("live")
      .doc("timestamps")
      .set(updateData, { merge: true });
    functions.logger.log(`Updated timestamps ${tdoc.id}`);

    await db
      .collection("communities")
      .doc(isSourceProject ? sourceData.get("communityID") : sourceRef.id)
      .collection("live")
      .doc("activity")
      .set(
        {
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
          chats: {
            [messagesRef.path]: {
              lastActive: admin.firestore.FieldValue.serverTimestamp(),
              messageCount: admin.firestore.FieldValue.increment(1),
            },
          },
        },
        { merge: true }
      );
  });

exports.updateInlineProposalMessage = functions.firestore
  .document("{collectionName}/{entityID}/posts/{postID}")
  .onUpdate(async (change, context) => {
    const postSnapshot = change.after;
    if (!["personas", "communities"].includes(context.params.collectionName)) {
      functions.logger.warn(
        "Post found unrecognized collection type - returning early",
        postSnapshot.ref.path,
      );
      return;
    }

    const trackedFields = ["deleted", "published", "title" , "proposal.votes"];

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
      .where("proposal.postID", "==", postSnapshot.id)
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
    functions.logger.log("Changed values", changedValues);
    Object.keys(changedValues).forEach((fieldName) => {
      if (fieldName === "title") {
        updateObj["proposal.proposalTitle"] = changedValues[fieldName][1];
      }
      if (fieldName === "proposal.votes") {
        updateObj["proposal.votes"] = changedValues[fieldName][1];
      }
    });

    await Promise.all(
      docs.map(async (doc) => {
        if (postIsDeleted || postIsUnpublished) {
          functions.logger.log(`Deleting ${doc.id}`);
          return await doc.ref.update({ deleted: true });
        }
        // Update if certain attributes changed
        functions.logger.log(`Updating ${doc.id}`, updateObj);
        return await doc.ref.update(updateObj);
      }),
    );
  });
