const { db, admin, functions } = require("./admin");

exports.inviteUserToProjectOrCommunity = functions.firestore
  .document("invites/{inviteID}")
  .onCreate(async (snapshot, context) => {});
