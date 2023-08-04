#!/usr/bin/env node

const { admin } = require("../admin");
const _ = require("lodash");
const AsciiTable = require("ascii-table");

const db = admin.firestore();

async function getPostsAnalytics({ print = false }) {
  let numTotalUsers = 0;
  const postsCollectionGroup = await db.collectionGroup("posts").get();
  const postsData = postsCollectionGroup.docs
    .map((doc) => {
      const editDate = doc.get("editDate");
      const userID = doc.get("userID");
      const userName = doc.get("userName");
      if (!!editDate && !!userID && !!userName) {
        return { editDateSeconds: editDate.seconds, userName, userID };
      } else {
        return null;
      }
    })
    .filter((obj) => obj !== null);

  const uniqueData = _.uniqWith(postsData, _.isEqual);
  const grouped = _.groupBy(uniqueData, "userID");

  const aggregatedData = Object.keys(grouped).map((userID) => {
    const lastPostDateSeconds = Math.max(
      ...grouped[userID].map((obj) => obj.editDateSeconds),
    );
    const daysSinceLastPost = Math.floor(
      (new Date().getTime() / 1000 - lastPostDateSeconds) / (60 * 60 * 24),
    );
    return {
      userID,
      userName: grouped[userID][0].userName,
      totalPosts: grouped[userID].length,
      lastPostTimestamp: new Date(lastPostDateSeconds * 1000),
      daysSinceLastPost,
    };
  });

  let sortedData = _.reverse(_.sortBy(aggregatedData, "lastPostTimestamp"));

  // Filter out non-human users and add in users who never posted at the bottom
  const usersCollection = await getUsersCollection();
  const humanUsers = usersCollection.docs
    .map((doc) => {
      if (doc.get("human")) {
        numTotalUsers += 1;
        return { userID: doc.id, userName: doc.get("userName") };
      } else {
        return null;
      }
    })
    .filter((u) => u !== null);
  const humanUserIDs = humanUsers.map((user) => user.userID);

  sortedData = sortedData.filter((user) => humanUserIDs.includes(user.userID));
  const sortedDataUserIDs = sortedData.map((user) => user.userID);
  humanUsers.forEach((user) => {
    if (!sortedDataUserIDs.includes(user.userID)) {
      sortedData.push({
        userName: user.userName,
        totalPosts: 0,
        lastPostTimestamp: "N/A",
        daysSinceLastPost: "N/A",
      });
    }
  });

  const num28dUsersPosted = sortedData.filter(
    (entry) => entry.daysSinceLastPost <= 28,
  ).length;

  const num7dUsersPosted = sortedData.filter(
    (entry) => entry.daysSinceLastPost <= 7,
  ).length;

  const num1dUsersPosted = sortedData.filter(
    (entry) => entry.daysSinceLastPost <= 1,
  ).length;

  const results = {
    numTotalUsers,
    num28dUsersPosted,
    num7dUsersPosted,
    num1dUsersPosted,
  };

  if (print) {
    const table = new AsciiTable("User Post Analytics");
    table.setHeading(
      "userName",
      "totalPosts",
      "lastPostTimestamp",
      "daysSinceLastPost",
    );

    sortedData.forEach(
      ({ userName, totalPosts, lastPostTimestamp, daysSinceLastPost }) => {
        table.addRow(
          userName,
          totalPosts,
          lastPostTimestamp.toLocaleString(),
          daysSinceLastPost,
        );
      },
    );

    console.log(table.toString());
    console.log("\n");
    console.log("Total num users: ", numTotalUsers);
    console.log("Num users posted last 28 days: ", num28dUsersPosted);
    console.log(
      "Pct 28d posted: ",
      ((num28dUsersPosted / numTotalUsers) * 100).toFixed(1) + "%",
    );
    console.log("\n");
  }

  return results;
}

