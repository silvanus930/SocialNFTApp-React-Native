const { firestore } = require("firebase-admin");
const { db, functions, admin } = require("../admin");
const { createTask } = require("../tasks/createTask");

exports.createActivityEventFromNewProposal = functions.firestore
  .document("proposals/{proposalID}")
  .onCreate(async (proposalSnapshot, context) => {
    // Get the proposal and then create an activity event for every member
    // in the channel or the community. Don't yet have any nuance around
    // controlling who doesn't get notifications.

    // New proposal created on $entity: $proposalTitle

    const sourceRef = proposalSnapshot.get("sourceRef");
    const source = await sourceRef.get();
    const members = source.get("members") || source.get("authors");
    const proposalPostRef = proposalSnapshot.get("postRef");
    const proposalPost = await proposalPostRef.get();
    const createdByUserID = proposalPost.get("userID");
    const action = proposalSnapshot.get("actions").pop();
    const target = await action.targetRef.get();
    const targetName = target.get("name") || target.get("userName") || "";
    const eventData = {
      created_at: proposalSnapshot.get("createdAt"),
      event_type: "new_proposal",
      ref: proposalSnapshot.ref,
      seen: false,
      deleted: proposalSnapshot.get("deleted") || false,
      post: {
        id: proposalPost.id,
        ref: proposalPost.ref,
      },
      entity: {
        id: source.id,
        data: {
          name: source.get("name"),
          profileImgUrl: source.get("profileImgUrl"),
        },
        ref: sourceRef,
      },
      proposal: {
        id: proposalSnapshot.id,
        data: {
          title: proposalPost.get("title"),
          currency: action.currency,
          amount: action.amount,
          targetName,
        },
        ref: proposalSnapshot.ref,
      },
    };
    return await Promise.all(
      members
        .filter((memberUserID) => memberUserID !== createdByUserID)
        .map(async (memberUserID) => {
          try {
            return await db
              .collection("users")
              .doc(memberUserID)
              .collection("activity")
              .add(eventData);
          } catch (err) {
            functions.logger.error(
              `Failed to create new proposal activity event for userID ${memberUserID} and proposalID ${proposalSnapshot.id}`,
            );
            functions.logger.error(err.toString());
          }
        }),
    );
  });

exports.createNotificationTasksFromNewProposal = functions.firestore
  .document("proposals/{proposalID}")
  .onCreate(async (snapshot, context) => {
    const endTime = snapshot.get("endTime");
    const proposalEndingWarningTime = snapshot.get("endTime").toDate();
    // 24 hour warning for proposal ending
    proposalEndingWarningTime.setDate(proposalEndingWarningTime.getDate() - 1);
    createTask({
      performAt: admin.firestore.Timestamp.fromDate(proposalEndingWarningTime),
      ref: snapshot.ref,
      status: "scheduled",
      options: { proposalID: snapshot.id },
      worker: "createActivityEventForProposalEndingSoon",
    });

    createTask({
      performAt: endTime,
      ref: snapshot.ref,
      options: { proposalID: snapshot.id },
      status: "scheduled",
      worker: "createActivityEventForProposalEnded",
    });
  });

exports.updateProposalActivityEventsAndTasksFromProposalChange =
  functions.firestore
    .document("proposals/{proposalID}")
    .onUpdate(async (change, context) => {
      // Check and respond for updates to deletion
      if (change.before && change.after) {
        if (!change.before.get("deleted") && change.after.get("deleted")) {
          // Delete activity events, tasks
          const ref = change.after.ref;
          const activityEvents = await db
            .collectionGroup("activity")
            .where("proposal.ref", "==", ref)
            .get();

          if (activityEvents.docs.length > 0) {
            await Promise.all(
              activityEvents.docs.map(async (doc) => {
                await doc.ref.update({ deleted: true });
              }),
            );
          }

          const tasks = await db
            .collection("tasks")
            .where("ref", "==", ref)
            .get();

          if (tasks.docs.length > 0) {
            await Promise.all(
              tasks.docs.map(async (doc) => {
                await doc.ref.update({ status: "canceled" });
              }),
            );
          }
          return;
        }
      }
    });

