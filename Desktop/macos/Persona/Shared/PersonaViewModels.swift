import Foundation
import FirebaseFirestore

class PersonaViewModel: ObservableObject {
    
    @Published var personas = [Persona]()
    
    private var db = Firestore.firestore()
    private var listener: FirebaseFirestore.ListenerRegistration?
    
    func fetchData(userID: String) {
        listener?.remove()
        listener = db.collection("personas").whereField("authors", arrayContains: userID).whereField("deleted", isEqualTo: false).addSnapshotListener { (querySnapshot, error) in
            guard let documents = querySnapshot?.documents else {
                print("No documents")
                return
            }
            
            self.personas = documents.map { (queryDocumentSnapshot) -> Persona in
                let documentID = queryDocumentSnapshot.documentID
                let data = queryDocumentSnapshot.data()
                let name = data["name"] as? String ?? ""
                let bio = data["bio"] as? String ?? ""
                let profileImgUrl = data["profileImgUrl"] as? String ?? ""
                let authors = data["authors"] as? [String] ?? []
                let priv = data["private"] as? Bool ?? false
                let anonymous = data["anonymous"] as? Bool ?? false
                return Persona(documentID: documentID, name: name, bio: bio, profileImgUrl: profileImgUrl, authors: authors, priv: priv, anonymous: anonymous)
            }
        }
    }
}

class PersonaCacheViewModel: ObservableObject {
    
    @Published var personas = [String: PersonaCache]()
    
    private var db = Firestore.firestore()
    private var listener: FirebaseFirestore.ListenerRegistration?
    
    func fetchData(userID: String) {
        listener?.remove()
        listener = db.collection("personaCaching").whereField("authors", arrayContains: userID).addSnapshotListener { (querySnapshot, error) in
            guard let documents = querySnapshot?.documents else {
                print("No documents")
                return
            }
            
            documents.forEach { queryDocumentSnapshot in
                let documentID = queryDocumentSnapshot.documentID
                let data = queryDocumentSnapshot.data()
                let latestPostPublishDate = data["latestPostPublishDate"] as? FirebaseFirestore.Timestamp
                let latestPostEditDate = data["latestPostEditDate"] as? FirebaseFirestore.Timestamp
                var latestTouchedDate: FirebaseFirestore.Timestamp? = nil;
                if latestPostEditDate != nil && latestPostPublishDate != nil {
                    if Double(latestPostPublishDate?.seconds ?? 0) < Double(latestPostEditDate?.seconds ?? 0) {
                        latestTouchedDate = latestPostEditDate
                    } else {
                        latestTouchedDate = latestPostPublishDate
                    }
                } else if latestPostEditDate != nil {
                    latestTouchedDate = latestPostEditDate
                } else if latestPostPublishDate != nil {
                    latestTouchedDate = latestPostPublishDate
                }
                self.personas[documentID] = PersonaCache(documentID: documentID, latestPostPublishDate: latestPostPublishDate, latestPostEditDate: latestPostEditDate, latestTouchedDate: latestTouchedDate)
            }
        }
    }
}
