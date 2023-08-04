import Foundation
import FirebaseFirestore

class CommentViewModel: ObservableObject {
    @Published var personaID: String? = nil
    @Published var postID: String? = nil
    @Published var comments = [Comment]()
    
    var listener: FirebaseFirestore.ListenerRegistration?
    private var db = Firestore.firestore()
    
    func updateIDs(personaID: String, postID: String) {
        self.personaID = personaID
        self.postID = postID
        self.fetchData()
    }
    
    func fetchData() {
        guard let personaID = self.personaID, let postID = self.postID else {
            print("no IDs to query")
            return
        }
        listener?.remove()
        listener = db.collection("personas").document(personaID).collection("posts").document(postID).collection("comments").whereField("deleted", isEqualTo: false).order(by: "timestamp", descending: true).addSnapshotListener { (querySnapshot, error) in
            guard let documents = querySnapshot?.documents else {
                print("No documents")
                return
            }
            
            self.comments = documents.map { (queryDocumentSnapshot) -> Comment in
                let documentID = queryDocumentSnapshot.documentID
                let reference = queryDocumentSnapshot.reference
                let data = queryDocumentSnapshot.data()
                let anonymous = data["anonymous"] as? Bool ?? false
                var identityID = data["identityID"] as? String
                if identityID == "" {
                    identityID = nil
                }
                let userID = data["userID"] as? String ?? ""
                let text = data["text"] as? String ?? ""
                let isThread = data["isThread"] as? Bool ?? false
                let numThreadComments = data["numThreadComments"] as? Int ?? 0
                let timestamp = data["timestamp"] as? FirebaseFirestore.Timestamp
                let threadAnonymous = (data["latestThreadComment"] as? NSDictionary)?["anonymous"] as? Bool ?? false
                let threadIdentityID = (data["latestThreadComment"] as? NSDictionary)?["identityID"] as? String
                let threadUserID = (data["latestThreadComment"] as? NSDictionary)?["userID"] as? String ?? ""
                let threadTimestamp = (data["latestThreadComment"] as? NSDictionary)?["timestamp"] as? FirebaseFirestore.Timestamp
                let threadText = (data["latestThreadComment"] as? NSDictionary)?["text"] as? String ?? ""
                let threadComment = Comment.ThreadComment(anonymous: threadAnonymous, identityID: threadIdentityID, userID: threadUserID, timestamp: threadTimestamp, text: threadText)
                let endorsements = data["endorsements"] as? [String: [String]] ?? [:]
                let seen = data["seen"] as? [String: FirebaseFirestore.Timestamp?] ?? [:]
                let postTextQuoted = data["postTextQuoted"] as? String
                let mediaUrl = data["mediaUrl"] as? String ?? ""
                return Comment(documentID: documentID, reference: reference, anonymous: anonymous, identityID: identityID, userID: userID, timestamp: timestamp, isThread: isThread, text: text, latestThreadComment: threadComment, numThreadComments: numThreadComments, endorsements: endorsements, seen: seen, postTextQuoted: postTextQuoted, mediaUrl: mediaUrl)
            }
        }
    }
}

class ThreadViewModel: ObservableObject {
    @Published var rootComment: Comment? = nil
    @Published var comments = [Comment]()
    
    var listener: FirebaseFirestore.ListenerRegistration?
    private var db = Firestore.firestore()
    
    func registerThreadListener(onComment: Comment) {
        self.rootComment = onComment
        self.fetchData()
    }
    
    func reset() {
        listener?.remove()
        comments = []
        rootComment = nil
    }
    
    private func fetchData() {
        guard let comment = self.rootComment else {
            print("no IDs to query")
            return
        }
        listener?.remove()
        listener = comment.reference?.collection("threads").whereField("deleted", isEqualTo: false).order(by: "timestamp", descending: true).addSnapshotListener { (querySnapshot, error) in
            guard let documents = querySnapshot?.documents else {
                print("No documents")
                return
            }
            
            self.comments = documents.map { (queryDocumentSnapshot) -> Comment in
                let documentID = queryDocumentSnapshot.documentID
                let reference = queryDocumentSnapshot.reference
                let data = queryDocumentSnapshot.data()
                let anonymous = data["anonymous"] as? Bool ?? false
                var identityID = data["identityID"] as? String
                if identityID == "" {
                    identityID = nil
                }
                let userID = data["userID"] as? String ?? ""
                let text = data["text"] as? String ?? ""
                let isThread = data["isThread"] as? Bool ?? false
                let numThreadComments = data["numThreadComments"] as? Int ?? 0
                let timestamp = data["timestamp"] as? FirebaseFirestore.Timestamp
                let threadAnonymous = (data["latestThreadComment"] as? NSDictionary)?["anonymous"] as? Bool ?? false
                let threadIdentityID = (data["latestThreadComment"] as? NSDictionary)?["identityID"] as? String
                let threadUserID = (data["latestThreadComment"] as? NSDictionary)?["userID"] as? String ?? ""
                let threadTimestamp = (data["latestThreadComment"] as? NSDictionary)?["timestamp"] as? FirebaseFirestore.Timestamp
                let threadText = (data["latestThreadComment"] as? NSDictionary)?["text"] as? String ?? ""
                let threadComment = Comment.ThreadComment(anonymous: threadAnonymous, identityID: threadIdentityID, userID: threadUserID, timestamp: threadTimestamp, text: threadText)
                let endorsements = data["endorsements"] as? [String: [String]] ?? [:]
                let seen = data["seen"] as? [String: FirebaseFirestore.Timestamp?] ?? [:]
                let postTextQuoted = data["postTextQuoted"] as? String
                let mediaUrl = data["mediaUrl"] as? String ?? ""
                return Comment(documentID: documentID, reference: reference, anonymous: anonymous, identityID: identityID, userID: userID, timestamp: timestamp, isThread: isThread, text: text, latestThreadComment: threadComment, numThreadComments: numThreadComments, endorsements: endorsements, seen: seen, postTextQuoted: postTextQuoted, mediaUrl: mediaUrl)
            }
        }
    }
}