exports.createActivityEventForProposalEndingSoon =
  async function createActivityEventForProposalEndingSoon({ proposalID }) {
    functions.logger.info(
      `Creating create proposal_ending_soon activity event for proposalID ${proposalID}`,
    );
    const proposalSnapshot = await db
      .collection("proposals")
      .doc(proposalID)
      .get();
    const sourceRef = proposalSnapshot.get("sourceRef");
    const source = await sourceRef.get();
    const members = source.get("members") || source.get("authors");
    const proposalPostRef = proposalSnapshot.get("postRef");
    const proposalPost = await proposalPostRef.get();
    const action = proposalSnapshot.get("actions").pop();
    const target = await action.targetRef.get();
    const targetName = target.get("name") || target.get("userName") || "";
    const entityType = sourceRef.path.includes("communities")
      ? "community"
      : "persona";
    const eventData = {
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      event_type: "proposal_ending_soon",
      ref: proposalSnapshot.ref,
      seen: false,
      deleted: proposalSnapshot.get("deleted") || false,
      post: {
        id: proposalPost.id,
        ref: proposalPost.ref,
      },
      [entityType]: {
        id: source.id,
        data: {
          name: source.get("name"),
          profileImgUrl: source.get("profileImgUrl"),
        },
        ref: sourceRef,
      },
      proposal: {
        id: proposalSnapshot.id,
        data: {
          endTime: proposalSnapshot.get("endTime"),
          title: proposalPost.get("title"),
          currency: action.currency,
          amount: action.amount,
          targetName,
        },
        ref: proposalSnapshot.ref,
      },
    };
    return await Promise.all(
      members.map(async (memberUserID) => {
        try {
          return await db
            .collection("users")
            .doc(memberUserID)
            .collection("activity")
            .add(eventData);
        } catch (err) {
          functions.logger.error(
            `Failed to create proposal_ending_soon activity event for userID ${memberUserID} and proposalID ${proposalSnapshot.id}`,
          );
          functions.logger.error(err.toString());
        }
      }),
    );
  };

function getVoteOutcome(votes, quorum) {
  const voteValues = Object.values(votes);
  const votesFor = voteValues.filter((val) => val === 0).length;
  const votesAgainst = voteValues.filter((val) => val === 1).length;
  const votesAbstained = voteValues.filter((val) => val === 2).length;

  const results = { votesFor, votesAgainst, votesAbstained };
  if (votesFor + votesAgainst + votesAbstained < quorum) {
    results.result = "quorumNotReached";
  } else if (votesFor > votesAgainst) {
    results.result = "passed";
  } else if (votesFor <= votesAgainst) {
    results.result = "failed";
  } else {
    throw new Error("Unrecognized voting outcome");
  }

  return results;
}

