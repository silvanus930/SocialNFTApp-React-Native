const { get } = require("lodash");
const { db, admin, functions } = require("../admin");
const {
  getEntityCommonData,
  newCreateActivityEvent,
  markActivityEntriesDeleted,
} = require("./helpers");

function getEntityType(ref) {
  return ref.path.includes("purchasables")
    ? "purchasable"
    : ref.path.includes("personas")
    ? "persona"
    : ref.path.includes("communities")
    ? "community"
    : "user";
}

function getUserIDsToNotify(entity) {
  // Entity can be community, persona or a user
  return entity.get("members") || entity.get("authors") || entity.id;
}

function isUserMember(userID, entity) {
  if (entity === "user") {
    return false;
  }
  return (
    entity.get("members")?.includes(userID) ||
    entity.get("authors")?.includes(userID)
  );
}

exports.createActivityEventFromTransfer = functions.firestore
  .document("transfers/{transferID}")
  .onWrite(async (change, context) => {
    const before = change.before;
    const after = change.after;
    const ref = after.ref;

    if (after.exists && !before.exists) {
      const transferSnapshot = after;
      const sourceRef = transferSnapshot.get("sourceRef");
      const source = await sourceRef.get();
      const sourceType = getEntityType(sourceRef);
      const targetRef = transferSnapshot.get("targetRef");
      const target = await targetRef.get();
      const amount = transferSnapshot.get("amount");
      const currency = transferSnapshot.get("currency");
      const targetType = getEntityType(targetRef);
      const name = transferSnapshot.get("name");

      const eventData = {
        created_at: transferSnapshot.get("createdAt"),
        ref,
        event_type: "transfer",
        seen: false,
        deleted: transferSnapshot.get("deleted") || false,
        target: {
          type: targetType,
          id: target.id,
          data: {
            ...getEntityCommonData(target),
          },
          ref: target.ref,
        },
        source: {
          type: sourceType,
          id: source.id,
          data: {
            ...getEntityCommonData(source),
          },
          ref: source.ref,
        },
        transfer: {
          id: transferSnapshot.id,
          data: {
            amount,
            currency,
            name,
          },
          ref,
        },
      };

      let usersToNotify = [].concat(getUserIDsToNotify(target));

      if (sourceType !== "purchasable") {
        usersToNotify = usersToNotify.concat(getUserIDsToNotify(source));
      }

      return await Promise.all(
        usersToNotify.map(async (userID) => {
          await db
            .collection("users")
            .doc(userID)
            .collection("activity")
            .add(eventData);
        }),
      );
    } else {
      if (
        (before.exists && !after.exists) ||
        (!before.get("deleted") && after.get("deleted"))
      ) {
        return await markActivityEntriesDeleted(after);
      }
    }
  });
