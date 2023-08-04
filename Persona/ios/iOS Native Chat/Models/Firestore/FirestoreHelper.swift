//
//  FirestoreHelper.swift
//  Persona
//
//  Created by Allan Zhang on 2/8/23.
//

import Foundation
import FirebaseFirestore

class FirestoreHelper {
    
    static let shared = FirestoreHelper()
    
    //This is the primary function for processing data from Firestore
    func processDocumentAndReturnMessageWith(document: [String: Any], documentID: String) -> Message? {
        
        //Step 1: Process core Message data, with the seen array
        guard var message = self.processCoreMessageDataWith(document: document, documentID: documentID) else {
            print ("Unable to process core Message data")
            return nil
        }
        
        //Step 2: Append the reply info to the message
        if let replyData = document["replyComment"] as? [String: Any],
           let replyMessageId = replyData["id"] as? String {
            //Use core message and media to populate the message object
            message.replyMessage = self.processReplyDataFrom(document: replyData, documentID: replyMessageId)
            guard let repliedMessage = message.replyMessage else {
                print ("⚠️ Did not cast reply message")
                return message
            }
            
            message.kind = .custom(ReplyMessageData(text: message.includedText, originalMessage: repliedMessage))
            
        } else {
//            print ("Message missing reply data")
        }
        
        //Step 2.5: Thread info. To be completed
        
        
        //Step 3: Append rich info like media, post
        //💡 A media message cannot be a post (though a post can contain images)
        if let mediaUrl = document["mediaUrl"] as? String,
           !mediaUrl.isEmpty {
//            print ("💡1 Found media url: mediaUrl")
            message = self.processAndUpdateMessageWithMedia(message: message, mediaUrl: mediaUrl)

        } else if document.keys.contains("post") {
            print ("about to process post")
            //Add post data to the message object, with a Post designation
            if let postData = document["post"] as? [String: Any] {
                if let post: Post = FirestoreHelper.shared.processPostDataFrom(document: postData) {
                    message.post = post
                    
                    //update the message type to be a post type
                    message.kind = .custom(post)
                    
                    //the message sender needs to be updated to the post's attributes
                    message.sender = Sender(senderId: post.userID, displayName: post.userName)
                } else {
                    print ("unable to return to post object because returned nil from helper")
                }
            } else {
                print ("Incorrect casting for post")
            }
        }
        
        //Step 4: Append endorsement info to the message, if any
        if let endorsements = document["endorsements"] as? [String: [String]],
           !endorsements.isEmpty {
            self.processAndUpdateMessageWithEmojiReactions(message: message, endorsements: endorsements)
        }

        return message
    }
    
    func processCoreMessageDataWith(document: [String: Any], documentID: String) -> Message? {
        
        //Step 1: Process the raw data
        let messageId = documentID
        guard let messageText = document["text"] as? String,
              let senderID = document["userID"] as? String,
              let sentDate = document["timestamp"] as? Timestamp,
              let isDeleted = document["deleted"] as? Int,
              let isThread = document["isThread"] as? Int else {
            print ("Unable to acquire core Message data")
            return nil
        }
        
        //Step 2: Process seen data (required)
        guard let seenData = document["seen"] as? [String: Any] else {
            print ("Unable to acquire seen data")
            return nil
        }
        let castedSeenData = self.processSeenData(seenDictionary: seenData)
        
        //Step 3: Cast the basic message and return it
        let message = Message(sender: self.processSenderIdInfoWith(senderId: senderID),
                              kind: .text(messageText), //Possible to reconfigure all as custom
                              sentDate: sentDate.dateValue(),
                              messageId: messageId,
                              isDeleted: self.processIntToReturnBool(feeder: isDeleted),
                              isThread: self.processIntToReturnBool(feeder: isThread),
                              seen: castedSeenData)
        message.includedText = messageText
        

        return message
    }
    
    func processAndUpdateMessageWithEmojiReactions(message: Message, endorsements: [String: [String]]) {
        message.endorsements = EmojiReactionData(reactions: endorsements)
    }
    
    func processAndUpdateMessageWithThreadMessages(message: Message) {
        // Nunance:
        // Despite a message starting a thread, the message itself will be marked as isThread: false
        // `threads` is a collection associated with the message
        // the messages inside `threads` have a isThread property of true
        
        
    }
    
    func processAndUpdateMessageWithMedia(message: Message, mediaUrl: String) -> Message {
        
        //Ascertain: MessageKit for all media types: gif, img, jpg, jpeg, png. May need to recast
        //Ascertain: size calculations.
        
//        print ("📸 Post is a media post")
        let mediaType = self.isPhotoOrVideo(mediaUrl: mediaUrl)
        let genericSize = CGSize(width: 250, height: 250)
        guard let placeholderImage = UIImage(named: "placeholderPNG") else {
            print ("🚨 Unable to locate the core placeholder image")
            return message
        }
        
//        print ("String media URL: \(mediaUrl)")
        guard let convertedURL = URL(string: mediaUrl) else {
            print ("🚨 Unable to turn string URL into URL URL")
            return message
        }
        
        let myMediaItem = MessageMediaItem(url: convertedURL,
                                           image: placeholderImage,
                                           placeholderImage: placeholderImage, //should be a thumbnail for the video AZ
                                           size: genericSize,
                                           mediaType: mediaType)
        //update the message with media type
        if mediaType == .video {
            message.kind = .video(myMediaItem)
        } else {
            message.kind = .photo(myMediaItem)
        }
        
        //Assigns the main mediaUrl property
        message.mediaUrl = mediaUrl
        
//        print ("💡2 Return updated message with kind \(message.kind)")
        return message
    }
    
