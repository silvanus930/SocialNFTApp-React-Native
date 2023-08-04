import Foundation
import SwiftUI
import FirebaseFirestore

struct PersonaCache {
    var id: String = UUID().uuidString
    var documentID: String
    var latestPostPublishDate: FirebaseFirestore.Timestamp?
    var latestPostEditDate: FirebaseFirestore.Timestamp?
    var latestTouchedDate: FirebaseFirestore.Timestamp?
}

struct Persona {
    var id: String = UUID().uuidString
    var documentID: String
    var name: String
    var bio: String
    var profileImgUrl: String
    var authors: [String]
    var priv: Bool
    var anonymous: Bool
}

struct User {
    var id: String = UUID().uuidString
    var documentID: String
    var userName: String
    var profileImgUrl: String
}

struct Comment {
    
    struct ThreadComment {
        var anonymous: Bool = false
        var identityID: String?
        var userID: String
        var timestamp: FirebaseFirestore.Timestamp?
        var text: String
    }
    
    var id: String = UUID().uuidString
    var documentID: String
    var reference: DocumentReference?
    var anonymous: Bool = false
    var identityID: String?
    var userID: String
    var timestamp: FirebaseFirestore.Timestamp?
    var isThread: Bool = false
    var text: String
    var latestThreadComment: ThreadComment
    var numThreadComments: Int
    var endorsements: [String: [String]]
    var seen: [String: FirebaseFirestore.Timestamp?]
    var postTextQuoted: String?
    var mediaUrl: String
    
    func addSeenUser(userID: String) {
        let updatedData = ["seen": [
            "\(userID)": FirebaseFirestore.FieldValue.serverTimestamp()
        ]]
        reference?.setData(updatedData, merge: true)
    }
    
    func hasSeenUser(userID: String) -> Bool {
        return seen.keys.contains(userID)
    }
    
    func delete() {
        if let reference = reference {
            reference.setData(["deleted": true, "deletedAt": FirebaseFirestore.Timestamp.init()], merge: true)
            reference.parent.parent?.collection("live").document("discussion").setData(["numCommentsAndThreads": FirebaseFirestore.FieldValue.increment(Int64(-1))], merge: true)
            recursiveMarkDelete(ref: reference)
        }
    }
    
    func toggleReact(emoji: String, userID: String) {
        let iEndorsed = endorsements[emoji]?.contains(userID)
        var updatedData: [String: Any]
        if let iEndorsed = iEndorsed, iEndorsed {
            updatedData = [
                "endorsements": [
                    "\(emoji)": FirebaseFirestore.FieldValue.arrayRemove([userID])
                ]
            ]
        } else {
            updatedData = [
                "endorsements": [
                    "\(emoji)": FirebaseFirestore.FieldValue.arrayUnion([userID])
                ]
            ]
        }
        reference?.setData(updatedData, merge: true)
    }
    
    func createThreadComment(userID: String, text: String, mediaUrl: String?) {
        var data: [String: Any] = [
            "userID": userID,
            "timestamp": FirebaseFirestore.FieldValue.serverTimestamp(),
            "deleted": false,
            "isThread": true,
            "text": text,
            "seen": [
              "\(userID)": FirebaseFirestore.FieldValue.serverTimestamp(),
            ],
        ]
        if let mediaUrl = mediaUrl {
            data["mediaUrl"] = mediaUrl
        }
        reference?.collection("threads").addDocument(data: data)
        reference?.parent.parent?.collection("live").document("discussion").setData(["numCommentsAndThreads":  FirebaseFirestore.FieldValue.increment(Int64(1))], merge: true)
        reference?.setData(["latestThreadComment": data, "numThreadComments":  FirebaseFirestore.FieldValue.increment(Int64(1))], merge: true)
    }
    
