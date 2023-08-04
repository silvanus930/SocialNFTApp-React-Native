//
//  CustomPostMessageCellSizeCalculator.swift
//  Persona
//
//  Created by Allan Zhang on 3/4/23.
//

import UIKit
import MessageKit

open class CustomPostMessageCellSizeCalculator: MessageSizeCalculator {
    
    public var messageContainerViewPadding = UIEdgeInsets(top: 10, left: 16, bottom: 10, right: 16)
    public static var messageContainerViewMargin = 30.0
    public static var verticalSpacing: CGFloat = 10
    public static var postAvatarSize: CGFloat = 32
    public static var imageSize: CGFloat = 240
    
    public var messageLabelFont = UIFont.preferredFont(forTextStyle: .body)
    
    open override func avatarSize(for message: MessageType) -> CGSize {
        return .zero
    }

    open override func messageContainerMaxWidth(for message: MessageType) -> CGFloat {
        return messagesLayout.itemWidth - CustomPostMessageCellSizeCalculator.messageContainerViewMargin * 2
    }
    
    open override func messageContainerSize(for message: MessageType) -> CGSize {
        let maxWidth = messageContainerMaxWidth(for: message)
        
        var messageContainerSize: CGSize
        var extraSize: CGSize = .zero
        let messageInsets = messageContainerViewPadding
        
        let attributedText = NSMutableAttributedString()
        
        if case let .custom(data) = message.kind,
           let post = data as? Post {
            
            attributedText.append(NSAttributedString(string: "\(post.title)", attributes: [.font: CustomPostMessageCell.titleLabelFont]))
//            attributedText.append(NSAttributedString(string: "\n\(1) Comment", attributes: [.font: CustomPostMessageCell.commentLabelFont]))
            
            if let _ = URL(string: post.mediaUrl) {
//                maxWidth = min(maxWidth, CustomPostMessageCellSizeCalculator.imageSize)
                extraSize.width = maxWidth
                extraSize.height = CustomPostMessageCellSizeCalculator.verticalSpacing * 4 + min(maxWidth, CustomPostMessageCellSizeCalculator.imageSize)
            } else {
                extraSize.height = CustomPostMessageCellSizeCalculator.verticalSpacing * 3
            }
            
            var size = MessageSizeCalculator.calculatePostSize(for: post, maxWidth: maxWidth, messageLabelFont: messageLabelFont)
            size.width = maxWidth
            extraSize.width = max(extraSize.width, size.width)
            if (message as? Message)?.showFullPostMessage != true && size.height > CGFloat(CustomPostMessageCell.maxNumberOfLines) * messageLabelFont.lineHeight {
                extraSize.height += CGFloat(CustomPostMessageCell.maxNumberOfLines + 1) * messageLabelFont.lineHeight
            } else {
                extraSize.height += size.height
            }
        }
        
        if let cache = MessageSizeCalculator.cachedSize(for: message, maxWidth: maxWidth) {
            messageContainerSize = cache
        } else {
            messageContainerSize = CustomCell1SizeCalculator.labelSize(for: attributedText, considering: maxWidth)
            MessageSizeCalculator.cacheSize(for: message, maxWidth: maxWidth, size: messageContainerSize)
        }
        messageContainerSize.width = max(messageContainerSize.width, extraSize.width)
        messageContainerSize.height += messageInsets.vertical + extraSize.height + (extraSize.height > 0 ? CustomCell1SizeCalculator.imageInsets.vertical : 0)

        // reactions
        messageContainerSize.width = max(messageContainerSize.width + messageInsets.horizontal, MessageSizeCalculator.calculateReactionsViewSize(for: message, maxWidth: maxWidth + messageInsets.horizontal).width)
        
        return messageContainerSize
    }
    
    open override func messageContainerPadding(for message: MessageType) -> UIEdgeInsets {
        var edgeInsets = super.messageContainerPadding(for: message)
        
        let avatarWidth = avatarSize(for: message).width
        let messagePadding = super.messageContainerPadding(for: message)
        let accessoryWidth = accessoryViewSize(for: message).width
        let accessoryPadding = accessoryViewPadding(for: message)
        var maxWidth = messagesLayout.itemWidth - avatarWidth - messagePadding.horizontal - accessoryWidth - accessoryPadding.horizontal - avatarLeadingTrailingPadding
        let messageInsets = messageContainerViewPadding
        
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
        
        attributes.messageLabelInsets = messageContainerViewPadding
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
    
    private func manualTruncateTextForPerformanceWith(postText: String) -> String {
        
        if postText.count > 175 {
            var truncatedText = postText.prefix(175)
            truncatedText = "\(truncatedText)..."
            return String(truncatedText)
        } else {
            return postText
        }
    }
}
