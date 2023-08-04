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

const { siweNonce, siweVerify } = require("../siwe");
const { ethers } = require("ethers");
const { SiweMessage } = require("siwe");

describe("Sign In With Ethereum (siwe)", () => {
  afterEach(() =>
    Promise.all([
      ...["siweNonces", "users"].map(async (collectionToDelete) =>
        db
          .collection(collectionToDelete)
          .get()
          .then((collection) =>
            Promise.all(collection.docs.map((doc) => doc.ref.delete()))
          )
      ),
    ])
  );
  const siweNonceWrapped = test.wrap(siweNonce);
  const siweVerifyWrapped = test.wrap(siweVerify);

  const createMessage = (address, nonce) =>
    new SiweMessage({
      address,
      uri: "https://login.xyz", // this needs to be something
      version: "1",
      chainId: "1",
      nonce,
    }).prepareMessage();

  let oldNonce;
  it("signs in and creates user", async () => {
    const wallet = ethers.Wallet.createRandom();

    const nonceRes = await siweNonceWrapped({
      address: wallet.address,
    });
    expect(nonceRes.result).to.equal("success");

    const message = createMessage(wallet.address, nonceRes.data.nonce);

    oldNonce = nonceRes.data.nonce;

    const signature = await wallet.signMessage(message);
    const verifyReq = {
      address: wallet.address,
      message,
      signature,
    };

    const verifyRes = await siweVerifyWrapped(verifyReq);

    expect(verifyRes.result).to.equal("success");

    const user = await db.collection("users").doc(wallet.address.toLowerCase()).get();
    expect(user.exists).to.be.true;

    {
      const verifyRes = await siweVerifyWrapped(verifyReq);
      expect(verifyRes.result).to.equal("nonce-not-found", "no replay attack");
    }

    {
      const nonceRes = await siweNonceWrapped({
        address: wallet.address,
      });
      expect(nonceRes.result).to.equal("success");

      const message = createMessage(wallet.address, nonceRes.data.nonce);

      const signature = await wallet.signMessage(message);
      const verifyReq = {
        address: wallet.address,
        message,
        signature,
      };
      const verifyRes = await siweVerifyWrapped(verifyReq);

      expect(verifyRes.result).to.equal("success");

      const user2 = await db.collection("users").doc(wallet.address.toLowerCase()).get();

      expect(user.createTime.valueOf()).to.equal(
        user2.createTime.valueOf(),
        "does not create user twice"
      );
    }
  });

  it("fails when signed message uses wrong address", async () => {
    const wallet = ethers.Wallet.createRandom();

    const nonceRes = await siweNonceWrapped({
      address: wallet.address,
    });

    expect(nonceRes.result).to.equal("success");

    const message = createMessage(wallet.address, nonceRes.data.nonce);

    const signature = await wallet.signMessage(message);

    const newAddress = ethers.Wallet.createRandom().address;
    const verifyRes = await siweVerifyWrapped({
      // different address
      address: newAddress,
      message,
      signature,
    });

    expect(verifyRes.result).to.equal("nonce-not-found");

    const user = await db.collection("users").doc(newAddress.toLowerCase()).get();
    expect(user.exists).to.be.false;
  });

  it("fails when signed message uses wrong nonce", async () => {
    const wallet = ethers.Wallet.createRandom();

    const nonceRes = await siweNonceWrapped({
      address: wallet.address,
    });

    expect(nonceRes.result).to.equal("success");

    // different nonce
    const message = createMessage(wallet.address, oldNonce);

    const signature = await wallet.signMessage(message);

    const verifyRes = await siweVerifyWrapped({
      address: wallet.address,
      message,
      signature,
    });

    expect(verifyRes.result).to.equal("nonce-invalid");

    const user = await db.collection("users").doc(wallet.address.toLowerCase()).get();
    expect(user.exists).to.be.false;
  });
});
