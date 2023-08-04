const { admin, db, functions } = require("./admin");
const { ethers } = require("ethers");

const ALCHEMY_API_KEY = "SWVYhQ248LZOeEaTpXEmWrG7w2DfK56o";
const collectionIdRegex = /(0x[a-fA-F0-9]{40})(?:-(\d+))?/;

// persona-srv/web-client/src/constants.js
const DEFAULT_NEW_PERSONA_NAME = "Unnamed Persona";
const INITIAL_PERSONA_DATA = {
  private: false,
  anonymous: true,
  showOnlyInStaffHome: false,
  showOnlyInStaffStudio: false,
  deleted: false,
  published: false,
  publishDate: "",
  editDate: "",
  admins: [],
  authors: [],
  followers: [],
  bio: "",
  inviteID: "",
  profileImgUrl: "",
  isSubPersona: false,
  parentPersonaID: "",
  showInProfile: false,
  remix: false,
  remixPersonaID: "",
  remixPostID: "",
  name: DEFAULT_NEW_PERSONA_NAME,
};

exports.createPublicPersona = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth || !context.auth.uid) {
      return {
        result: "unauthorized",
      };
    }
    if (!data.collectionId) {
      return {
        result: "collection-id-missing",
      };
    }
    // no reason for client to give wrong collection name
    if (!data.collectionName) {
      return {
        result: "collection-name-missing",
      };
    }
    // collectionId can be address or address-number e.g.
    // 0xa319c382a702682129fcbf55d514e61a16f97f9c-12
    const regexResult = collectionIdRegex.exec(data.collectionId);
    if (regexResult == null) {
      return {
        result: "collection-id-invalid",
      };
    }
    let [, contractAddress, projectId] = regexResult;
    contractAddress = contractAddress.toLowerCase();

    const personaQuery = await db
      .collection("personas")
      .where("collectionId", "==", data.collectionId)
      .get();

    if (personaQuery.size > 0) {
      return {
        result: "persona-already-exists",
      };
    }

    const userId = context.auth.uid;
    // should exist otherwise not auth'd
    const user = await db.collection("users").doc(userId).get();
    const userWallets = user.get("wallets");

    if (!Array.isArray(userWallets) || userWallets.length == 0) {
      return {
        result: "no-wallets",
      };
    }
    let owner;

    const provider = new ethers.providers.AlchemyProvider(
      null,
      ALCHEMY_API_KEY
    );

    const contract = new ethers.Contract(
      contractAddress,
      [
        "function projectIdToArtistAddress(uint256) view returns (address)",
        "function owner() view returns (address)",
      ],
      provider
    );
    if (data.contractType === "artblocks") {
      if (projectId == null) {
        return {
          result: "project-id-missing",
        };
      }
      try {
        owner = await contract.projectIdToArtistAddress(projectId);
      } catch (e) {
        return {
          result: "contract-not-artblocks",
        };
      }
    } else {
      try {
        owner = await contract.owner();
      } catch (e) {
        return {
          result: "contract-not-ownable",
        };
      }
    }

    if (!userWallets.includes(owner.toLowerCase())) {
      return {
        result: "contract-not-owned",
      };
    }

    // persona-srv/web-client/src/components/PersonaList/CreateNewPersonaButton.js
    const personaRef = db.collection("personas").doc();
    await personaRef.set({
      ...INITIAL_PERSONA_DATA,
      private: true,
      authors: [userId],
      communityMembers: [], // is this the field we're using?
      editDate: admin.firestore.FieldValue.serverTimestamp(),
      publishDate: admin.firestore.FieldValue.serverTimestamp(),
      cacheDate: admin.firestore.FieldValue.serverTimestamp(),
      name: data.collectionName,
      // deal with this later, don't need slugs here I think
      // slugID,
      // slug,
      collectionId: data.collectionId.toLowerCase(),
      contractType: data.contractType || null,
    });

    // await personaRef.collection("frontstage").add({
    //   // TODO
    // });

    return {
      result: "success",
    };
  } catch (err) {
    functions.logger.error("ERROR: ", err.toString());
    return {
      result: "error",
      data: err.toString(),
    };
  }
});

exports.joinPublicPersona = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth || !context.auth.uid) {
      return {
        result: "unauthorized",
      };
    }
    if (!data.collectionId) {
      return {
        result: "collection-id-missing",
      };
    }
    if (!data.tokenId) {
      return {
        result: "token-id-missing",
      };
    }
    const regexResult = collectionIdRegex.exec(data.collectionId);
    if (regexResult == null) {
      return {
        result: "collection-id-invalid",
      };
    }
    let [, contractAddress, projectId] = regexResult;
    contractAddress = contractAddress.toLowerCase();

    const personaQuery = await db
      .collection("personas")
      .where("collectionId", "==", data.collectionId.toLowerCase())
      .get();
    if (personaQuery.size == 0) {
      return {
        result: "persona-not-found",
      };
    }

    const userId = context.auth.uid;
    const persona = personaQuery.docs[0];
    const authors = persona.get("authors");
    const communityMembers = persona.get("communityMembers");
    const contractType = persona.get("contractType");

    // public personas should have communityMembers
    if (authors.includes(userId) || communityMembers.includes(userId)) {
      return {
        result: "already-joined",
      };
    }

    // should exist otherwise not auth'd
    const user = await db.collection("users").doc(userId).get();
    const userWallets = user.get("wallets");

    if (!Array.isArray(userWallets) || userWallets.length == 0) {
      return {
        result: "no-wallets",
      };
    }

    let owner;

    const provider = new ethers.providers.AlchemyProvider(
      null,
      ALCHEMY_API_KEY
    );

    const contract = new ethers.Contract(
      contractAddress,
      [
        "function ownerOf(uint256) view returns (address)",
        "function tokenIdToProjectId(uint256) view returns (uint256)",
      ],
      provider
    );
    try {
      owner = await contract.ownerOf(data.tokenId);
    } catch (e) {
      return {
        result: "contract-not-erc721",
      };
    }

    if (!userWallets.includes(owner.toLowerCase())) {
      return {
        result: "token-not-owned",
      };
    }

    if (contractType === "artblocks") {
      if (projectId == null) {
        return {
          result: "project-id-missing",
        };
      }
      try {
        const abProjectId = await contract.tokenIdToProjectId(data.tokenId);

        if (abProjectId.toString() !== projectId) {
          return {
            result: "token-not-from-project",
          };
        }
      } catch (e) {
        return {
          result: "contract-not-artblocks",
        };
      }
    }

    await db
      .collection("personas")
      .doc(persona.id)
      .set(
        { communityMembers: [...communityMembers, userId] },
        { merge: true }
      );

    return {
      result: "success",
    };
  } catch (err) {
    functions.logger.error("ERROR: ", err.toString());
    return {
      result: "error",
      data: err.toString(),
    };
  }
});