    func processReplyDataFrom(document: [String: Any], documentID: String) -> Message? {
        
        //Step 1. Process core message data
        guard var replyMessage = self.processCoreMessageDataWith(document: document, documentID: documentID) else {
            print ("Unable to process core Message data")
            return nil
        }
        
        //Step 2. Process and append optional rich media data like photo or video
        if let mediaUrl = document["mediaUrl"] as? String, !mediaUrl.isEmpty {
            //Start here and outputt the medialUrl for the reply message. There should be done
            replyMessage = self.processAndUpdateMessageWithMedia(message: replyMessage, mediaUrl: mediaUrl)
        }
        
        return replyMessage
    }
    
    func processProposalDataFrom(document: [String: Any]) -> Proposal? {
        
        
        
        return nil
    }
    
    func processPostDataFrom(document: [String: Any]) -> Post? {
        //3 keys in posts: data, id, and ref (reference path)
        if  let postData = document["data"] as? [String: Any],
            let postId = document["id"] as? String,
            let postRef = document["ref"] as? DocumentReference {
            if let anonymous = postData["anonymous"] as? Int,
               let entityID = postData["entityID"] as? String,
               let galleryUris = postData["galleryUris"] as? [Any],
               let mediaMuted = postData["mediaMuted"] as? Int,
               let mediaRotate = postData["mediaRotate"] as? Int,
               let mediaType = postData["mediaType"] as? String,
               let mediaUrl = postData["mediaUrl"] as? String,
               let text = postData["text"] as? String,
               let title = postData["title"] as? String,
               let userID = postData["userID"] as? String,
               let userName = postData["userName"] as? String,
               let userProfileImgUrl = postData["userProfileImgUrl"] as? String {
                print ("✅ Successfully casted all post stuff")
                
                //Cast the entire thing
                let post = Post(anonymous: self.processIntToReturnBool(feeder: anonymous),
                                entityID: entityID,
                                galleryUris: galleryUris,
                                mediaMuted: self.processIntToReturnBool(feeder: mediaMuted),
                                mediaRotate: self.processIntToReturnBool(feeder: mediaRotate),
                                mediaType: mediaType,
                                mediaUrl: mediaUrl,
                                text: text,
                                title: title,
                                userID: userID,
                                userName: userName,
                                userProfileImgUrl: userProfileImgUrl,
                                id: postId,
                                ref: postRef)
                return post
            } else {
                self.printMissingPostInfoWith(postData: postData)
            }
        } else {
            print ("missing foundation casting for data \(document["data"]) id \(document["id"]) and ref \(document["ref"])")
        }
        return nil
    }
    
    
  
}



//MARK: Helper functions 
extension FirestoreHelper {
    
    //Processes who the sender is
    private func processSenderIdInfoWith(senderId: String) -> Sender {
        /*
         For testing, this current casts all sender as selfSender.
         
         To properly cast Sender type, it will require linkage to the RN base, with
         1. self-user ID (required)
         2. self-user name (optional)
         3. a list of users with their names (optional)
         
         Listening to the Persona/Community for a list of names is also needed
         
         */
        
        var messageSender = Sender(senderId: senderId, displayName: "user")
        if let userName = UserManager.shared.getUserNameFrom(userId: senderId) {
            messageSender = Sender(senderId: senderId, displayName: userName)
        } else {
            print ("Do not have username from database")
        }
        
        return (messageSender)
    }
    
    public func isPhotoOrVideo(mediaUrl: String) -> MediaMessageType{
        if mediaUrl.contains("mp4") || mediaUrl.contains("mov") {
            return MediaMessageType.video
        } else {
            return MediaMessageType.photo //gif, img, jpg, jpeg, png
        }
        
    }
    
    //Seen is a dictionary with String: Timestamp, which is converted to String: Date
    private func processSeenData(seenDictionary: [String: Any]) -> [String: Date]{
//        print ("about to process seen data")
        var castedSeenData = [String: Date]()
        for item in seenDictionary {
            if let userId = item.key as? String,
               let seenDate = item.value as? Timestamp {
                castedSeenData[userId] = seenDate.dateValue()
            } else {
                print ("Missing key info \(item.key) \(item.value)")
            }
        }
        
        return castedSeenData
    }
    
    func processUserDocumentAndReturnPersonaUserWith(document: [String: Any], documentID: String) -> PersonaUser? {
        
        let userId = documentID
        guard let userName = document["userName"] as? String,
              let defaultCommunityID = document["defaultCommunityID"] as? String,
              let profileImgUrl = document["profileImgUrl"] as? String else {
            return nil
        }
        
        let personaUser = PersonaUser(id: userId,
                                      userName: userName,
                                      defaultCommunityID: defaultCommunityID,
                                      profileImgUrl: profileImgUrl)
        
        return personaUser
    }
    
    //Firebase casts Boolean as 1/0, this turns them into Swift Booleans
    private func processIntToReturnBool(feeder: Int) -> Bool {
        if feeder == 1 {
            return true
        } else {
            return false
        }
    }
    
    //Can't cast stuff in a Post? Print them
    private func printMissingPostInfoWith(postData: [String: Any]) {
        print ("⚠️ Missing an element from below")
        print(postData["anonymous"], postData["entityID"], postData["galleryUris"], postData["mediaMuted"], postData["mediaRotate"], postData["mediaType"], postData["mediaUrl"], postData["text"], postData["title"], postData["userID"], postData["userName"], postData["userProfileImgUrl"])
    }
}


