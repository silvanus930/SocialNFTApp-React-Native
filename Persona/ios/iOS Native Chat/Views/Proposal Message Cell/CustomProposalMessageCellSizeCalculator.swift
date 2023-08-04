//
//  CustomProposalMessageCellSizeCalculator.swift
//  MessageKitChatProject
//
//  Created by Master on 3/9/23.
//

import UIKit
import MessageKit
  
open class CustomProposalMessageCellSizeCalculator: MessageSizeCalculator {
    
    public var incomingMessageLabelInsets = UIEdgeInsets(top: 10, left: 18, bottom: 10, right: 14)
    public var outgoingMessageLabelInsets = UIEdgeInsets(top: 10, left: 14, bottom: 10, right: 18)
    public static var verticalSpacing: CGFloat = 10
    public static var proposalLabelBottomSpacing: CGFloat = 8
    public static var cardViewInsets = UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10)
    public static var contentViewInsets = UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10)
    public static var actionButtonHeight: CGFloat = 100
    
    public static var avatarImageViewSize: CGFloat = 20
    
    public var messageLabelFont = UIFont.preferredFont(forTextStyle: .body)
    
    internal func messageLabelInsets(for message: MessageType) -> UIEdgeInsets {
        let dataSource = messagesLayout.messagesDataSource
        let isFromCurrentSender = dataSource.isFromCurrentSender(message: message)
        return isFromCurrentSender ? outgoingMessageLabelInsets : incomingMessageLabelInsets
    }
    
    open override func messageContainerMaxWidth(for message: MessageType) -> CGFloat {
        let maxWidth = super.messageContainerMaxWidth(for: message)
        let textInsets = messageLabelInsets(for: message)
        return maxWidth - textInsets.horizontal
    }
    
    open override func messageContainerSize(for message: MessageType) -> CGSize {
        let maxWidth = super.messageContainerMaxWidth(for: message)
        
        var messageContainerSize: CGSize = CGSize(width: maxWidth, height: 0)

        var proposal: Proposal? = nil
        var messageLabelText: NSAttributedString
        switch message.kind {
        case .text(let text), .emoji(let text):
            proposal = (message as? Message)?.proposal
            messageLabelText = NSAttributedString(string: text, attributes: [.font: messageLabelFont])
        case .attributedText(let text):
            proposal = (message as? Message)?.proposal
            messageLabelText = text
        case .custom(let data):
            proposal = data as? Proposal
            messageLabelText = NSAttributedString()
        default:
            messageLabelText = NSAttributedString()
            break
        }

        if let proposal = proposal {
            messageContainerSize.height = CustomProposalMessageCellSizeCalculator.contentViewInsets.top
            messageContainerSize.height += CustomProposalMessageCell.proposalLabelFont.lineHeight
            messageContainerSize.height += CustomProposalMessageCellSizeCalculator.proposalLabelBottomSpacing
            messageContainerSize.height += CustomProposalMessageCellSizeCalculator.cardViewInsets.top * 2
            messageContainerSize.height += CustomCell1SizeCalculator.labelSize(
                for: NSAttributedString(string: proposal.proposalTitle, attributes: [.font: CustomProposalMessageCell.titleLabelFont]),
                considering: maxWidth - CustomProposalMessageCellSizeCalculator.cardViewInsets.horizontal * 2 - CustomProposalMessageCellSizeCalculator.contentViewInsets.horizontal
            ).height
            messageContainerSize.height += CustomProposalMessageCellSizeCalculator.verticalSpacing
            messageContainerSize.height += CustomCell1SizeCalculator.labelSize(
                for: NSAttributedString(string: proposal.text, attributes: [.font: CustomProposalMessageCell.descriptionLabelFont]),
                considering: maxWidth - CustomProposalMessageCellSizeCalculator.cardViewInsets.horizontal * 2 - CustomProposalMessageCellSizeCalculator.contentViewInsets.horizontal
            ).height
            messageContainerSize.height += CustomProposalMessageCellSizeCalculator.verticalSpacing
            messageContainerSize.height += CustomProposalMessageCellSizeCalculator.actionButtonHeight
            messageContainerSize.height += CustomProposalMessageCellSizeCalculator.verticalSpacing
            messageContainerSize.height += CustomProposalMessageCell.quorumLabelFont.lineHeight
            
            messageContainerSize.height += CustomProposalMessageCellSizeCalculator.verticalSpacing
            
            if messageLabelText.length == 0 {
                messageContainerSize.height += CustomProposalMessageCellSizeCalculator.contentViewInsets.bottom
            } else {
                messageContainerSize.height += CustomCell1SizeCalculator.labelSize(
                    for: messageLabelText,
                    considering: maxWidth - messageLabelInsets(for: message).horizontal
                ).height + messageLabelInsets(for: message).vertical
            }
        }
        
        return messageContainerSize
    }
    
    open override func messageContainerPadding(for message: MessageType) -> UIEdgeInsets {
        var edgeInsets = super.messageContainerPadding(for: message)

        let avatarWidth = avatarSize(for: message).width
        let messagePadding = super.messageContainerPadding(for: message)
        let accessoryWidth = accessoryViewSize(for: message).width
        let accessoryPadding = accessoryViewPadding(for: message)
        var maxWidth = messagesLayout.itemWidth - avatarWidth - messagePadding.horizontal - accessoryWidth - accessoryPadding.horizontal - avatarLeadingTrailingPadding
        let messageInsets = messageLabelInsets(for: message)
        
        switch message.kind {
        case .custom(let reply):
            if let parentMessage = (reply as? ReplyMessageData)?.originalMessage {
                switch parentMessage.kind {
                case .photo(let item):
                    maxWidth = CustomCell1SizeCalculator.sizeForMediaItem(maxWidth: maxWidth - messageInsets.horizontal, item: item, isReply: true).width + messageInsets.horizontal
                case .video(let item):
                    maxWidth = CustomCell1SizeCalculator.sizeForMediaItem(maxWidth: maxWidth - messageInsets.horizontal, item: item, isReply: true).width + messageInsets.horizontal
                default:
                    break
                }
            }
        case .photo(let item):
            maxWidth = CustomCell1SizeCalculator.sizeForMediaItem(maxWidth: maxWidth - messageInsets.horizontal, item: item, isReply: false).width + messageInsets.horizontal
        case .video(let item):
            maxWidth = CustomCell1SizeCalculator.sizeForMediaItem(maxWidth: maxWidth - messageInsets.horizontal, item: item, isReply: false).width + messageInsets.horizontal
        default:
            break
        }
        
        // reactions
        let reactionsHeight = MessageSizeCalculator.calculateReactionsViewSize(for: message, maxWidth: maxWidth).height
        edgeInsets.bottom += reactionsHeight > 0 ? reactionsHeight + 10 : 0
        edgeInsets.bottom += ((message as? Message)?.threadMessages ?? []).isEmpty ? 0 : AppConstants.ViewStandards.THREADS_BUTTON_HEIGHT
        return edgeInsets
    }
    
    open override func configure(attributes: UICollectionViewLayoutAttributes) {
        super.configure(attributes: attributes)
        guard let attributes = attributes as? MessagesCollectionViewLayoutAttributes else { return }
        
        let dataSource = messagesLayout.messagesDataSource
        let indexPath = attributes.indexPath
        let message = dataSource.messageForItem(at: indexPath, in: messagesLayout.messagesCollectionView)
        
        attributes.messageLabelInsets = messageLabelInsets(for: message)
        attributes.messageLabelFont = messageLabelFont
        
        switch message.kind {
        case .attributedText(let text):
            guard !text.string.isEmpty else { return }
            guard let font = text.attribute(.font, at: 0, effectiveRange: nil) as? UIFont else { return }
            attributes.messageLabelFont = font
        default:
            break
        }
    }
}
