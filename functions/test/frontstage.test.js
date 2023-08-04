process.env.NODE_ENV = "test";

const test = require("firebase-functions-test")(
  {
    databaseURL: "https://persona-test-8c340.firebaseio.com",
    storageBucket: "persona-test-8c340.appspot.com",
    projectId: "persona-test-8c340",
  },
  "./test/persona-test-8c340-8758c96719ad.json"
);

const { db, admin, functions } = require("../admin");
const { expect } = require("chai");

const { createPublicPersona, joinPublicPersona } = require("../frontstage");

describe("Public Persona (frontstage)", () => {
  afterEach(() =>
    Promise.all([
      ...["personas", "users"].map(async (collectionToDelete) =>
        db
          .collection(collectionToDelete)
          .get()
          .then((collection) =>
            Promise.all(collection.docs.map((doc) => doc.ref.delete()))
          )
      ),
    ])
  );
  const createPublicPersonaWrapped = test.wrap(createPublicPersona);
  const joinPublicPersonaWrapped = test.wrap(joinPublicPersona);

  const createTestUser = (address) =>
    db
      .collection("users")
      .doc(address)
      .create({ wallets: [address] });

  describe("createPublicPersona", () => {
    describe("creates a public persona for", () => {
      it("gm", async () => {
        const ownerAddress = "0x2ba43efc033635250679fa7519433f80490b3d69";
        const collectionId = "0x12C8630369977eE708C8E727d8e838f74D9420C5";
        await createTestUser(ownerAddress);

        const response = await createPublicPersonaWrapped(
          {
            collectionName: "gm",
            collectionId,
          },
          { auth: { uid: ownerAddress } }
        );

        expect(response.result).to.equal("success");

        const personaQuery = await db
          .collection("personas")
          .where("collectionId", "==", collectionId.toLowerCase())
          .get();

        expect(personaQuery.size).to.be.equal(1);
        expect(personaQuery.docs[0].get("authors")[0]).to.be.equal(
          ownerAddress
        );
      });

      it("art blocks facets", async () => {
        const ownerAddress = "0xbd80cee1d9ebe79a2005fc338c9a49b2764cfc36";
        const collectionId = "0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270-249";
        await createTestUser(ownerAddress);

        const response = await createPublicPersonaWrapped(
          {
            collectionName: "Facets",
            collectionId,
            contractType: "artblocks",
          },
          { auth: { uid: ownerAddress } }
        );

        expect(response.result).to.equal("success");

        const personaQuery = await db
          .collection("personas")
          .where("collectionId", "==", collectionId.toLowerCase())
          .get();

        expect(personaQuery.size).to.be.equal(1);
        expect(personaQuery.docs[0].get("authors")[0]).to.be.equal(
          ownerAddress
        );
      });
    });

    // TODO: test error cases
  });

  describe("joinPublicPersona", () => {
    describe("joins public persona for", () => {
      it("gm", async () => {
        const ownerAddress = "0x2ba43efc033635250679fa7519433f80490b3d69";
        const collectionId = "0x12C8630369977eE708C8E727d8e838f74D9420C5";
        await createTestUser(ownerAddress);

        await createPublicPersonaWrapped(
          {
            collectionName: "gm",
            collectionId,
          },
          { auth: { uid: ownerAddress } }
        );

        const collectorAddress = "0xf96a3dc0f7990035e3333e658b890d0f16171102";
        await createTestUser(collectorAddress);

        const response = await joinPublicPersonaWrapped(
          {
            collectionId,
            tokenId: "4028",
          },
          { auth: { uid: collectorAddress } }
        );

        expect(response.result).to.equal("success");
        const personaQuery = await db
          .collection("personas")
          .where("collectionId", "==", collectionId.toLowerCase())
          .get();

        expect(personaQuery.size).to.be.equal(1);
        expect(personaQuery.docs[0].get("communityMembers")[0]).to.be.equal(
          collectorAddress
        );
      });

      it("art blocks qilin", async () => {
        const ownerAddress = "0x9f4633b29e89e10c869c8ce2197c63df06eb5355";
        const collectionId = "0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270-282";
        await createTestUser(ownerAddress);

        await createPublicPersonaWrapped(
          {
            collectionName: "qilin",
            collectionId,
            contractType: "artblocks",
          },
          { auth: { uid: ownerAddress } }
        );

        const collectorAddress = "0xbd80cee1d9ebe79a2005fc338c9a49b2764cfc36";
        await createTestUser(collectorAddress);

        const response = await joinPublicPersonaWrapped(
          {
            collectionId,
            tokenId: "282000614",
          },
          { auth: { uid: collectorAddress } }
        );

        expect(response.result).to.equal("success");
        const personaQuery = await db
          .collection("personas")
          .where("collectionId", "==", collectionId.toLowerCase())
          .get();

        expect(personaQuery.size).to.be.equal(1);
        expect(personaQuery.docs[0].get("communityMembers")[0]).to.be.equal(
          collectorAddress
        );
      });
    });

    // TODO: test error cases
  });
});
