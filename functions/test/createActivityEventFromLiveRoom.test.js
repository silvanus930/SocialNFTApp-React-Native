/* eslint-disable max-len */
/* eslint-disable no-multi-str */
process.env.NODE_ENV = "test";

const test = require("firebase-functions-test")(
  {
    databaseURL: "https://persona-test-8c340.firebaseio.com",
    storageBucket: "persona-test-8c340.appspot.com",
    projectId: "persona-test-8c340",
  },
  "./test/persona-test-8c340-8758c96719ad.json",
);

const {
  createActivityEventFromLiveRoom,
} = require("../activity/createActivityEventFromLiveRoom");
const { db, admin, functions } = require("../admin");
const { expect } = require("chai");
const sinon = require("sinon");
const {
  deletePersonas,
  deletePresenceData,
  deleteRoomsSessionsData,
  deletePublicRoomsData,
  deleteUsers,
  setupPersonaData,
  setupPostData,
  setupUsersPresentHeartbeat,
  setupRooms,
  setupSessions,
  setupUserData,
  deleteActivityData,
  deleteLiveUserData,
  deleteComments,
} = require("./helpers");

const deleteData = async () => {
  await deletePersonas();
  await deleteUsers();
  await deleteActivityData();
  await deleteLiveUserData();
  await deletePresenceData();
  await deleteComments();
  await deleteRoomsSessionsData();
  await deletePublicRoomsData();
};

