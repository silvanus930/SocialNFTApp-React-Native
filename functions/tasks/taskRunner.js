const { admin, db, functions } = require("../admin");
const {
  createActivityEventForProposalEndingSoon,
  createActivityEventForProposalEnded,
} = require("../activity/createActivityEventFromProposal");

const errorTest = () => {
  functions.logger.log("running errorTest");
  throw new Error("This is errorTest");
};

const workers = {
  errorTest,
  createActivityEventForProposalEndingSoon,
  createActivityEventForProposalEnded,
};

const MAX_RETRIES = 2;

async function runTask(taskSnapshot) {
  const { worker, options, status, retries } = taskSnapshot.data();

  if (status === "failedRetrying" && retries >= MAX_RETRIES) {
    return await taskSnapshot.ref.update({
      status: "failed",
    });
  }

  try {
    await workers[worker](options);
    return await taskSnapshot.ref.update({ status: "complete" });
  } catch (err) {
    functions.logger.error(`Task run failed: ${JSON.stringify(err)}`);
    return await taskSnapshot.ref.update({
      status: "failedRetrying",
      retries: admin.firestore.FieldValue.increment(1),
      error: err.toString(),
    });
  }
}

exports.taskRunner = functions
  .runWith({ memory: "512MB" })
  .pubsub.schedule("* * * * *")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    const scheduledQuery = await db
      .collection("tasks")
      .where("performAt", "<=", now)
      .where("status", "in", ["scheduled"])
      .get();

    const failedRetryingQuery = await db
      .collection("tasks")
      .where("status", "in", ["failedRetrying"])
      .where("retries", "<=", MAX_RETRIES)
      .get();

    const tasks = []
      .concat(scheduledQuery.docs)
      .concat(failedRetryingQuery.docs);

    return Promise.all(tasks.map(runTask));
  });