    static func create(onPersonaID: String, onPostID: String, userID: String, isThread: Bool, text: String, postTextQuoted: String?, mediaUrl: String?) {
        var data: [String: Any] = [
            "userID": userID,
            "timestamp": FirebaseFirestore.FieldValue.serverTimestamp(),
            "deleted": false,
            "isThread": isThread,
            "text": text,
            "seen": [
              "\(userID)": FirebaseFirestore.FieldValue.serverTimestamp(),
            ],
        ]
        if let postTextQuoted = postTextQuoted {
            data["postTextQuoted"] = postTextQuoted
        }
        if let mediaUrl = mediaUrl {
            data["mediaUrl"] = mediaUrl
        }
        let db = Firestore.firestore()
        let postRef = db.collection("personas").document(onPersonaID).collection("posts").document(onPostID)
        postRef.collection("comments").addDocument(data: data)
        postRef.collection("live").document("discussion").setData(["numCommentsAndThreads":  FirebaseFirestore.FieldValue.increment(Int64(1))], merge: true)
    }
}

struct Post {    
    enum MediaType {
        case PHOTO
    }
    
    struct GalleryMedia: Codable {
        let uri: String
        let height: Float
        let width: Float
    }
    
    var id: String = UUID().uuidString
    var reference: DocumentReference?
    var documentID: String
    var title: String = ""
    var text: String = ""
    var mediaUrl: String = ""
    var galleryUris: [GalleryMedia] = []
    var authorID: String
    var anonymous: Bool = false
    var identityID: String?
    var mediaType: MediaType?
    var publishDate: FirebaseFirestore.Timestamp?
    var editDate: FirebaseFirestore.Timestamp?
    var intermediateEditDate: FirebaseFirestore.Timestamp?
    var published: Bool = false
    var mediaLocations: [String: Int] = [:]
    
    func toggleReact(emoji: String, userID: String, isEndorsed: Bool?) {
        var updatedData: [String: Any]
        if let isEndorsed = isEndorsed, isEndorsed {
            updatedData = [
                "endorsements": [
                    "\(emoji)": FirebaseFirestore.FieldValue.arrayRemove([userID])
                ]
            ]
        } else {
            updatedData = [
                "endorsements": [
                    "\(emoji)": FirebaseFirestore.FieldValue.arrayUnion([userID])
                ]
            ]
        }
        reference?.collection("live").document("endorsements").setData(updatedData, merge: true)
    }
    
    func delete() {
        if let reference = reference {
            reference.setData(["deleted": true, "deletedAt": FirebaseFirestore.Timestamp.init()], merge: true)
            recursiveMarkDelete(ref: reference)
        }
    }
    
    func publish() {
        if let reference = reference {
            reference.setData(["published": true], merge: true)
        }
    }
    
    func setDraft() {
        if let reference = reference {
            reference.setData(["published": false], merge: true)
        }
    }
    
    static func createNew(onPersonaID: String, authorID: String, identityID: String?) -> DocumentReference {
        let data: [String: Any] = [
            "invitedUsers": [String: Any](),
            "galleryUris": [],
            "deleted": false,
            "showOnlyInStaffHome": false, // TODO - remove
            "showOnlyInStaffStudio": false, // TODO - remove
            "anonymous": identityID != nil,
            "publicCollabBar": false, // TODO - remove
            "type": "media",
            "mediaType": "",
            "title": "",
            "identityID": identityID ?? "",
            "identityProfileImgUrl": "", // TODO - remove
            "identityName": "", // TODO - remove
            "identityBio": "", // TODO - remove
            "userName": "", // TODO - remove
            "mediaLoop": true,  // TODO - consolidate
            "mediaUrl": "",
            "audioUrl": "",
            "mediaMuted": false,
            "remixPostID": "",
            "remixPersonaID": "",
            "remixCommentIDList": [],
            "fileUris": [],
            "mediaRotate": false,
            "text": "",
            "publishDate": FirebaseFirestore.Timestamp.init(),
            "editDate": "",
            "userID": authorID,
            "inviteID": "", // TODO - remove
            "promise": false, // TODO - remove
            "promiseState": "", // TODO - remove
            "promiseSatisfied": false, // TODO - remove
            "userProfileImgUrl": "", // TODO - remove
            "personaProfileImgUrl": "", // TODO - remove
            "subPersonaID": "",
            "subPersona": [String: Any](), // TODO - remove
            "seen": [String: Any](),
            "present": [], // TODO - remove
            "threadIDs": [String: Any](),
        ]
        return Firestore.firestore().collection("personas").document(onPersonaID).collection("posts").addDocument(data: data)
    }
}
