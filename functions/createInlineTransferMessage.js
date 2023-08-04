const { db, admin, functions } = require("./admin");

exports.createInlineTransferMessage = functions.firestore
  .document("transfers/{transferID}")
  .onCreate(async (transferSnapshot, context) => {
    const postRef = transferSnapshot.get("postRef");
    const sourceRef = transferSnapshot.get("sourceRef");
    const targetRef = transferSnapshot.get("targetRef");
    const amount = transferSnapshot.get("amount");
    const currency = transferSnapshot.get("currency");
    const post = await postRef.get();
    const isTargetProject = targetRef.path.includes("personas");

    const messageData = {
      messageType: "transfer",
      transfer: {
        postID: post.id,
        entityID: targetRef.id,
        transferRef: transferSnapshot.ref,
        ...transferSnapshot.data(),
      },
      userID: "system",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      text:
        post.get("title") || `${sourceRef.id} deposited ${amount} ${currency}`,
      mediaUrl: "",
      mediaWidth: 0,
      mediaHeight: 0,
      deleted: false,
      isThread: false,
      seen: {},
    };

    const messagesRef = db
      .collection(isTargetProject ? "personas" : "communities")
      .doc(targetRef.id)
      .collection(isTargetProject ? "chats" : "chat")
      .doc("all")
      .collection("messages");
    const doc = await messagesRef.add(messageData);

    functions.logger.log(`Added ${doc.id}`);

    const updateData = {
      editDate: admin.firestore.FieldValue.serverTimestamp(),
      streams: {
        [targetRef.id]: admin.firestore.FieldValue.serverTimestamp(),
      },
    };
    const targetData = await targetRef.get();
    // TODO: timestamps doc will be deprecated
    const tdoc = await db
      .collection("communities")
      .doc(
        isTargetProject
          ? targetData.get("communityID")
          : targetRef.id,
      )
      .collection("live")
      .doc("timestamps")
      .set(updateData, { merge: true });
    functions.logger.log(`Updated timestamps ${tdoc.id}`);

    await db
      .collection("communities")
      .doc(isTargetProject ? targetData.get("communityID") : targetRef.id)
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
