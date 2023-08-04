//
//  ContainerView.swift
//  Persona
//
//  Created by Allan Zhang on 2/5/23.
//

import UIKit

@objc public class ContainerView: UIView {
    
    weak var nativeChatViewController: NativeChatViewController?
    @objc public var uiManager: RCTUIManager?
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        self.backgroundColor = .lightGray
    }
    
    public override func layoutSubviews() {
        super.layoutSubviews()

        if nativeChatViewController == nil {
            embed()
        } else {
            let verticalAdjustment: CGFloat = 0.0
            nativeChatViewController?.view.frame = CGRect(x: 0,
                                                          y: verticalAdjustment,
                                                          width: bounds.width,
                                                          height: bounds.height-verticalAdjustment)
        }
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func embed() {
        guard let parentVC = parentViewController else {
            print ("Unable to find parentViewController from UIView")
            return
        }
        
        //Original, working set
        let nativeChatViewController = NativeChatViewController()
        parentVC.addChild(nativeChatViewController)
        addSubview(nativeChatViewController.view)
        nativeChatViewController.view.frame = bounds
        nativeChatViewController.didMove(toParent: parentVC)
        self.nativeChatViewController = nativeChatViewController
        nativeChatViewController.uiManager = uiManager
    }
    
    
}

extension UIView {
    var parentViewController: UIViewController? {
        var parentResponder: UIResponder? = self
        while parentResponder != nil {
            parentResponder = parentResponder!.next
            if let viewController = parentResponder as? UIViewController {
                return viewController
            }
        }
        return nil
    }
}

