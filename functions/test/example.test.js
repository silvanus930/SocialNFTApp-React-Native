process.env.NODE_ENV = "test";

const test = require("firebase-functions-test")({
  databaseURL: "https://persona-test-8c340.firebaseio.com",
  storageBucket: "persona-test-8c340.appspot.com",
  projectId: "persona-test-8c340",
}, "./test/persona-test-8c340-8758c96719ad.json");

const example = require("../example.js");
const {db} = require("../admin");
const {expect} = require("chai");

describe("Example", () => {
  it("simpleOnCreate gets test data and makes a document with it", async () => {
    const wrapped = test.wrap(example.simpleOnCreate);
    const testData = {testData: "blah"};
    const snap = test.firestore.makeDocumentSnapshot(testData, "test/1");
    // dependent on the document wildcards - in the example.js these are 'test/{id}'
    const params = {id: 1};
    await wrapped(snap, {params});
    const res = await db.collection("different").doc("test").get();
    expect(res.data()).to.deep.equal(testData);
    // cleanup is manual right now!
    await res.ref.delete();
  });
});
