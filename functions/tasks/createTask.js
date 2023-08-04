const { db } = require("../admin");

exports.createTask = async function (taskData) {
  await db.collection("tasks").add({ retries: 0, options: {}, ...taskData });
};
