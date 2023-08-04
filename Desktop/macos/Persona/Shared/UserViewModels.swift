import Foundation
import FirebaseAuth
import FirebaseFirestore
import SwiftUI

class MyUserViewModel: ObservableObject {
    @Published var userID: String? = nil
    @Published var myUser: User? = nil
    
    private var db = Firestore.firestore()
    private var listener: FirebaseFirestore.ListenerRegistration?
    private var authListener: AuthStateDidChangeListenerHandle?
    
    init() {
        authListener = Auth.auth().addStateDidChangeListener { auth, user in
            if let signedInUser = auth.currentUser {
                self.updateUserID(documentID: signedInUser.uid)
            }
        }
    }
    
    func updateUserID(documentID: String) {
        self.userID = documentID
        self.fetchData()
    }
    
    func signOut() {
        self.myUser = nil
        listener?.remove()
        do {
            try Auth.auth().signOut()
        } catch {
            Alert(title: Text("ERROR"), message: Text("Sign out failed for some reason. FFFFFFF"), dismissButton: .cancel())
        }
    }
    
    func fetchData() {
        guard let myUserID = userID else { return }
        listener?.remove()
        listener = db.collection("users").document(myUserID).addSnapshotListener { documentSnapshot, error in
            guard let document = documentSnapshot else {
                print("Document not found")
                return
            }
            
            let documentID = document.documentID
            let data = document.data()
            let userName = data?["userName"] as? String ?? ""
            let profileImgUrl = data?["profileImgUrl"] as? String ?? ""
            self.myUser = User(documentID:documentID, userName: userName, profileImgUrl: profileImgUrl)
        }
    }
}

class UsersViewModel: ObservableObject {
    
    @Published var users = [String: User]()
    
    var db = Firestore.firestore()
    
    func fetchData() {
        db.collection("users").whereField("human", isEqualTo: true).addSnapshotListener { querySnapshot, error in
            guard let documents = querySnapshot?.documents else {
                print("No documents")
                return
            }
            documents.forEach { queryDocumentSnapshot in
                let documentID = queryDocumentSnapshot.documentID
                let data = queryDocumentSnapshot.data()
                let userName = data["userName"] as? String ?? ""
                let profileImgUrl = data["profileImgUrl"] as? String ?? ""
                self.users[documentID] = User(documentID: documentID, userName: userName, profileImgUrl: profileImgUrl)
            }
        }
    }
}
