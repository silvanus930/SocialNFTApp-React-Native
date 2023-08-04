import Foundation
import FirebaseFirestore

class PostViewModel: ObservableObject {
    @Published var personaID: String? = nil
    @Published var posts = [Post]()
    
    private var listener: FirebaseFirestore.ListenerRegistration?
    private var db = Firestore.firestore()
    
    func updatePersonaID(documentID: String) {
        self.personaID = documentID
        self.fetchData()
    }
    
    func fetchData() {
        guard let personaID = self.personaID else {
            print("no persona ID to query")
            return
        }
        listener?.remove()
        listener = db.collection("personas").document(personaID).collection("posts").whereField("deleted", isEqualTo: false).order(by: "publishDate", descending: true).addSnapshotListener { (querySnapshot, error) in
            guard let documents = querySnapshot?.documents else {
                print("No documents")
                return
            }
            
            self.posts = documents.map { (queryDocumentSnapshot) -> Post in
                let documentID = queryDocumentSnapshot.documentID
                let reference = queryDocumentSnapshot.reference
                let data = queryDocumentSnapshot.data()
                let title = data["title"] as? String ?? ""
                let text = data["text"] as? String ?? ""
                let mediaUrl = data["mediaUrl"] as? String ?? ""
                let decoder = JSONDecoder()
                var galleryUris = [Post.GalleryMedia]()
                for uri in data["galleryUris"] as? [NSDictionary] ?? [] {
                    let data = try! JSONSerialization.data(withJSONObject: uri, options: [])
                    let entry = try! decoder.decode(Post.GalleryMedia.self, from: data)
                    galleryUris.append(entry)
                }
                let authorID = data["userID"] as? String ?? ""
                let anonymous = data["anonymous"] as? Bool ?? false
                let mediaType = (data["mediaType"] as? String ?? "") == "photo" ? Post.MediaType.PHOTO : nil
                let editDate = data["editDate"] as? FirebaseFirestore.Timestamp
                let intermediateEditDate = data["intermediateEditDate"] as? FirebaseFirestore.Timestamp
                let publishDate = data["publishDate"] as? FirebaseFirestore.Timestamp
                let identityID = data["identityID"] as? String
                let published = data["published"] as? Bool ?? false
                let mediaLocations = data["mediaLocations"] as? [String: Int] ?? [:]
                return Post(reference: reference, documentID: documentID, title: title, text: text, mediaUrl: mediaUrl, galleryUris: galleryUris, authorID: authorID, anonymous: anonymous, identityID: identityID, mediaType: mediaType, publishDate: publishDate, editDate: editDate, intermediateEditDate: intermediateEditDate, published: published, mediaLocations: mediaLocations)
            }
        }
    }
}

class SinglePostEndorsementViewModel: ObservableObject {
    @Published var endorsements: [React]?
    @Published var endorsementReference: DocumentReference?
    
    private var db = Firestore.firestore()
    private var listener: FirebaseFirestore.ListenerRegistration?
    
    func fetchData(post: Post) {
        listener?.remove()
        listener = post.reference?.collection("live").document("endorsements").addSnapshotListener { (documentSnapshot, error) in
            guard let document = documentSnapshot else {
                print("Document not found")
                return
            }
                
            self.endorsementReference = document.reference
            
            let endorsementsData = document.get("endorsements") as? [String: [String]] ?? [:]
            self.endorsements = endorsementsData.map { React(emoji: $0.key, endorsers: $0.value) }.sorted { a, b in a.emoji > b.emoji }
        }
    }
}

class SinglePostViewModel: ObservableObject {
    @Published var post: Post?
    private var db = Firestore.firestore()
    
    func fetchData(personaID: String, postID: String) {
        db.collection("personas").document(personaID).collection("posts").document(postID).addSnapshotListener { (documentSnapshot, error) in
            guard let document = documentSnapshot else {
                print("Document not found")
                return
            }
            
            let documentID = document.documentID
            let reference = document.reference
            let data = document.data()
            let title = data?["title"] as? String ?? ""
            let text = data?["text"] as? String ?? ""
            let mediaUrl = data?["mediaUrl"] as? String ?? ""
            let decoder = JSONDecoder()
            var galleryUris = [Post.GalleryMedia]()
            for uri in data?["galleryUris"] as? [NSDictionary] ?? [] {
                do {
                    let data = try JSONSerialization.data(withJSONObject: uri, options: [])
                    let entry = try decoder.decode(Post.GalleryMedia.self, from: data)
                    galleryUris.append(entry)
                } catch {
                    print("Error code 187, failed to load gallery media")
                }
            }
            let authorID = data?["userID"] as? String ?? ""
            let anonymous = data?["anonymous"] as? Bool ?? false
            let mediaType = (data?["mediaType"] as? String ?? "") == "photo" ? Post.MediaType.PHOTO : nil
            let editDate = data?["editDate"] as? FirebaseFirestore.Timestamp
            let intermediateEditDate = data?["intermediateEditDate"] as? FirebaseFirestore.Timestamp
            let publishDate = data?["publishDate"] as? FirebaseFirestore.Timestamp
            let identityID = data?["identityID"] as? String
            let published = data?["published"] as? Bool ?? false
            let mediaLocations = data?["mediaLocations"] as? [String: Int] ?? [:]
            self.post = Post(reference: reference, documentID: documentID, title: title, text: text, mediaUrl: mediaUrl, galleryUris: galleryUris, authorID: authorID, anonymous: anonymous, identityID: identityID, mediaType: mediaType, publishDate: publishDate, editDate: editDate, intermediateEditDate: intermediateEditDate, published: published, mediaLocations: mediaLocations)
        }
    }
}