async function getCommentsAnalytics({ print = false }) {
  const getDateNDaysAgo = (N) => {
    const d = new Date();
    d.setDate(d.getDate() - N);
    return d;
  };

  const cofounderUserIDs = [
    "94hKmQP9DEhZICfZEebFq5rl8VZ2",
    "PHobeplJLROyFlWhXPINseFVkK32",
  ];

  const daysAgo28 = getDateNDaysAgo(28);
  const commentsCollectionGroup = await db
    .collectionGroup("comments")
    .where("timestamp", ">=", daysAgo28)
    .get();

  // TODO: This collection group also contains thread messages as well
  const threadCommentsCollectionGroup = await db
    .collectionGroup("threads")
    .where("timestamp", ">=", daysAgo28)
    .get();

  const commentsData = commentsCollectionGroup.docs
    .map((doc) => {
      const timestamp = doc.get("timestamp");
      const userID = doc.get("userID");
      if (!!timestamp && !!userID) {
        return { timestampSeconds: timestamp.seconds, userID };
      } else {
        return null;
      }
    })
    .filter((obj) => obj !== null);

  const threadCommentsData = threadCommentsCollectionGroup.docs
    .map((doc) => {
      const timestamp = doc.get("timestamp");
      const userID = doc.get("userID");
      if (!!timestamp && !!userID) {
        return { timestampSeconds: timestamp.seconds, userID };
      } else {
        return null;
      }
    })
    .filter((obj) => obj !== null);

  const allCommentsData = commentsData.concat(threadCommentsData);

  const daysAgo1 = getDateNDaysAgo(1);
  const daysAgo7 = getDateNDaysAgo(7);
  let num28dComments = 0;
  let numNonCofounder28dComments = 0;
  let num7dComments = 0;
  let numNonCofounder7dComments = 0;
  let num1dComments = 0;
  let numNonCofounder1dComments = 0;

  const users28dCommented = new Set();
  const nonCofounderUsers28dCommented = new Set();
  const users7dCommented = new Set();
  const nonCofounderUsers7dCommented = new Set();
  const users1dCommented = new Set();
  const nonCofounderUsers1dCommented = new Set();

  allCommentsData.forEach((comment) => {
    num28dComments += 1;
    users28dCommented.add(comment.userID);

    if (!cofounderUserIDs.includes(comment.userID)) {
      numNonCofounder28dComments += 1;
      nonCofounderUsers28dCommented.add(comment.userID);
    }

    if (comment.timestampSeconds >= daysAgo7.getTime() / 1000) {
      users7dCommented.add(comment.userID);
      num7dComments += 1;
      if (!cofounderUserIDs.includes(comment.userID)) {
        numNonCofounder7dComments += 1;
        nonCofounderUsers7dCommented.add(comment.userID);
      }
    }
    if (comment.timestampSeconds >= daysAgo1.getTime() / 1000) {
      users1dCommented.add(comment.userID);
      num1dComments += 1;
      if (!cofounderUserIDs.includes(comment.userID)) {
        numNonCofounder1dComments += 1;
        nonCofounderUsers1dCommented.add(comment.userID);
      }
    }
  });

  const results = {
    num28dComments,
    num28dUsersCommented: users28dCommented.size,
    numNonCofounder28dComments,
    num28dNonCofounderUsersCommented: nonCofounderUsers28dCommented.size,
    num7dComments,
    num7dUsersCommented: users7dCommented.size,
    numNonCofounder7dComments,
    num7dNonCofounderUsersCommented: nonCofounderUsers7dCommented.size,
    num1dComments,
    num1dUsersCommented: users1dCommented.size,
    numNonCofounder1dComments,
    num1dNonCofounderUsersCommented: nonCofounderUsers1dCommented.size,
  };

  return results;
}

