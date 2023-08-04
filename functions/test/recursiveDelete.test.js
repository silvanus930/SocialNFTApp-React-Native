process.env.NODE_ENV = "test";

const test = require("firebase-functions-test")({
  databaseURL: "https://persona-test-8c340.firebaseio.com",
  storageBucket: "persona-test-8c340.appspot.com",
  projectId: "persona-test-8c340",
}, "./test/persona-test-8c340-8758c96719ad.json");

const recursiveDelete = require("../recursiveDelete.js");
const {db} = require("../admin");
const {expect} = require("chai");

describe("recursiveMarkDelete", () => {
  it("marks objects deleted recursively from a path", async () => {
  // helper function so I can easily test different context/auth scenarios
    const context = {
      auth: {
        uid: "test-uid",
        token: {
          firebase: {
            email_verified: true,
          },
        },
      },
    };
    const data = {
      docPath: "personas/1",
    };
    const wrapped = test.wrap(recursiveDelete.recursiveMarkDelete);
    const fakeDocPath0 = "personas/1";
    const fakeDocPath1 = "personas/1/posts/1";
    const fakeDocPath2 = "personas/1/posts/2";
    const fakeDocPath3 = "personas/1/posts/2/comment/1";
    let fakeDoc0; let fakeDoc1; let fakeDoc2; let fakeDoc3;
    await db.doc(fakeDocPath0).set({somedata: true, deleted: false});
    await db.doc(fakeDocPath1).set({somedata: true, deleted: false});
    await db.doc(fakeDocPath2).set({somedata: true, deleted: false});
    await db.doc(fakeDocPath3).set({somedata: true, deleted: false});
    fakeDoc0 = await db.doc(fakeDocPath0).get();
    fakeDoc1 = await db.doc(fakeDocPath1).get();
    fakeDoc2 = await db.doc(fakeDocPath2).get();
    fakeDoc3 = await db.doc(fakeDocPath3).get();
    expect(fakeDoc0.get("deleted")).to.be.false;
    expect(fakeDoc1.get("deleted")).to.be.false;
    expect(fakeDoc2.get("deleted")).to.be.false;
    expect(fakeDoc3.get("deleted")).to.be.false;

    const result = await wrapped(data, context);

    fakeDoc0 = await db.doc(fakeDocPath0).get();
    fakeDoc1 = await db.doc(fakeDocPath1).get();
    fakeDoc2 = await db.doc(fakeDocPath2).get();
    fakeDoc3 = await db.doc(fakeDocPath3).get();
    expect(fakeDoc0.get("deleted")).to.be.true;
    expect(fakeDoc1.get("deleted")).to.be.true;
    expect(fakeDoc2.get("deleted")).to.be.true;
    expect(fakeDoc3.get("deleted")).to.be.true;
    expect(result).to.deep.equal(data);
  });
});
