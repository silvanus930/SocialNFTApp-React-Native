const { functions } = require("./admin");
const firestore = require("@google-cloud/firestore");
const client = new firestore.v1.FirestoreAdminClient();

const bucket = "gs://firestore-cloud-backups";

exports.scheduledFirestoreExport = functions.pubsub
  .schedule("every 24 hours")
  .onRun((context) => {
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const databaseName = client.databasePath(projectId, "(default)");

    return client
      .exportDocuments({
        name: databaseName,
        outputUriPrefix: bucket,
        // Export all collections
        collectionIds: [],
      })
      .then((responses) => {
        const response = responses[0];
        console.log(`Operation Name: ${response["name"]}`);
      })
      .catch((err) => {
        console.error(err);
        throw new Error("Export operation failed");
      });
  });
