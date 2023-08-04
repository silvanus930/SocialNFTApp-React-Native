//
//  MessageStructure.swift
//  Persona
//
//  Created by Allan Zhang on 2/6/23.
//

import Foundation
import MessageKit
import Firebase

class Message: MessageType {
    
    //Required by MessageKit
    var sender: MessageKit.SenderType
    var kind: MessageKit.MessageKind
    var sentDate: Date
    var messageId: String
    
    //Required by Persona
    var isDeleted: Bool
    var isThread: Bool
    var seen: [String : Any]
    var includedText: String = ""
    
    //Optional types
    var history: [String: Any]?
    var replyComment: [String: Any]?
    var endorsements: EmojiReactionData?
    var mediaHeight: Int?
    var mediaWidth: Int?
    var mediaUrl: String?
    var post: Post?
    var proposal: Proposal?
    var replyMessage: Message? //A reply is recursively cast as a message
    var threadMessages: [Message]?
    var showFullPostMessage: Bool = false
    
    init(sender: MessageKit.SenderType, kind: MessageKit.MessageKind, sentDate: Date, messageId: String, isDeleted: Bool, isThread: Bool, seen: [String: Any], includedText: String = "") {
        self.sender = sender
        self.kind = kind
        self.sentDate = sentDate
        self.messageId = messageId
        self.isDeleted = isDeleted
        self.isThread = isThread
        self.seen = seen
        self.includedText = includedText
    }
    
    func outputSelf() {
        print ("💌 The core attributes of the message: main text \(includedText) ----")
        print (sender, kind, sentDate, messageId, isDeleted, isThread)
//        print ("💌 The seen dict is \(seen)")
//        if let replyMsg = replyMessage {
//            print ("💌 Just outputting reply message ----")
//            print ("\(replyMsg.includedText) for \(replyMsg.mediaUrl)")
//        }
        
       
    }
}

//This is a forum post inside Personas
struct Post {
    var anonymous: Bool
    var entityID: String
    var galleryUris: [Any]
    var mediaMuted: Bool
    var mediaRotate: Bool
    var mediaType: String
    var mediaUrl: String
    var text: String // this is what is shown in subtitle
    var title: String // this is what is shown in title
    var userID: String
    var userName: String
    var userProfileImgUrl: String
    var id: String //the id of the post
    var ref: DocumentReference //the full link to the post
    var editDate: Date?
}

//This is a post that involves an interactive timer and voting

struct Proposal {
    var actions: [ProposalAction]
    var createdAt: Date //this is when the proposal was initially made
    var createdBy: String //this is the userId of the creator of the post
    var deleted: Bool
    var endTime: Date //this is when the proposal's voting will end
    var entityId: String
    var postID: String //note that ID word has both letters capitalized
    var postRef: DocumentReference
    var proposalTitle: String
    var quorum: Int
    var snapshotTime: Date //not displayed. For internal purposes
    var sourceRef: DocumentReference //the community/person where its from
    var startTime: Date //when the voting started
    var text: String //This is a system generated text that says "new proposal created"
    var timestamp: Date //This is a system generated time stamp
    var userID: String //system generated userID
    var votes: [String: Int] //string is the userID, Int is type of vote: 0, 1 or 2
    var voteType: Int
}

struct ProposalAction {
    var amount: Int
    var currency: String
    var targetRef: String //DocumentReference
    var type: String
}


struct Sender: SenderType {
    var senderId: String
    var displayName: String
}

public enum MediaMessageType {
    case photo
    case video
}

struct MessageMediaItem: MediaItem { //Required, when assgining a MessageKit message as photo/video
    var url: URL?
    var image: UIImage?
    let placeholderImage: UIImage
    var size: CGSize
    var mediaType: MediaMessageType
    
    init(url: URL?, image: UIImage?, placeholderImage: UIImage, size: CGSize, mediaType: MediaMessageType) {
        self.url = url
        self.image = image
        self.placeholderImage = placeholderImage
        self.size = size
        self.mediaType = mediaType
    }
}

struct ReplyMessageData {
    var text: String
    var originalMessage: Message
}

struct EmojiReactionData {
    /*
     Reactions is a dictionary of emojis. Each emoji includes an array of users
     
     Example:
     
     "❤️": ["user_id_1", "user_id_2"],
     "🤙": ["user_id_1", "user_id_2", "user_id_3", "user_id_4"],
     "✅": ["user_id_3", "user_id_4", "user_id_5", "user_id_6"],
     
     */
    var reactions: [String: [String]]
}
