//
//  TriggerManager.swift
//  Persona
//
//  Created by Allan Zhang on 3/7/23.
//

import Foundation

@objc(TriggerManager)
class TriggerManager: RCTEventEmitter {
    
    public static var shared: TriggerManager?
    
    override init() {
        super.init()
        TriggerManager.shared = self
    }
    
    @objc
    func triggerReactNative(bodyData: String) {
        sendEvent(withName: "onTriggerReactNative", body: bodyData)
    }
    
    @objc
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func constantsToExport() -> [AnyHashable : Any]! {
        return [:]
    }
    
    //⚠️ Required function. These are the events RN is listening for
    override func supportedEvents() -> [String]! {
        return ["onTriggerReactNative"]
    }
}
