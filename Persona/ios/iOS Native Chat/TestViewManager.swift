//
//  TestViewManager.swift
//  Persona
//
//  Created by Allan Zhang on 2/4/23.
//

import Foundation
import UIKit

@objc (TestViewManager)
class TestViewManager: RCTViewManager {
  override func view() -> UIView! {

    let view = UIView(frame: CGRect(x: 0, y: 0, width: view.frame.width , height: view.frame.height))
    view.backgroundColor = UIColor.link
    
    return view
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
}