describe("createActivityEventFromLiveRoom", () => {
  const wrapped = test.wrap(createActivityEventFromLiveRoom);
  const users = [
    "user1",
    "user2",
    "user3",
    "personaCoauthor",
    "personaFollower",
    "userFollower",
    "postReactor",
    "postCommenter",
  ];

  beforeEach(async () => {
    await users.forEach(async (uid) => {
      await setupUserData({
        userID: uid,
        data: {
          userName: uid,
        },
      });
    });
    await setupPersonaData({
      personaID: "1",
      data: {
        authors: ["personaCoauthor"],
        communityMembers: ["personaFollower"],
        private: false,
      },
    });
    await setupPostData({
      personaID: "1",
      postID: "1",
      data: { published: true },
    });
  });

  afterEach(async () => {
    await deleteData();
  });

  describe("in an empty room", () => {
    it("does not send any notifications", async () => {
      await setupUsersPresentHeartbeat({
        data: {},
      });
      await setupRooms({
        data: {
          "personas/1/posts/1": {},
        },
      });
      await setupSessions({
        data: {},
      });
      await wrapped();
      const personaCoauthorActivity = await db
        .collection("users")
        .doc("personaCoauthor")
        .collection("activity")
        .get();
      expect(personaCoauthorActivity.docs.length).to.equal(0);
    });
  });

  describe("in a public room with users", () => {
    describe("that is being populated for the first time", () => {
      it("sets the lastActiveSessionStartTimestamp", () => {});
    });
    describe("that is not yet active", () => {
      it("does not send any notifications", async () => {
        await setupUsersPresentHeartbeat({
          data: {
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
        await setupRooms({
          data: {
            "personas/1/posts/1": {
              user1: {
                heartbeat: admin.firestore.Timestamp.now(),
                muted: true,
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

        const now = admin.firestore.Timestamp.now();
        await setupSessions({
          data: {
            "personas/1/posts/1": {
              lastActiveSessionStartTimestamp:
                admin.firestore.Timestamp.fromMillis((now.seconds - 10) * 1000),
            },
          },
        });
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("personaCoauthor")
          .collection("activity")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(0);
      });
    });
    describe("that is going active for the first time", () => {
      beforeEach(async () => {
        await setupUsersPresentHeartbeat({
          data: {
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
        await setupRooms({
          data: {
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
        const now = admin.firestore.Timestamp.now();
        await setupSessions({
          data: {
            "personas/1/posts/1": {
              lastActiveSessionStartTimestamp:
                admin.firestore.Timestamp.fromMillis((now.seconds - 45) * 1000),
            },
          },
        });
      });
      it("notifies persona coauthors", async () => {
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("personaCoauthor")
          .collection("activity")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(1);
      });
      it.skip("notifies persona followers", async () => {
        await wrapped();
        const personaFollowerActivity = await db
          .collection("users")
          .doc("personaFollower")
          .collection("activity")
          .get();
        expect(personaFollowerActivity.docs.length).to.equal(1);
      });
      it.skip("notifies user followers", async () => {
        await db
          .collection("users")
          .doc("userFollower")
          .collection("live")
          .doc("following")
          .set({ profileFollow: ["user1"] });

        await db
          .collection("users")
          .doc("user1")
          .collection("live")
          .doc("followers")
          .set({ profileFollow: ["userFollower"] });

        await wrapped();

        const userFollowerActivity = await db
          .collection("users")
          .doc("userFollower")
          .collection("activity")
          .get();
        expect(userFollowerActivity.docs.length).to.equal(1);
      });
      it.skip("notifies users who reacted on the post", async () => {
        await db.doc("personas/1/posts/1/live/endorsements").set(
          {
            endorsements: {
              "✅": ["postReactor"],
            },
          },
          { merge: true },
        );

        await wrapped();

        const postReactorActivity = await db
          .collection("users")
          .doc("postReactor")
          .collection("activity")
          .get();
        expect(postReactorActivity.docs.length).to.equal(1);
      });
      it.skip("notifies users who commented on the post", async () => {
        await db.doc("personas/1/posts/1/comments/1").set(
          {
            userID: "postCommenter",
          },
          { merge: true },
        );

        await wrapped();
        const postCommenterActivity = await db
          .collection("users")
          .doc("postCommenter")
          .collection("activity")
          .get();
        expect(postCommenterActivity.docs.length).to.equal(1);
      });
      it("sets the lastActiveSessionTimestamp", async () => {
        await wrapped();
        const sessions = await db.collection("intents").doc("sessions").get();
        const roomsSessions = sessions.get("rooms");
        const room = roomsSessions["personas/1/posts/1"];
        expect(room.lastActiveSessionTimestamp).to.exist;
      });
      it("sets the timestamp when we sent a notification about the users in the room", async () => {
        await wrapped();
        const sessions = await db.collection("intents").doc("sessions").get();
        const roomsSessions = sessions.get("rooms");
        const notifiedUsers = roomsSessions["personas/1/posts/1"].notifiedUsers;
        expect(notifiedUsers["user1"].timestamp).to.exist;
        expect(notifiedUsers["user2"].timestamp).to.exist;
      });
    });
    describe("that is already active", () => {
      beforeEach(async () => {
        await setupUsersPresentHeartbeat({
          data: {
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
        await setupRooms({
          data: {
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
        const now = admin.firestore.Timestamp.now();
        await setupSessions({
          data: {
            "personas/1/posts/1": {
              lastActiveSessionStartTimestamp:
                admin.firestore.Timestamp.fromMillis((now.seconds - 60) * 1000),
              lastActiveSessionTimestamp: admin.firestore.Timestamp.fromMillis(
                (now.seconds - 30) * 1000,
              ),
            },
          },
        });
      });
      it("updates the lastActiveSessionTimestamp", async () => {
        let sessions = await db.collection("intents").doc("sessions").get();
        let roomsSessions = sessions.get("rooms");
        let room = roomsSessions["personas/1/posts/1"];
        const prevLastActiveSessionTimestamp =
          room.lastActiveSessionStartTimestamp;

        await wrapped();

        sessions = await db.collection("intents").doc("sessions").get();
        roomsSessions = sessions.get("rooms");
        room = roomsSessions["personas/1/posts/1"];
        expect(room.lastActiveSessionTimestamp.seconds).to.be.greaterThan(
          prevLastActiveSessionTimestamp.seconds,
        );
      });
      it("does not send a new notification if the group composition has not changed", async () => {
        await wrapped();
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("personaCoauthor")
          .collection("activity")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(1);
      });
      it("sends a new notification when a new user joins the group", async () => {
        await setupUsersPresentHeartbeat({
          data: {
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
        await setupRooms({
          data: {
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
        await wrapped();
        await setupUsersPresentHeartbeat({
          data: {
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
            user3: {
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
              user2: {
                heartbeat: admin.firestore.Timestamp.now(),
                muted: true,
                identity: "unset",
              },
              user3: {
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
          .doc("personaCoauthor")
          .collection("activity")
          .orderBy("created_at", "desc")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(2);
        const doc = personaCoauthorActivity.docs[0];
        expect(doc.data().createdByUsers.map((cu) => cu.id)).to.have.members([
          "user1",
          "user2",
          "user3",
        ]);
      });
      it("does not send a new notification when someone leaves the group", async () => {
        await setupUsersPresentHeartbeat({
          data: {
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
            user3: {
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
              user2: {
                heartbeat: admin.firestore.Timestamp.now(),
                muted: true,
                identity: "unset",
              },
              user3: {
                heartbeat: admin.firestore.Timestamp.now(),
                muted: true,
                identity: "unset",
              },
            },
          },
        });
        await wrapped();
        await setupUsersPresentHeartbeat({
          data: {
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
        await setupRooms({
          data: {
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
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("personaCoauthor")
          .collection("activity")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(1);
        const doc = personaCoauthorActivity.docs[0];
        expect(doc.data().createdByUsers.map((cu) => cu.id)).to.have.members([
          "user1",
          "user2",
          "user3",
        ]);
      });
      it("does not send a notification for the same group of users before the notification cool down has elapsed", async () => {
        await wrapped();
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("personaCoauthor")
          .collection("activity")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(1);
      });
      it("sends a notification for the same group of users after the notification cool down has elapsed", async () => {
        await wrapped();

        // Manually set the last notified user timestamps to an earlier time
        const path = "personas/1/posts/1";
        await db
          .collection("intents")
          .doc("sessions")
          .set(
            {
              rooms: {
                [path]: {
                  notifiedUsers: {
                    user1: {
                      timestamp: admin.firestore.Timestamp.fromDate(
                        new Date(Date.now() - 60 * 60 * 1000),
                      ),
                    },
                    user2: {
                      timestamp: admin.firestore.Timestamp.fromDate(
                        new Date(Date.now() - 60 * 60 * 1000),
                      ),
                    },
                  },
                },
              },
            },
            { merge: true },
          );

        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("personaCoauthor")
          .collection("activity")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(2);
      });
      it("doesn't send a notification for a backgrounded user even after cooldown has elapsed", async () => {
        await setupUsersPresentHeartbeat({
          data: {
            user1: {
              heartbeat: admin.firestore.Timestamp.now(),
              presenceObjPath: "personas/1/posts/1",
              identity: "unset",
              backgrounded: true,
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
        await wrapped();
        // Manually set the last notified user timestamps to an earlier time
        const path = "personas/1/posts/1";
        await db
          .collection("intents")
          .doc("sessions")
          .set(
            {
              rooms: {
                [path]: {
                  notifiedUsers: {
                    user1: {
                      timestamp: admin.firestore.Timestamp.fromDate(
                        new Date(Date.now() - 60 * 60 * 1000),
                      ),
                    },
                  },
                },
              },
            },
            { merge: true },
          );
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("personaCoauthor")
          .collection("activity")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(1);
      });
    });
    describe("that has just timed out", () => {
      it("removes session timestamp information", async () => {
        await setupUsersPresentHeartbeat({
          data: {},
        });
        await setupRooms({
          data: {
            "personas/1/posts/1": {},
          },
        });
        const now = admin.firestore.Timestamp.now();
        await setupSessions({
          data: {
            "personas/1/posts/1": {
              lastActiveSessionStartTimestamp:
                admin.firestore.Timestamp.fromMillis(
                  (now.seconds - 1000) * 1000,
                ),
              lastActiveSessionTimestamp: admin.firestore.Timestamp.fromMillis(
                (now.seconds - 500) * 1000,
              ),
            },
          },
        });
        await wrapped();
        const sessions = await db.collection("intents").doc("sessions").get();
        const roomsSessions = sessions.get("rooms");
        expect(
          roomsSessions["personas/1/posts/1"].lastActiveSessionTimestamp,
        ).to.equal(undefined);
        expect(
          roomsSessions["personas/1/posts/1"].lastActiveSessionStartTimestamp,
        ).to.equal(undefined);
      });
    });
    describe("with only one user", () => {
      it("sends a notification with the same semantics", async () => {
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
        const now = admin.firestore.Timestamp.now();
        await setupSessions({
          data: {
            "personas/1/posts/1": {
              lastActiveSessionStartTimestamp:
                admin.firestore.Timestamp.fromMillis((now.seconds - 45) * 1000),
            },
          },
        });
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("personaCoauthor")
          .collection("activity")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(1);
      });
    });
    describe("with a user as an identity", () => {
      it("sends a new notification when the identity changes", async () => {
        await setupPersonaData({
          personaID: "identityPersona",
          data: { name: "IdentityPersona" },
        });
        await setupUsersPresentHeartbeat({
          data: {
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
        await setupRooms({
          data: {
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
        const now = admin.firestore.Timestamp.now();
        await setupSessions({
          data: {
            "personas/1/posts/1": {
              lastActiveSessionStartTimestamp:
                admin.firestore.Timestamp.fromMillis((now.seconds - 60) * 1000),
              lastActiveSessionTimestamp: admin.firestore.Timestamp.fromMillis(
                (now.seconds - 30) * 1000,
              ),
            },
          },
        });
        await wrapped();
        await setupUsersPresentHeartbeat({
          data: {
            user1: {
              heartbeat: admin.firestore.Timestamp.now(),
              presenceObjPath: "personas/1/posts/1",
              identity: "unset",
            },
            user2: {
              heartbeat: admin.firestore.Timestamp.now(),
              presenceObjPath: "personas/1/posts/1",
              identity: "PERSONA::identityPersona",
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
              user2: {
                heartbeat: admin.firestore.Timestamp.now(),
                muted: true,
                identity: "PERSONA::identityPersona",
              },
            },
          },
        });
        await wrapped();
        const personaCoauthorActivity = await db
          .collection("users")
          .doc("personaCoauthor")
          .collection("activity")
          .orderBy("created_at", "desc")
          .get();
        expect(personaCoauthorActivity.docs.length).to.equal(2);
        const doc = personaCoauthorActivity.docs[0];
        expect(
          doc
            .data()
            .createdByUsers.map((cu) =>
              cu.isAnonymous ? cu.identity.id : cu.id,
            ),
        ).to.have.members(["user1", "identityPersona"]);

        const sessions = await db.collection("intents").doc("sessions").get();
        const roomsSessions = sessions.get("rooms");
        const room = roomsSessions["personas/1/posts/1"];
        expect(room.notifiedUsers["identityPersona"].timestamp).to.exist;
      });
    });
  });
});
