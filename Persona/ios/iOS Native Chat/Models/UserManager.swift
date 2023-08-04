//
//  UserManager.swift
//  Persona
//
//  Created by Allan Zhang on 2/12/23.
//

import Foundation

@objc(UserManager)
class UserManager: NSObject {
    
    @objc static let shared = UserManager()
    @objc var currentChatDocPath: String = "communities/personateam/chat/all" //update this from received info
    @objc var currentUserId: String = "system"
    @objc var scrollToMessageID: String?
    @objc var startingInDM: Bool = false {
        didSet {
            userIsStartingInDmChatPaths[startingInDM] = currentChatDocPath
            print ("From UserManager ⚛️ \(userIsStartingInDmChatPaths)")
        }
    }
    var userIsStartingInDmChatPaths = [Bool: String]() //this keeps track of chat paths between users
    
    
    var currentPersonaCommunity: PersonaCommunity?
    var currentUsername: String = "system"
    var allPersonaUsers: [PersonaUser] = []
    
    
    override init() {
            super.init()
            retrieveCachedUsers() // Retrieve cached users from disk as soon as the object is alive
        }
    
    @objc func chatScreenRendered(_ data: NSDictionary) {
        //the data includes chatDocPath, communityID and personaKey (optional)
        NotificationCenter.default.post(name: Notification.Name("chatScreenRendered"), object: self, userInfo: data as? [AnyHashable : Any])
        print ("🍎 Sending chat rendered with data \(data)")
    }
    
    @objc func sideBarRendered() {
//        NotificationCenter.default.post(name: Notification.Name("sideBarRendered"), object: self)
        print ("⬇️Calling sideBarRendered")
    }
    
    @objc func sideBarRemoved() {
//        NotificationCenter.default.post(name: Notification.Name("sideBarRemoved"), object: self)
        print ("⬆️Showing after sidebar removed")
    }
    
    //This updates the list of PersonaUsers retrieved from the internet
    public func updateUsersListWith(retrievedUsers: [PersonaUser]) {
        self.allPersonaUsers.removeAll()
        self.allPersonaUsers = retrievedUsers
        
        //After retrival, store the users
        self.cacheRetrievedUsers()
    }
    
    public func updateUserListFromCacheWith(personaUsers: [PersonaUser]) {
        self.allPersonaUsers.removeAll()
        self.allPersonaUsers = personaUsers
    }
    

    public func getUserNameFrom(userId: String) -> String? {
        if self.allPersonaUsers.isEmpty {
            return nil
        }
        
        for personaUser in self.allPersonaUsers {
            if personaUser.id == userId {
                return personaUser.userName
            }
        }
        return nil
    }
    
    public func getUserProfileImageUrlFrom(userId: String) -> String? {
        if self.allPersonaUsers.isEmpty {
            return nil
        }
        
        for personaUser in self.allPersonaUsers {
            if personaUser.id == userId {
                return personaUser.profileImgUrl
            }
        }
        return nil
    }
}

//MARK: - Storing user objects on the disk
extension UserManager {
    private func cacheRetrievedUsers() {
        // Archive PersonaUser objects
        let data = try? NSKeyedArchiver.archivedData(withRootObject: allPersonaUsers, requiringSecureCoding: false)

        // Write archived data to file
        let fileManager = FileManager.default
        guard let documentDirectory = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return
        }
        let archiveURL = documentDirectory.appendingPathComponent("PersonaUsers.archive")
        do {
            try data?.write(to: archiveURL)
            print ("📲Successfully archived user data")
        } catch {
            print("Error writing PersonaUsers archive: \(error)")
        }
    }
    
    private func retrieveCachedUsers() {
        // Read archived data from file
        let fileManager = FileManager.default
        guard let documentDirectory = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return
        }
        let archiveURL = documentDirectory.appendingPathComponent("PersonaUsers.archive")
        guard let data = try? Data(contentsOf: archiveURL) else {
            return
        }

        // Unarchive PersonaUser objects
        if let personaUsers = try? NSKeyedUnarchiver.unarchiveTopLevelObjectWithData(data) as? [PersonaUser] {
            print ("📲Successfully retrieved user data")
            self.updateUserListFromCacheWith(personaUsers: personaUsers)
        }

    }
}
