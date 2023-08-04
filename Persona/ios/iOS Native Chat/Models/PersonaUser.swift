//
//  PersonaUser.swift
//  Persona
//
//  Created by Allan Zhang on 2/24/23.
//

import Foundation

class PersonaUser: NSObject, NSCoding {
    let id: String
    let userName: String
    let defaultCommunityID: String
    let profileImgUrl: String
    
    init(id: String,
         userName: String,
         defaultCommunityID: String,
         profileImgUrl: String) {
        self.id = id
        self.userName = userName
        self.defaultCommunityID = defaultCommunityID
        self.profileImgUrl = profileImgUrl
    }
    
    func outputSelf() {
        print ("👩🏼 The user is \(userName), with id \(id) and a profileURL of \(profileImgUrl)")
    }
    
    // MARK: - NSCoding methods
    
    required init?(coder aDecoder: NSCoder) {
        id = aDecoder.decodeObject(forKey: "id") as! String
        userName = aDecoder.decodeObject(forKey: "userName") as! String
        defaultCommunityID = aDecoder.decodeObject(forKey: "defaultCommunityID") as! String
        profileImgUrl = aDecoder.decodeObject(forKey: "profileImgUrl") as! String
    }
    
    func encode(with aCoder: NSCoder) {
        aCoder.encode(id, forKey: "id")
        aCoder.encode(userName, forKey: "userName")
        aCoder.encode(defaultCommunityID, forKey: "defaultCommunityID")
        aCoder.encode(profileImgUrl, forKey: "profileImgUrl")
    }
}

