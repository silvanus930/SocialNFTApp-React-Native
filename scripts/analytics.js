#!/usr/bin/env node
const { program } = require("commander");
const {
  getPostsAnalytics,
  getCommentsAnalytics,
  getPostEndorsementAnalytics,
  getViewsAnalytics,
  getLiveRoomAnalytics,
} = require("../functions/analytics/analytics");

(async () => {
  try {
    await main();
  } catch (e) {
    console.log(e);
  }
})();

async function main() {
  program
    .command("posts")
    .description("Get user analytics for posts")
    .action(async (script, options) => {
      await getPostsAnalytics({ print: true });
    });
  program
    .command("comments")
    .description("Get user analytics for comments")
    .action(async (script, options) => {
      await getCommentsAnalytics({ print: true });
    });
  program
    .command("postEndorsements")
    .description("Get user analytics for post endorsements")
    .action(async (script, options) => {
      await getPostEndorsementAnalytics({ print: true });
    });
  program
    .command("views")
    .description("Get user analytics for views")
    .action(async (script, options) => {
      await getViewsAnalytics({ print: true });
    });
  program
    .command("liveRooms")
    .description("Get user analytics for live rooms")
    .action(async (script, options) => {
      await getLiveRoomAnalytics({ print: true });
    });
  await program.parseAsync(process.argv);
}