async function getPostEndorsementAnalytics({ print = false }) {
  const postsCollectionGroup = await db.collectionGroup("posts").get();
  const userPostEndorsementsData = {};
  await Promise.all(
    postsCollectionGroup.docs.map(async (doc) => {
      const endorsements = await doc.ref.collection("endorsements").get();
      if (endorsements.docs.length > 0) {
        const endorsedUserIDs = [];
        endorsements.docs.forEach((doc) => {
          endorsedUserIDs.push(doc.id);
        });
        const seen = doc.get("seen");
        endorsedUserIDs.forEach((userID) => {
          try {
            if (!{}.hasOwnProperty.call(userPostEndorsementsData, userID)) {
              // If we don't have seen data then add 1 as a placeholder value
              userPostEndorsementsData[userID] = [
                (seen[userID] && seen[userID].seconds) || 1,
              ];
            } else {
              userPostEndorsementsData[userID].push(
                (seen[userID] && seen[userID].seconds) || 1,
              );
            }
          } catch (e) {
            // no-op
          }
        });
      }
    }),
  );

  const usersCollection = await getUsersCollection();
  const humanUserMap = {};
  usersCollection.docs.forEach((doc) => {
    if (doc.get("human")) {
      humanUserMap[doc.id] = {
        userID: doc.id,
        userName: doc.get("userName"),
      };
    }
  });
  const humanUserIDs = Object.keys(humanUserMap);

  const table = new AsciiTable("User Post Endorsement Analytics");
  table.setHeading(
    "userName",
    "totalPostEndorsements",
    "lastPostEndorsementTimestamp",
    "daysSinceLastPostEndorsement",
  );

  const displayData = [];

  Object.keys(userPostEndorsementsData).forEach((userID) => {
    if (humanUserIDs.includes(userID)) {
      const userName = humanUserMap[userID].userName;
      const totalPostEndorsements = userPostEndorsementsData[userID].length;
      const lastPostEndorsementSeconds = Math.max(
        ...userPostEndorsementsData[userID],
      );
      let lastPostEndorsementTimestamp;
      let daysSinceLastPostEndorsement;
      if (lastPostEndorsementSeconds === 1) {
        lastPostEndorsementTimestamp = "N/A";
        daysSinceLastPostEndorsement = "N/A";
      } else {
        lastPostEndorsementTimestamp = new Date(
          lastPostEndorsementSeconds * 1000,
        );
        daysSinceLastPostEndorsement = Math.floor(
          (new Date().getTime() / 1000 - lastPostEndorsementSeconds) /
            (60 * 60 * 24),
        );
      }
      displayData.push({
        userID,
        userName,
        totalPostEndorsements,
        lastPostEndorsementTimestamp,
        daysSinceLastPostEndorsement,
      });
    }
  });

  const sortedDisplayData = _.reverse(
    _.sortBy(displayData, "lastPostEndorsementTimestamp"),
  );

  const sortedDisplayDataUserIDs = sortedDisplayData.map((user) => user.userID);
  humanUserIDs.forEach((userID) => {
    if (!sortedDisplayDataUserIDs.includes(userID)) {
      sortedDisplayData.push({
        userName: humanUserMap[userID].userName,
        totalPostEndorsements: 0,
        lastPostEndorsementTimestamp: "N/A",
        daysSinceLastPostEndorsement: "N/A",
      });
    }
  });

  sortedDisplayData.forEach(
    ({
      userName,
      totalPostEndorsements,
      lastPostEndorsementTimestamp,
      daysSinceLastPostEndorsement,
    }) => {
      table.addRow(
        userName,
        totalPostEndorsements,
        lastPostEndorsementTimestamp,
        daysSinceLastPostEndorsement,
      );
    },
  );

  console.log(table.toString());
}

