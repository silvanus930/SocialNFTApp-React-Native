//
//  FirestoreManager.swift
//  Persona
//
//  Created by Allan Zhang on 2/7/23.
//

import Foundation
import FirebaseFirestore

public enum FirestoreErrors: Error {
    case failedToGetMessagesInsideChat
    case retrievedNoResults
    case failedToGetUsers
    case failedToGetDocumentFromPath
}

public enum CollectionType: String {
    case communities
    case personas
}

public enum MessagesCollectionType: String {
    case messages
    case comments //for the messages inside a post
}

// This class manages the native chat's interaction with

class FirestoreManager {
    
    static let shared = FirestoreManager()
    private let database = Firestore.firestore()
    var currentMessagesListner: ListenerRegistration?
    var currentCommentsListner: ListenerRegistration?
    
    
    /// Retrieves messages from a particular collection based on its type and ID
    public func retrieveAndListenForMessagesFrom(chatDocPath: String,
                                                 messagesCollectionType: MessagesCollectionType = .messages,
                                                 completion: @escaping (Result<[Message], Error>) -> Void) {
        NSLog ("⏰ Started retrieved messages")
        
        let referencePath = "\(chatDocPath)/\(messagesCollectionType.rawValue)"
        print ("ref path: \(referencePath)")
        
        let retrieveLimit: Int = 50 //limit the total number of items retrieved
        
        //Two different type of listners: Messags and Comments
        if messagesCollectionType == .messages {
            self.currentMessagesListner = database.collection(referencePath)
                .order(by: "timestamp", descending: true)
                .whereField("deleted", isEqualTo: false) //do not include isDeleted messages
                .limit(to: retrieveLimit)
                .addSnapshotListener { querySnapshot, error in
                    guard let snapshot = querySnapshot, error == nil else {
                        print ("Error: unable to retrieve messages inside chat \(error!)")
                        completion(.failure(FirestoreErrors.failedToGetMessagesInsideChat))
                        return
                    }
                    
                    let items = snapshot.documents
                    
                    var messages = [Message]()
                    for item in items {
                        let itemData = item.data()
                        let itemReferenceDocumentID = item.reference.documentID
                        if let castedMessage = FirestoreHelper.shared.processDocumentAndReturnMessageWith(document: itemData, documentID: itemReferenceDocumentID) {
                            
                            //Does the message have a deleted status? If so, don't add it
                            
                            messages.append(castedMessage)
                        }
                    }
                    
                    messages = messages.sorted { message1, message2 in
                        return message1.sentDate < message2.sentDate
                    }
                    
                    completion(.success(messages.suffix(retrieveLimit))) //returning the limit of messages retrived
                }
        } else if messagesCollectionType == .comments {
            self.currentCommentsListner = database.collection(referencePath)
                .order(by: "timestamp", descending: true)
                .whereField("deleted", isEqualTo: false) //do not include isDeleted messages
                .limit(to: retrieveLimit)
                .addSnapshotListener { querySnapshot, error in
                    guard let snapshot = querySnapshot, error == nil else {
                        print ("Error: unable to retrieve messages inside chat \(error!)")
                        completion(.failure(FirestoreErrors.failedToGetMessagesInsideChat))
                        return
                    }
                    
                    let items = snapshot.documents
                    
                    var messages = [Message]()
                    for item in items {
                        let itemData = item.data()
                        let itemReferenceDocumentID = item.reference.documentID
                        if let castedMessage = FirestoreHelper.shared.processDocumentAndReturnMessageWith(document: itemData, documentID: itemReferenceDocumentID) {
                            
                            //Does the message have a deleted status? If so, don't add it
                            
                            messages.append(castedMessage)
                        }
                    }
                    
                    messages = messages.sorted { message1, message2 in
                        return message1.sentDate < message2.sentDate
                    }
                    
                    completion(.success(messages.suffix(retrieveLimit))) //returning the limit of messages retrived
                }
        }
        

    }
    
    
    var isSendingMessage = false
    public func sendMessageWith(text: String,
                                repliedToMessage: Message?,
                                mediaUrl: String? = nil,
                                chatDocPath: String,
                                messagesCollectionType: MessagesCollectionType = .messages,
                                completion: @escaping (Bool) -> Void) {
        
        guard isSendingMessage == false else {
            completion(false)
            return
        }
        
        if mediaUrl == nil { //This only activates for plain text messages
            self.isSendingMessage = true
        }
        
        
        NSLog ("⏰ About to send text message")
        
        let referencePath = "\(chatDocPath)/\(messagesCollectionType.rawValue)"
        print ("ref path: \(referencePath)")
        
//        var chatDesignation = "chat"
        let replyDesignation = "replyComment"

        //Step 1: Form the core message data
        var messageData = self.getCoretextMessageDataWith(text: text)
        

        //Step 2: Add additional items like rich media, reply data, and others to the message
        if let mediaUrl = mediaUrl {
            print ("Detected media url")
            
            //Assign a default height/width
            var width = 1920
            var height = 1080
            
            if let mediaWidth = AWSManager.shared.imageToDimensions[mediaUrl]?.0 as? CGFloat,
               let mediaHeight = AWSManager.shared.imageToDimensions[mediaUrl]?.1 as? CGFloat {
                width = Int(mediaWidth)
                height = Int(mediaHeight)
            }
            
            //mediaUrl
            //mediaWidth
            //mediaHeight
            messageData["mediaUrl"] = mediaUrl
            messageData["mediaWidth"] = width
            messageData["mediaHeight"] = height
        }
        
        //If a reply message is avaliable, add its data to the message data
        if let repliedToMessage = repliedToMessage {
            let replyMessageData = self.getReplyMessageData(repliedToMessage: repliedToMessage)
            messageData[replyDesignation] = replyMessageData
        }
        
        
        database.collection(referencePath).addDocument(data: messageData) { (error) in
            self.isSendingMessage = false
            if error != nil {
                print ("🚨 Error sending text with error \(error!)")
                completion(false)
            } else {
                completion(true)
            }
        }
        
    }
    
