//
//  CustomCell1MessagesFlowLayout.swift
//  Persona
//
//  Created by Allan Zhang on 2/15/23.
//

import UIKit
import MessageKit

open class CustomMessagesCollectionViewFlowLayout: MessagesCollectionViewFlowLayout {
    lazy open var customCell1SizeCalculator = CustomCell1SizeCalculator(layout: self)
    lazy open var customTextMessageCellSizeCalculator = CustomTextMessageCellSizeCalculator(layout: self)
    lazy open var customMediaMessageCellSizeCalculator = CustomMediaMessageCellSizeCalculator(layout: self)
    lazy open var customPostMessageCellSizeCalculator = CustomPostMessageCellSizeCalculator(layout: self)
    lazy open var customProposalMessageCellSizeCalculator = CustomProposalMessageCellSizeCalculator(layout: self)

    // added by Allan: constants defined for the custom layouts
    public static var avatarSize = 30
    public static var bottomLabelInsets = UIEdgeInsets(top: 4, left: 0, bottom: 28, right: 0)
    public static var bottomLabelFont = UIFont.preferredFont(forTextStyle: .footnote)
    public static var bottomLabelColor = UIColor.lightGray.withAlphaComponent(0.5)
    public static var topLabelFont = UIFont.preferredFont(forTextStyle: .subheadline)
    public static var topLabelColor = UIColor.white.withAlphaComponent(0.8)
    
    public override init() {
        super.init()
        customInit()
    }
    
    public required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        customInit()
    }
    
    private func customInit() {
        // Added by Allan: avatar and top&bottom labels setup
        setMessageIncomingAvatarPosition(AvatarPosition(vertical: .cellTop))
        setMessageOutgoingAvatarPosition(AvatarPosition(vertical: .cellTop))
        setMessageIncomingMessageBottomLabelAlignment(
            .init(textAlignment: .left,
                  textInsets: .init(top: CustomMessagesCollectionViewFlowLayout.bottomLabelInsets.top,
                                    left: CustomMessagesCollectionViewFlowLayout.bottomLabelInsets.left + CGFloat(CustomMessagesCollectionViewFlowLayout.avatarSize) + 6,
                                    bottom: CustomMessagesCollectionViewFlowLayout.bottomLabelInsets.bottom,
                                    right: CustomMessagesCollectionViewFlowLayout.bottomLabelInsets.right)))
        setMessageOutgoingMessageBottomLabelAlignment(
            .init(textAlignment: .right,
                  textInsets: .init(top: CustomMessagesCollectionViewFlowLayout.bottomLabelInsets.top,
                                    left: CustomMessagesCollectionViewFlowLayout.bottomLabelInsets.left,
                                    bottom: CustomMessagesCollectionViewFlowLayout.bottomLabelInsets.bottom,
                                    right: CustomMessagesCollectionViewFlowLayout.bottomLabelInsets.right + 6)))
    }
    
    override open func cellSizeCalculatorForItem(at indexPath: IndexPath) -> CellSizeCalculator {
        //before checking the messages check if section is reserved for typing otherwise it will cause IndexOutOfBounds error
        if isSectionReservedForTypingIndicator(indexPath.section) {
            return typingIndicatorSizeCalculator
        }
        let message = messagesDataSource.messageForItem(at: indexPath, in: messagesCollectionView)
        switch message.kind {
        case .text, .attributedText, .emoji:
            if (message as? Message)?.proposal != nil {
                return customProposalMessageCellSizeCalculator
            } else if (message as? Message)?.replyMessage != nil {
                return customCell1SizeCalculator
            } else {
                return customTextMessageCellSizeCalculator
            }
        case .photo, .video:
            if ((message as? Message)?.includedText ?? "").isEmpty {
                return customMediaMessageCellSizeCalculator
            } else {
                return customCell1SizeCalculator
            }
        case .custom(let data):
            if let _ = data as? Post {
                return customPostMessageCellSizeCalculator
            } else if let _ = data as? Proposal {
                return customProposalMessageCellSizeCalculator
            } else {
                return customCell1SizeCalculator
            }
        default:
            return super.cellSizeCalculatorForItem(at: indexPath)
        }
    }
    
    open override func messageSizeCalculators() -> [MessageSizeCalculator] {
        var calculators = super.messageSizeCalculators()
        calculators.append(customCell1SizeCalculator)
        calculators.append(customTextMessageCellSizeCalculator)
        calculators.append(customMediaMessageCellSizeCalculator)
        calculators.append(customPostMessageCellSizeCalculator)
        calculators.append(customProposalMessageCellSizeCalculator)
        return calculators
    }
}