async function getViewsAnalytics({ print = false }) {
  const data = [];
  const usersWithoutHeartbeat = [];
  const usersCollection = await getUsersCollection();
  const presenceDoc = await db.collection("intents").doc("publish").get();
  const usersPresenceHeartbeat = presenceDoc.get("usersPresentHeartbeat");
  let numTotalUsers = 0;

  usersCollection.docs.forEach(async (doc) => {
    if (doc.get("human")) {
      numTotalUsers += 1;
      const heartbeat = usersPresenceHeartbeat[doc.id];
      if (!heartbeat) {
        usersWithoutHeartbeat.push({
          userID: doc.id,
          userName: doc.get("userName"),
          heartbeatTimestamp: "N/A",
          daysSinceLastHeartbeat: "N/A",
        });
        return;
      }

      const heartbeatSeconds =
        (heartbeat.heartbeat && heartbeat.heartbeat.seconds) || null;
      const heartbeatTimestamp = heartbeatSeconds
        ? new Date(heartbeatSeconds * 1000)
        : null;
      const daysSinceLastHeartbeat = heartbeatSeconds
        ? Math.floor(
            (new Date().getTime() / 1000 - heartbeatSeconds) / (60 * 60 * 24),
          )
        : null;
      data.push({
        userID: doc.id,
        userName: doc.get("userName"),
        heartbeatTimestamp,
        daysSinceLastHeartbeat,
      });
    }
  });

  const table = new AsciiTable("User View Analytics");
  table.setHeading("userName", "heartbeatTimestamp", "daysSinceLastHeartbeat");
  const sortedData = _.reverse(_.sortBy(data, "heartbeatTimestamp")).concat(
    usersWithoutHeartbeat,
  );
  sortedData.forEach(
    ({ userName, heartbeatTimestamp, daysSinceLastHeartbeat }) => {
      table.addRow(
        userName,
        heartbeatTimestamp.toLocaleString(),
        daysSinceLastHeartbeat,
      );
    },
  );
  const num1dActiveUsers = sortedData.filter(
    (entry) => entry.daysSinceLastHeartbeat <= 1,
  ).length;
  const num7dActiveUsers = sortedData.filter(
    (entry) => entry.daysSinceLastHeartbeat <= 7,
  ).length;
  const num28dActiveUsers = sortedData.filter(
    (entry) => entry.daysSinceLastHeartbeat <= 28,
  ).length;

  const pct28dActiveUsers = num28dActiveUsers / numTotalUsers;

  const results = {
    numTotalUsers,
    num1dActiveUsers,
    num7dActiveUsers,
    num28dActiveUsers,
    pct28dActiveUsers,
  };

  if (print) {
    console.log(table.toString());
    console.log("\n");
    console.log("Total num users: ", numTotalUsers);
    console.log("Num 1d active users: ", num1dActiveUsers);
    console.log("Num 7d active users: ", num7dActiveUsers);
    console.log("Num 28d active users: ", num28dActiveUsers);
    console.log(
      "Pct 28d active: ",
      ((num28dActiveUsers / numTotalUsers) * 100).toFixed(1) + "%",
    );
    console.log(
      "DAU / MAU: ",
      ((num1dActiveUsers / num28dActiveUsers) * 100).toFixed(1) + "%",
    );
    console.log("\n");
  }
  return results;
}

async function getLiveRoomAnalytics({ print = false }) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const postKey = yesterday.toISOString().split("T").shift();
  const todayAnalytics = await db.collection("analytics").doc(postKey).get();
  const liveRooms = todayAnalytics.get("liveRooms");
  const distinctUsersSet = new Set();
  const numLiveRooms = (liveRooms && Object.keys(liveRooms).length) || 0;
  if (liveRooms) {
    Object.entries(liveRooms).forEach(([roomPath, data]) => {
      if (data.users) {
        data.users.forEach((userID) => {
          distinctUsersSet.add(userID);
        });
      }
    });
  }
  const results = {
    num1dLiveRooms: numLiveRooms,
    num1dUsersInLiveRooms: distinctUsersSet.size,
  };
  if (print) {
    console.log(results);
  }
  return results;
}

async function getAudioDiscussionAnalytics({ print = false }) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const postKey = yesterday.toISOString().split("T").shift();
  const yesterdayAnalytics = await db
    .collection("analytics")
    .doc(postKey)
    .get();
  const audioDiscussions = yesterdayAnalytics.get("audioDiscussions");
  const distinctUsersSet = new Set();
  const numAudioDiscussions =
    (audioDiscussions && Object.keys(audioDiscussions).length) || 0;
  if (audioDiscussions) {
    Object.entries(audioDiscussions).forEach(([roomPath, data]) => {
      if (data.users) {
        data.users.forEach((userID) => {
          distinctUsersSet.add(userID);
        });
      }
    });
  }
  const results = {
    num1dAudioDiscussions: numAudioDiscussions,
    num1dUsersInAudioDiscussions: distinctUsersSet.size,
  };
  if (print) {
    console.log(results);
  }
  return results;
}

async function getUsersCollection() {
  return await db.collection("users").get();
}

module.exports = {
  getPostsAnalytics,
  getCommentsAnalytics,
  getPostEndorsementAnalytics,
  getViewsAnalytics,
  getLiveRoomAnalytics,
  getAudioDiscussionAnalytics,
};