    public func updateMessageWithReactions(message: Message,
                                  chatDocPath: String,
                                  messagesCollectionType: MessagesCollectionType = .messages,
                                  completion: @escaping (Bool) -> Void) {
        
        let referencePath = "\(chatDocPath)/\(messagesCollectionType.rawValue)"
        guard let endorsements = message.endorsements else {
            completion(false)
            return
        }
        
        database.collection(referencePath).document(message.messageId).updateData([
            "endorsements": endorsements.reactions
        ]) { error in
            if let error = error {
                print("🧐 Error updating document: \(error)")
                completion(false)
            } else {
                print("🥹 Document successfully updated")
                completion(true)
            }
        }
        
    }
    
    public func retrieveInformationForCurrentPersonaCommunity(chatDocPath: String,
                                                              assignPersonaCommunityToUser: Bool = true,
                                                              completion: @escaping (Result<PersonaCommunity?, Error>) -> Void) {
        
        //1. Isolate the chat doc to the persona level info like "personas/QWlcZwoIW67qY80hjaJA"
        let personaCommunityPath = chatDocPath.split(separator: "/").prefix(2).joined(separator: "/")
        print ("personaCommunityPath is \(personaCommunityPath)")
        
        let docRef = database.document(personaCommunityPath)
        
        //2. Download the info
        docRef.getDocument { querySnapshot, error in
            guard let snapshot = querySnapshot, error == nil else {
                print ("Error: unable to retrieve document info \(error!)")
                completion(.failure(FirestoreErrors.failedToGetDocumentFromPath))
                return
            }
            
            if let name = snapshot["name"] as? String,
               let profileImageUrl = snapshot["profileImgUrl"] as? String {
                
                var personaCommunity = PersonaCommunity(name: name, profileImageUrl: profileImageUrl)
                if let personaID = snapshot["personaID"] as? String {
                    personaCommunity.personaID = personaID
                }
                
                if assignPersonaCommunityToUser {
                    UserManager.shared.currentPersonaCommunity = personaCommunity
                }
                
                completion(.success(personaCommunity))
                
                
            } else {
                print ("Unable to cast core fundamental attributes of a Persona \(snapshot["name"]) \(snapshot["profileImgUrl"])")
                completion(.failure(FirestoreErrors.failedToGetDocumentFromPath))
            }
        }
        
        
    }
    
    private func getReplyMessageData(repliedToMessage: Message) -> [String: Any] {
        
        let replyMessage: [String: Any] = [
            "deleted": false,
            "isThread": false,
            "mediaHeight": repliedToMessage.mediaHeight ?? 0,
            "mediaUrl": repliedToMessage.mediaUrl ?? "",
            "mediaWidth": repliedToMessage.mediaWidth ?? 0,
            "seen": [UserManager.shared.currentUserId : Date()],
            "text": repliedToMessage.includedText,
            "timestamp": repliedToMessage.sentDate,
            
            "userID" : repliedToMessage.sender.senderId,
            
            "id": repliedToMessage.messageId, //needed for reply
            "replyId": repliedToMessage.messageId //needed for reply
        ]
        
        return replyMessage
    }
    
    private func getCoretextMessageDataWith(text: String) -> [String: Any] {
        let newMessage: [String: Any] = [
            "deleted": false,
            "isThread": false,
            "mediaHeight": 0,
            "mediaUrl": "",
            "mediaWidth": 0,
            "seen": [UserManager.shared.currentUserId : Date()],
            "text": text,
            "timestamp": Date(),
            "userID" : UserManager.shared.currentUserId
        ]
        
        return newMessage
    }

    public func getPersonaUsers(completion: @escaping (Result<[PersonaUser], Error>) -> Void) {
        let referencePath = "users"
        database.collection(referencePath).getDocuments { querySnapshot, error in
            guard let snapshot = querySnapshot, error == nil else {
                print ("Error: unable to retrieve users with error: \(error!)")
                completion(.failure(FirestoreErrors.failedToGetUsers))
                return
            }
            
            let items = snapshot.documents
            var downloadedUsers = [PersonaUser]()
            
            for item in items {
                let itemData = item.data()
                let itemReferenceDocumentID = item.reference.documentID
                
                if let castedPersonaUser = FirestoreHelper.shared.processUserDocumentAndReturnPersonaUserWith(document: itemData, documentID: itemReferenceDocumentID) {
                    downloadedUsers.append(castedPersonaUser)
                }
            }
            
            completion(.success(downloadedUsers))
        }
    }
    
    
    public func findPersonaWith(name: String) {
        let referencePath = "\(CollectionType.personas.rawValue)"
        
        database.collection(referencePath).whereField("name", isEqualTo: name).getDocuments { (querySnapshot, error) in
            
            guard let snapshot = querySnapshot, error == nil else {
                return
            }
            
            let documents = snapshot.documents
            //To complete by listing out the persona by their referenc IDs
        }
    }
}