exports.createActivityEventForProposalEnded =
  async function createActivityEventForProposalEnded({ proposalID }) {
    functions.logger.log(
      `Creating create proposal_ended activity event for proposalID ${proposalID} with multiple targets`,
    );
    const proposalSnapshot = await db
      .collection("proposals")
      .doc(proposalID)
      .get();

    const votes = proposalSnapshot.get("votes");
    const quorum = proposalSnapshot.get("quorum");
    const voteOutcome = getVoteOutcome(votes, quorum);
    const sourceRef = proposalSnapshot.get("sourceRef");
    const source = await sourceRef.get();
    const sourceName = source.get("name") || source.get("userName") || "";
    let members = source.get("members") || source.get("authors");

    const proposalPostRef = proposalSnapshot.get("postRef");
    const proposalPost = await proposalPostRef.get();
    const entityType = sourceRef.path.includes("communities")
      ? "community"
      : "persona";

    // Parse for multiple actions here
    const actions = proposalSnapshot.get("actions");
    const proposalDataList = [];
    let memberSet = new Set();
    members.forEach(m => memberSet.add(m));

    // For each item in targets list, we're going to subtract from targets, sequentially for now
    for (let action of actions) {
      const proposalData = {};
      const targetRef = action.targetRef;
      const target = await targetRef.get();
      const targetName = target.get("name") || target.get("userName") || "";
      const amount = action.amount;

      proposalData.targetName = targetName;
      proposalData.amount = amount;
      proposalData.currency = action.currency;
      proposalDataList.push(proposalData);

      if (voteOutcome.result === "passed") {
        const updatedSrc = await sourceRef.get();
        const currency = action.currency.toLowerCase();  
        const sourceBalance = updatedSrc.get("walletBalance") || {};
        const sourceBalanceAmount = sourceBalance[currency] || 0;
        const newSourceBalanceAmount = sourceBalanceAmount - amount;
        functions.logger.info(
          `Withdrawing ${amount} from source ${sourceName} with SourceBalance: ${sourceBalanceAmount}`,
        );

        if (newSourceBalanceAmount < 0) {
          functions.logger.error(
            `Not enough balance (${sourceBalanceAmount}) in source channel to withdraw ${amount} from!`,
          );
          return;
        }
        const newSourceBalance = {
          ...sourceBalance,
          [currency]: newSourceBalanceAmount,
        };
        await sourceRef.update({ walletBalance: newSourceBalance });

        const targetBalance = target.get("walletBalance") || {};
        const targetBalanceAmount = targetBalance[currency] || 0;
        const newTargetBalanceAmount = targetBalanceAmount + amount;
        const newTargetBalance = {
          ...targetBalance,
          [currency]: newTargetBalanceAmount,
        };
        await targetRef.update({ walletBalance: newTargetBalance });
  
        await firestore().collection("transfers").add({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          snapshotTime: admin.firestore.FieldValue.serverTimestamp(),
          amount,
          currency : currency.toUpperCase(),
          sourceRef,
          targetRef,
          postRef: proposalPostRef,
        });
  
        await targetRef.collection("posts").add({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          snapshotTime: admin.firestore.FieldValue.serverTimestamp(),
          type: "transfer",
          transfer: {
            amount,
            currency,
            sourceRef : targetRef,
            targetRef : sourceRef,
            postRef: proposalPostRef,
            email : targetName,
          },
          title : `${source.get("name")} transfered ${amount} ${currency}`,
          deleted : false,
          publishDate: admin.firestore.FieldValue.serverTimestamp(),
          createDate : admin.firestore.FieldValue.serverTimestamp(),
          showInCommunityChat : true,
          published : true,
        });
  
        await sourceRef.collection("posts").add({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          snapshotTime: admin.firestore.FieldValue.serverTimestamp(),
          type: "transfer",
          transfer: {
            amount : -amount,
            currency,
            sourceRef,
            targetRef,
            postRef: proposalPostRef,
            email : targetName,
          },
          deleted : false,
          title : `Transfered ${amount} ${currency} to ${targetName}`,
          publishDate: admin.firestore.FieldValue.serverTimestamp(),
          createDate : admin.firestore.FieldValue.serverTimestamp(),
          showInCommunityChat : true,
          published : true,
        });
      }
    }

    const eventData = {
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        event_type: "proposal_ended",
        ref: proposalSnapshot.ref,
        seen: false,
        deleted: proposalSnapshot.get("deleted") || false,
        post: {
          id: proposalPost.id,
          ref: proposalPost.ref,
        },
        [entityType]: {
          id: source.id,
          data: {
            name: source.get("name"),
            profileImgUrl: source.get("profileImgUrl"),
          },
          ref: sourceRef,
        },
        proposal: {
          id: proposalSnapshot.id,
          data: {
            voteOutcome,
            endTime: proposalSnapshot.get("endTime"),
            title: proposalPost.get("title"),
            targets: proposalDataList,
          },
          ref: proposalSnapshot.ref,
        },
      };

    functions.logger.info(
      `Sending proposal_ended activity event createActivityEventForProposalEndedMultiple eventData: ${JSON.stringify(eventData)}`,
    );

    members = Array.from(memberSet);
    return await Promise.all(
      members.map(async (memberUserID) => {
        try {
          return await db
            .collection("users")
            .doc(memberUserID)
            .collection("activity")
            .add(eventData);
        } catch (err) {
          functions.logger.error(
            `Failed to create proposal_ended activity event for userID ${memberUserID} and proposalID ${proposalSnapshot.id}`,
          );
          functions.logger.error(err.toString());
        }
      }),
    );
  };
