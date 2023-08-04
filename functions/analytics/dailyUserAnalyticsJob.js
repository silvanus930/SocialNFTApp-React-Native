const { admin, functions, db } = require("../admin");
const {
  getViewsAnalytics,
  getPostsAnalytics,
  getCommentsAnalytics,
  getLiveRoomAnalytics,
  getAudioDiscussionAnalytics,
} = require("./analytics");

const ANALYTICS_PERSONA_ID = "sSCSVhE3xyZOVcoE3DfS";
const ANALYTICS_BOT_ID = "dWaArplaRP66awGzV2zx";

const convertToPercent = (num) => (num * 100).toFixed(1) + "%";

exports.dailyUserAnalyticsJob = functions
  .runWith({ timeoutSeconds: 60 * 9 })
  .pubsub.schedule("0 0 * * *") // every day at midnight
  .onRun(async (context) => {
    try {
      const today = new Date();
      const postKey = today.toISOString().split("T").shift();

      const post = await db
        .collection("personas")
        .doc(ANALYTICS_PERSONA_ID)
        .collection("posts")
        .doc(postKey)
        .get();

      if (post.exists) {
        functions.logger.error(
          `Attempted to create analytics post for ${postKey} but it already exists. Returning early`,
        );
        return;
      }

      functions.logger.log("Fetching views analytics");
      const viewsAnalytics = await getViewsAnalytics({ print: false });
      functions.logger.log("Done fetching views analytics");
      functions.logger.log("Fetching posts analytics");
      const postsAnalytics = await getPostsAnalytics({ print: false });
      functions.logger.log("Done fetching posts analytics");
      functions.logger.log("Fetching live room analytics");
      const liveRoomAnalytics = await getLiveRoomAnalytics({ print: false });
      functions.logger.log("Done fetching live room analytics");
      functions.logger.log("Fetching audio discussion analytics");
      const audioDiscussionAnalytics = await getAudioDiscussionAnalytics({
        print: false,
      });
      functions.logger.log("Done fetching audio discussion analytics");
      functions.logger.log("Fetching comments analytics");
      const commentsAnalytics = await getCommentsAnalytics({ print: false });
      functions.logger.log("Done fetching comments analytics");

      const dauToMau = convertToPercent(
        viewsAnalytics.num1dActiveUsers / viewsAnalytics.num28dActiveUsers,
      );

      const pct28dPosted = convertToPercent(
        postsAnalytics.num28dUsersPosted / postsAnalytics.numTotalUsers,
      );

      const pct28dUsersCommented = convertToPercent(
        commentsAnalytics.num28dUsersCommented / viewsAnalytics.numTotalUsers,
      );

      const postText = `
      Total number of users: ${viewsAnalytics.numTotalUsers}
      
      *Actives*
      1d active users: ${viewsAnalytics.num1dActiveUsers}
      7d active users: ${viewsAnalytics.num7dActiveUsers}
      28d active users: ${viewsAnalytics.num28dActiveUsers}
      DAU / MAU: ${dauToMau}

      *Posts*
      1d users posted: ${postsAnalytics.num1dUsersPosted}
      7d users posted: ${postsAnalytics.num7dUsersPosted}
      28d users posted: ${postsAnalytics.num28dUsersPosted}
      Percent 28d posted: ${pct28dPosted}

      *Comments*
      1d users commented: ${commentsAnalytics.num1dUsersCommented}
      7d users commented: ${commentsAnalytics.num7dUsersCommented}
      28d users commented: ${commentsAnalytics.num28dUsersCommented}
      Percent 28d commented: ${pct28dUsersCommented}

      _Excluding cofounder comments_
      1d comments: ${commentsAnalytics.numNonCofounder1dComments}
      7d comments: ${commentsAnalytics.numNonCofounder7dComments}
      28d comments: ${commentsAnalytics.numNonCofounder28dComments}

      *Rooms*
      1d live rooms: ${liveRoomAnalytics.num1dLiveRooms}
      1d live users: ${liveRoomAnalytics.num1dUsersInLiveRooms}
      1d audio discussions: ${audioDiscussionAnalytics.num1dAudioDiscussions}
      1d users in discussions: ${audioDiscussionAnalytics.num1dUsersInAudioDiscussions}
      `;

      const analyticsPersona = await db
        .collection("personas")
        .doc(ANALYTICS_PERSONA_ID)
        .get();

      const analyticsBot = await db
        .collection("users")
        .doc(ANALYTICS_BOT_ID)
        .get();

      await db
        .collection("personas")
        .doc(ANALYTICS_PERSONA_ID)
        .collection("posts")
        .doc(postKey)
        .set({
          deleted: false,
          title: `${postKey} daily analytics`,
          anonymous: true,
          userID: ANALYTICS_BOT_ID,
          identityID: ANALYTICS_PERSONA_ID,
          identityName: analyticsPersona.get("name"),
          identityBio: analyticsPersona.get("bio"),
          identityProfileImgUrl: analyticsPersona.get("profileImgUrl"),
          publishDate: admin.firestore.FieldValue.serverTimestamp(),
          editDate: admin.firestore.FieldValue.serverTimestamp(),
          published: true,
          text: postText,
          mediaType: "photo",
          mediaUrl: "",
          personaProfileImgUrl: analyticsPersona.get("profileImgUrl") || "",
          type: "media",
          userName: analyticsBot.get("userName"),
          userProfileImgUrl: analyticsBot.get("profileImgUrl") || "",
          galleryUris: [],
          subPersonaID: "",
          rawData: {
            numTotalUsers: viewsAnalytics.numTotalUsers,
            ...viewsAnalytics,
            ...postsAnalytics,
          },
        });
    } catch (err) {
      functions.logger.error("Analytics job failed: ", err);
    }
  });
