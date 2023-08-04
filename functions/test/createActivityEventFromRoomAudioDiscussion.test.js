/* eslint-disable no-multi-str */
process.env.NODE_ENV = "test";

const test = require("firebase-functions-test")(
  {
    databaseURL: "https://persona-test-8c340.firebaseio.com",
    storageBucket: "persona-test-8c340.appspot.com",
    projectId: "persona-test-8c340",
  },
  "./test/persona-test-8c340-8758c96719ad.json"
);

const {
  createActivityEventFromRoomAudioDiscussion,
} = require("../activity/createActivityEventFromRoomAudioDiscussion");
const { db, admin, functions } = require("../admin");
const { expect } = require("chai");
const sinon = require("sinon");

const deleteData = async () => {
  const activity = await db.collectionGroup("activity").get();
  for (const doc of activity.docs) {
    await doc.ref.delete();
  }
  const personas = await db.collection("personas").get();
  for (const doc of personas.docs) {
    await doc.ref.delete();
  }

  const users = await db.collection("users").get();
  for (const doc of users.docs) {
    await doc.ref.delete();
  }

  const presence = await db.collection("intents").doc("public").get();
  await presence.ref.delete();

  const publicRooms = await db.collection("intents").doc("publicrooms").get();
  await publicRooms.ref.delete();

  const roomsSessions = await db.collection("intents").doc("sessions").get();
  await roomsSessions.ref.delete();
};

const setupUsersPresentHeartbeat = async ({ data }) => {
  await db
    .collection("intents")
    .doc("public")
    .set({
      usersPresentHeartbeat: {
        ...data,
      },
    });
};

const setupRooms = async ({ data }) => {
  await db.doc("intents/publicrooms").set({
    rooms: {
      ...data,
    },
  });
};

const setupSessions = async ({ data }) => {
  await db.doc("intents/sessions").set({
    rooms: {
      ...data,
    },
  });
};

const setupPresenceData = async () => {
  await db
    .collection("intents")
    .doc("public")
    .set({
      usersPresentHeartbeat: {
        user1: {
          heartbeat: admin.firestore.Timestamp.now(),
          presenceObjPath: "personas/1/posts/1",
          identity: "unset",
        },
        user2: {
          heartbeat: admin.firestore.Timestamp.now(),
          presenceObjPath: "personas/1/posts/1",
          identity: "unset",
        },
      },
    });

  await db.doc("intents/publicrooms").set({
    rooms: {
      "personas/1/posts/1": {
        user1: {
          heartbeat: admin.firestore.Timestamp.now(),
          muted: false,
          identity: "unset",
        },
        user2: {
          heartbeat: admin.firestore.Timestamp.now(),
          muted: true,
          identity: "unset",
        },
      },
    },
  });

  await db.doc("intents/sessions").set({
    rooms: {
      "personas/1/posts/1": {
        lastActiveSessionStartTimestamp: admin.firestore.Timestamp.fromDate(
          new Date(2021, 0, 1)
        ),
        // lastActiveSessionTimestamp: admin.firestore.Timestamp.now(),
      },
    },
  });
};

const setupPersonaData = async ({ personaID, data = {} }) => {
  await db
    .collection("personas")
    .doc(personaID)
    .set(
      {
        ...data,
      },
      { merge: true }
    );
};

const setupPostData = async ({ personaID, postID, data = {} }) => {
  await db
    .collection("personas")
    .doc(personaID)
    .collection("posts")
    .doc(postID)
    .set(
      {
        ...data,
      },
      { merge: true }
    );
};

const setupUserData = async () => {
  await db
    .collection("users")
    .doc("user1")
    .set({ userName: "USERONE" }, { merge: true });

  await db
    .collection("users")
    .doc("user2")
    .set({ userName: "USERTWO" }, { merge: true });

  await db
    .collection("users")
    .doc("user1")
    .collection("live")
    .doc("followers")
    .set({ profileFollow: ["user3"] }, { merge: true });

  await Promise.all(
    ["user3", "user4", "user5", "user6", "user7", "user8"].map(async (uid) => {
      await db.collection("users").doc(uid).set({ name: uid }, { merge: true });
    })
  );
};

