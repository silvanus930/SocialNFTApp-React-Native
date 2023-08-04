const { admin, db, functions, rtdb } = require("./admin");

exports.sentryHook = functions.https.onRequest(async (request, response) => {
    response.status(200);
    const { action, data, installation, actor } = request.body;
    const {uuid} = installation || {};
    const resource = request.header('sentry-hook-resource');

    if (!action || !data || !resource) {
        return response.send(400 , {
            error: 'Missing required headers',
            data : request.body,
            resource : resource
        });
    }
    functions.logger.log(`Received '${resource}.${action}' webhook from Sentry`);
        
    if (resource === 'error') {
        if(data.error.exception.values[0].mechanism.handled === false){
            await db.collection("/personas/08d08552/chats/all/messages").add({
                deleted: false,
                text: `======Error======\ntitle : ${data.error.title}\n url : ${data.error.web_url}`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                userID: "BVOlOQOrHbUMgLkhmBFdIz09b3E2"
            }).then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
                response.send("Document written with ID: " + docRef.id);
            })
            response.send(200 ,  {
                "text" : `======Error======\ntitle : ${data.error.title}\n url : ${data.error.web_url}`
            });
        }
    } else {
        response.status(200);
    }

});