describe("createActivityEventFromRoomAudioDiscussion", () => {
  const wrapped = test.wrap(createActivityEventFromRoomAudioDiscussion);
  let log;
  let error;

  beforeEach(async () => {
    log = sinon.spy(functions.logger, "log");
    error = sinon.spy(functions.logger, "error");
  });

  afterEach(async () => {
    log.restore();
    error.restore();
    await deleteData();
  });
  describe("in any room with less than two unmuted users", () => {
    it("does not send a notification", async () => {
      await setupUsersPresentHeartbeat({
        data: {
          user1: {
            heartbeat: admin.firestore.Timestamp.now(),
            presenceObjPath: "personas/1/posts/1",
            identity: "unset",
          },
        },
      });

      await setupRooms({
        data: {
          "personas/1/posts/1": {
            user1: {
              heartbeat: admin.firestore.Timestamp.now(),
              muted: false,
              identity: "unset",
            },
          },
        },
      });

      await setupSessions({ data: {} });
      await setupPersonaData({
        personaID: "1",
        data: { private: false, authors: ["user1", "user4"] },
      });

      await wrapped();
      const coauthorActivity = await db
        .collection("users")
        .doc("user4")
        .collection("activity")
        .get();
      expect(coauthorActivity.docs.length).to.equal(0);
    });
  });

  describe("in a public room with at least two users in it", () => {
    beforeEach(async () => {
      await setupPresenceData();
      await setupPersonaData({
        personaID: "1",
        data: {
          authors: ["user1", "user4"],
          communityMembers: ["user5"],
          private: false,
        },
      });
      await setupPostData({
        personaID: "1",
        postID: "1",
        data: { published: true },
      });
      await setupUserData();
    });
    describe("with a user talking", () => {
      beforeEach(async () => {
        // Add user follower for user1
        await db
          .collection("users")
          .doc("user3")
          .collection("live")
          .doc("following")
          .set({ profileFollow: ["user1"] });

        // Set user1 to be talking
        const path = "personas/1/posts/1";
        await db
          .collection("users")
          .doc("user1")
          .collection("live")
          .doc("talking")
          .set(
            {
              [path]: {
                volume: 100,
              },
            },
            { merge: true }
          );
      });

      it("notifies persona coauthors", async () => {
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("user4")
          .collection("activity")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(1);
      });

      it("notifies persona followers", async () => {
        await wrapped();
        const personaFollowerActivity = await db
          .collection("users")
          .doc("user5")
          .collection("activity")
          .get();
        expect(personaFollowerActivity.docs.length).to.equal(1);
      });

      it("notifies user followers", async () => {
        await wrapped();
        const userFollowerActivity = await db
          .collection("users")
          .doc("user3")
          .collection("activity")
          .get();
        expect(userFollowerActivity.docs.length).to.equal(1);
      });

      it("notifies users who reacted on the post", async () => {
        await db.doc("personas/1/posts/1/live/endorsements").set(
          {
            endorsements: {
              "✅": ["user7"],
            },
          },
          { merge: true }
        );

        await wrapped();

        const postReactorActivity = await db
          .collection("users")
          .doc("user7")
          .collection("activity")
          .get();
        expect(postReactorActivity.docs.length).to.equal(1);
      });

      it("notifies users who commented on the post", async () => {
        await db.doc("personas/1/posts/1/comments/1").set(
          {
            userID: "user6",
          },
          { merge: true }
        );

        await wrapped();
        const postCommenterActivity = await db
          .collection("users")
          .doc("user6")
          .collection("activity")
          .get();
        expect(postCommenterActivity.docs.length).to.equal(1);
      });

      it("it does not notify users who have already been notified \
          before the cooldown period has elapsed", async () => {
        await wrapped();
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("user4")
          .collection("activity")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(1);
      });

      it("it notifies users who have already been notified only after \
          the cooldown period has elapsed", async () => {
        await wrapped();

        // Manually set the last speaker timestamp to an earlier time
        const path = "personas/1/posts/1";
        await db
          .collection("intents")
          .doc("sessions")
          .set(
            {
              rooms: {
                [path]: {
                  notifiedSpeakers: {
                    user1: {
                      timestamp: admin.firestore.Timestamp.fromDate(
                        new Date(Date.now() - 60 * 60 * 1000)
                      ),
                    },
                  },
                },
              },
            },
            { merge: true }
          );

        await wrapped();

        const personaCoauthorActivity = await db
          .collection("users")
          .doc("user4")
          .collection("activity")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(2);
      });

      it("updates the room session to show when we last sent a notification \
          about the current user speaking", async () => {
        await wrapped();
        const sessions = await db.collection("intents").doc("sessions").get();
        const sessionsData = sessions.data();
        const room = sessionsData.rooms["personas/1/posts/1"];
        expect(room.notifiedSpeakers).to.have.property("user1");
        expect(room.notifiedSpeakers.user1).to.have.property("timestamp");
        expect(room.notifiedSpeakers).not.to.have.property("user2");
      });

      it("sets the other users in the room as listeners", async () => {
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("user4")
          .collection("activity")
          .get();
        const doc = personaCoauthorActivity.docs[0];
        const eventData = doc.data();
        expect(eventData.listeningUsers.length).to.equal(1);
        expect(eventData.listeningUsers[0].id).to.equal("user2");
      });

      describe("with a user talking as an identity", () => {
        beforeEach(async () => {
          await db.doc("intents/publicrooms").set({
            rooms: {
              "personas/1/posts/1": {
                user1: {
                  heartbeat: admin.firestore.Timestamp.now(),
                  muted: false,
                  identity: "PERSONA::identityPersona",
                },
                user2: {
                  heartbeat: admin.firestore.Timestamp.now(),
                  muted: true,
                  identity: "unset",
                },
              },
            },
          });

          await db.doc("personas/identityPersona").set({
            name: "IdentityPersona",
            profileImgUrl: "",
          });
        });
        it("correctly sets the identity field in the activity event", async () => {
          await wrapped();
          const personaCoauthorActivity = await db
            .collection("users")
            .doc("user4")
            .collection("activity")
            .get();

          const doc = personaCoauthorActivity.docs[0];
          const eventData = doc.data();
          expect(eventData.createdByUserIDs).to.have.members([
            "identityPersona",
          ]);
          expect(eventData.createdByUserIDs).not.to.have.members(["user1"]);
        });

        it("notifies users again if the user switches identities", async () => {
          await db.doc("personas/identityPersona2").set({
            name: "IdentityPersona2",
            profileImgUrl: "",
          });

          await wrapped();

          await db.doc("intents/publicrooms").set({
            rooms: {
              "personas/1/posts/1": {
                user1: {
                  heartbeat: admin.firestore.Timestamp.now(),
                  muted: false,
                  identity: "PERSONA::identityPersona2",
                },
                user2: {
                  heartbeat: admin.firestore.Timestamp.now(),
                  muted: true,
                  identity: "unset",
                },
              },
            },
          });

          await wrapped();

          const personaCoauthorActivity = await db
            .collection("users")
            .doc("user4")
            .collection("activity")
            .orderBy("created_at", "desc")
            .get();

          expect(personaCoauthorActivity.docs.length).to.equal(2);
          expect(
            personaCoauthorActivity.docs[0].get("createdByUserIDs")
          ).to.have.members(["identityPersona2"]);
          expect(
            personaCoauthorActivity.docs[1].get("createdByUserIDs")
          ).to.have.members(["identityPersona"]);
        });

        it("notifies identity persona followers and user followers", async () => {
          await db.doc("personas/identityPersona").set({
            name: "IdentityPersona",
            profileImgUrl: "",
            communityMembers: ["user8"],
          });

          await wrapped();

          const userFollowerActivity = await db
            .collection("users")
            .doc("user3")
            .collection("activity")
            .get();
          expect(userFollowerActivity.docs.length).to.equal(1);

          const personaFollowerActivity = await db
            .collection("users")
            .doc("user8")
            .collection("activity")
            .get();
          expect(personaFollowerActivity.docs.length).to.equal(1);
        });

        describe("as an unattributed persona", () => {
          it("notifies persona followers instead of user followers", async () => {
            await db.doc("personas/identityPersona").set({
              name: "IdentityPersona",
              profileImgUrl: "",
              anonymous: true,
              communityMembers: ["user8"],
            });

            await wrapped();

            const userFollowerActivity = await db
              .collection("users")
              .doc("user3")
              .collection("activity")
              .get();
            expect(userFollowerActivity.docs.length).to.equal(0);

            const personaFollowerActivity = await db
              .collection("users")
              .doc("user8")
              .collection("activity")
              .get();
            expect(personaFollowerActivity.docs.length).to.equal(1);
          });
        });
      });

      describe("with a user listening as an identity", () => {
        beforeEach(async () => {
          console.log("setting things!");
          await db.doc("intents/publicrooms").set({
            rooms: {
              "personas/1/posts/1": {
                user1: {
                  heartbeat: admin.firestore.Timestamp.now(),
                  muted: false,
                  identity: "unset",
                },
                user2: {
                  heartbeat: admin.firestore.Timestamp.now(),
                  muted: true,
                  identity: "PERSONA::identityPersona",
                },
              },
            },
          });

          await db.doc("personas/identityPersona").set({
            name: "IdentityPersona",
            profileImgUrl: "",
          });
          console.log("done setting things!");
        });
        it("correctly sets the identity as a listener", async () => {
          await wrapped();
          const personaCoauthorActivity = await db
            .collection("users")
            .doc("user4")
            .collection("activity")
            .get();
          const doc = personaCoauthorActivity.docs[0];
          const eventData = doc.data();
          expect(eventData.listeningUsers.length).to.equal(1);
          console.log(eventData.listeningUsers);
          expect(eventData.listeningUsers[0].id).to.equal("user2");
          expect(eventData.listeningUsers[0].isAnonymous).to.equal(true);
          expect(eventData.listeningUsers[0].identity.id).to.equal(
            "identityPersona"
          );
        });
      });
    });
    describe("with multiple users talking at once", () => {
      beforeEach(async () => {
        await db.doc("intents/publicrooms").set({
          rooms: {
            "personas/1/posts/1": {
              user1: {
                heartbeat: admin.firestore.Timestamp.now(),
                muted: false,
                identity: "unset",
              },
              user2: {
                heartbeat: admin.firestore.Timestamp.now(),
                muted: false,
                identity: "unset",
              },
            },
          },
        });

        // Set user1 and user2 to be talking
        const path = "personas/1/posts/1";
        await db
          .collection("users")
          .doc("user1")
          .collection("live")
          .doc("talking")
          .set(
            {
              [path]: {
                volume: 100,
              },
            },
            { merge: true }
          );

        await db
          .collection("users")
          .doc("user2")
          .collection("live")
          .doc("talking")
          .set(
            {
              [path]: {
                volume: 100,
              },
            },
            { merge: true }
          );
      });
      it("shows all users in the activity event", async () => {
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("user4")
          .collection("activity")
          .get();
        const doc = personaCoauthorActivity.docs[0];
        expect(doc.get("createdByUserIDs")).to.have.members(["user1", "user2"]);
      });

      it("correctly sets all users as having recently had a notification sent\
         about their speaking in the room", async () => {
        await wrapped();
        const sessions = await db.collection("intents").doc("sessions").get();
        const sessionsData = sessions.data();
        const room = sessionsData.rooms["personas/1/posts/1"];
        expect(room.notifiedSpeakers).to.have.property("user1");
        expect(room.notifiedSpeakers).to.have.property("user2");
      });
    });
  });
});
