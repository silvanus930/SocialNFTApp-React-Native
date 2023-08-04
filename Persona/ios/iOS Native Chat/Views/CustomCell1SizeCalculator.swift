//
//  CustomCell1SizeCalculator.swift
//  Persona
//
//  Created by Allan Zhang on 2/15/23.
//

import UIKit
import MessageKit

open class CustomCell1SizeCalculator: MessageSizeCalculator {
    
    public var incomingMessageLabelInsets = UIEdgeInsets(top: 10, left: 18, bottom: 10, right: 14)
    public var outgoingMessageLabelInsets = UIEdgeInsets(top: 10, left: 14, bottom: 10, right: 18)
    public static var imageInsets = UIEdgeInsets(top: 10, left: 10, bottom: 10, right: 10)
    
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
        var maxWidth = messageContainerMaxWidth(for: message)
        
        var messageContainerSize: CGSize
        var mediaSize: CGSize = .zero
        var originalMediaSize: CGSize = .zero
        let messageInsets = messageLabelInsets(for: message)

        let textMessageKind = message.kind
        let originalMessage: NSAttributedString
        let replyMessage: NSAttributedString
        
        var originalMessageItem: Message? = (message as? Message)?.replyMessage
        
        switch textMessageKind {
        case .attributedText(let text):
            replyMessage = text
        case .text(let text), .emoji(let text):
            replyMessage = NSAttributedString(string: text, attributes: [.font: messageLabelFont])
        case .photo(let item):
            mediaSize = CustomCell1SizeCalculator.sizeForMediaItem(maxWidth: maxWidth - CustomCell1SizeCalculator.imageInsets.horizontal + messageInsets.horizontal, item: item, isReply: false)
            maxWidth = mediaSize.width + CustomCell1SizeCalculator.imageInsets.horizontal - messageInsets.horizontal

            if let message = message as? Message,
               !message.includedText.isEmpty {
                replyMessage =
                    NSAttributedString(string: message.includedText,
                                       attributes: CustomCell1.messageAttributes(font: messageLabelFont,
                                                                                       textColor: nil))
            } else {
                replyMessage = NSAttributedString()
            }

        case .video(let item):
            mediaSize = CustomCell1SizeCalculator.sizeForMediaItem(maxWidth: maxWidth - CustomCell1SizeCalculator.imageInsets.horizontal + messageInsets.horizontal, item: item, isReply: false)
            maxWidth = mediaSize.width + CustomCell1SizeCalculator.imageInsets.horizontal - messageInsets.horizontal

            if let message = message as? Message,
               !message.includedText.isEmpty {
                replyMessage =
                    NSAttributedString(string: message.includedText,
                                       attributes: CustomCell1.messageAttributes(font: messageLabelFont,
                                                                                       textColor: nil))
            } else {
                replyMessage = NSAttributedString()
            }

        case .custom(let reply):
            if let parentMessage = (reply as? ReplyMessageData)?.originalMessage {
                originalMessageItem = parentMessage
            } else {
                fatalError("messageContainerSize received no original message: \(message.messageId)")
            }
            
            replyMessage =
                NSAttributedString(string: (reply as? ReplyMessageData)?.text ?? "",
                                   attributes: CustomCell1.messageAttributes(font: messageLabelFont, textColor: nil))
            
        default:
            fatalError("messageContainerSize received unhandled MessageDataType: \(message.kind)")
        }
        
        var headerWidth: CGFloat = 0
        if let parentMessage = originalMessageItem {
            headerWidth = CustomCell1.originalMessageAvatarSize.width
            headerWidth += CustomCell1.originalMessageViewAvatarTrailing
            headerWidth += CustomCell1SizeCalculator.labelSize(for: NSAttributedString(
                string: parentMessage.sender.displayName,
                attributes: [.font: CustomCell1.originalMessageUsernameFont]),
                                                               considering: CGFLOAT_MAX).width
            headerWidth += CustomCell1.originalMessageViewAvatarTrailing
            headerWidth += CustomCell1SizeCalculator.labelSize(for: NSAttributedString(
                string: MessageKitDateFormatter.shared.string(from: parentMessage.sentDate),
                attributes: [.font: CustomCell1.originalMessageDateFont]),
                                                               considering: CGFLOAT_MAX).width

            switch parentMessage.kind {
            case .attributedText(let attributedText):
                originalMessage =
                    NSAttributedString(string: attributedText.string,
                                       attributes: CustomCell1.parentMessageAttributes(font: messageLabelFont.withSize(messageLabelFont.pointSize * 0.8), textColor: nil))
            case .text(let text), .emoji(let text):
                originalMessage =
                    NSAttributedString(string: text,
                                       attributes: CustomCell1.parentMessageAttributes(font: messageLabelFont.withSize(messageLabelFont.pointSize * 0.8), textColor: nil))
            case .custom(let reply):
                originalMessage =
                    NSAttributedString(string: ((reply as? ReplyMessageData)?.text ?? ""),
                                       attributes: CustomCell1.parentMessageAttributes(font: messageLabelFont.withSize(messageLabelFont.pointSize * 0.8), textColor: nil))
            case .photo(let item):
                if mediaSize.width == 0 {
                    originalMediaSize = CustomCell1SizeCalculator.sizeForMediaItem(maxWidth: maxWidth + messageInsets.horizontal - CustomCell1.originalMessageViewMargin.horizontal - CustomCell1.originalMessageViewPadding.horizontal, item: item, isReply: true)
                    maxWidth = originalMediaSize.width + CustomCell1.originalMessageViewMargin.horizontal + CustomCell1.originalMessageViewPadding.horizontal - messageInsets.horizontal
                } else {
                    originalMediaSize = CustomCell1SizeCalculator.sizeForMediaItem(maxWidth: maxWidth + messageInsets.horizontal - CustomCell1.originalMessageViewMargin.horizontal - CustomCell1.originalMessageViewPadding.horizontal, item: item, isReply: false)
                }

                originalMessage =
                    NSAttributedString(string: parentMessage.includedText,
                                       attributes: CustomCell1.parentMessageAttributes(font: messageLabelFont.withSize(messageLabelFont.pointSize * 0.8),
                                                                                       textColor: nil))
                
            case .video(let item):
                if mediaSize.width == 0 {
                    originalMediaSize = CustomCell1SizeCalculator.sizeForMediaItem(maxWidth: maxWidth + messageInsets.horizontal - CustomCell1.originalMessageViewMargin.horizontal - CustomCell1.originalMessageViewPadding.horizontal, item: item, isReply: true)
                    maxWidth = originalMediaSize.width + CustomCell1.originalMessageViewMargin.horizontal + CustomCell1.originalMessageViewPadding.horizontal - messageInsets.horizontal
                } else {
                    originalMediaSize = CustomCell1SizeCalculator.sizeForMediaItem(maxWidth: maxWidth + messageInsets.horizontal - CustomCell1.originalMessageViewMargin.horizontal - CustomCell1.originalMessageViewPadding.horizontal, item: item, isReply: false)
                }

                originalMessage =
                    NSAttributedString(string: parentMessage.includedText,
                                       attributes: CustomCell1.parentMessageAttributes(font: messageLabelFont.withSize(messageLabelFont.pointSize * 0.8),
                                                                                       textColor: nil))

            default:
                fatalError("messageContainerSize received unhandled MessageDataType: \(parentMessage.kind)")
            }
        } else {
            originalMessage = NSAttributedString()
        }
        
        if let cache = MessageSizeCalculator.cachedSize(for: message, maxWidth: maxWidth) {
            messageContainerSize = cache
        } else {
            if replyMessage.length == 0 {
                messageContainerSize = .zero
            } else {
                messageContainerSize = CustomCell1SizeCalculator.labelSize(
                    for: replyMessage,
                    considering: maxWidth)
            }

            var originalMessageContainerSize: CGSize
            if originalMessage.length == 0 {
                originalMessageContainerSize = .zero
            } else {
                originalMessageContainerSize = CustomCell1SizeCalculator.labelSize(
                    for: originalMessage,
                    considering: maxWidth + messageInsets.horizontal - CustomCell1.originalMessageViewMargin.horizontal - CustomCell1.originalMessageViewPadding.horizontal)
                originalMessageContainerSize.width = max(headerWidth,
                                                         min(maxWidth + messageInsets.horizontal - CustomCell1.originalMessageViewMargin.horizontal - CustomCell1.originalMessageViewPadding.horizontal,
                                                             originalMessageContainerSize.width
                                                            )
                )
            }

            messageContainerSize.width = max(max(messageContainerSize.width,
                                                 mediaSize.width - messageInsets.horizontal + CustomCell1SizeCalculator.imageInsets.horizontal),
                                             originalMessageContainerSize.width - messageInsets.horizontal + CustomCell1.originalMessageViewMargin.horizontal + CustomCell1.originalMessageViewPadding.horizontal)
            messageContainerSize.height += messageInsets.vertical
            + mediaSize.height + (mediaSize.height > 0 ? CustomCell1SizeCalculator.imageInsets.top : 0)
            + (originalMessageItem != nil ?
            (originalMediaSize.height + (originalMediaSize.height > 0 ? CustomCell1.originalMessageViewAvatarBottom : 0)
             + originalMessageContainerSize.height + CustomCell1.originalMessageViewMargin.top + CustomCell1.originalMessageViewPadding.vertical + CustomCell1.originalMessageAvatarSize.height + CustomCell1.originalMessageViewAvatarBottom) : 0)

            MessageSizeCalculator.cacheSize(for: message, maxWidth: maxWidth, size: messageContainerSize)
        }

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
    
    class func labelSize(for attributedText: NSAttributedString, considering maxWidth: CGFloat) -> CGSize {
        let constraintBox = CGSize(width: maxWidth, height: .greatestFiniteMagnitude)
        let rect = attributedText.boundingRect(with: constraintBox, options: [.usesLineFragmentOrigin, .usesFontLeading], context: nil).integral
        
        return rect.size
    }
    
    class func sizeForMediaItem(maxWidth: CGFloat, item: MediaItem, isReply: Bool) -> CGSize {
        if maxWidth < item.size.width {
            // Maintain the ratio if width is too great
            let height = maxWidth * item.size.height / item.size.width
            return CGSize(width: maxWidth * (isReply ? 0.75 : 1), height: height * (isReply ? 0.75 : 1))
        }
        return CGSize(width: item.size.width * (isReply ? 0.75 : 1), height: item.size.height * (isReply ? 0.75 : 1))
    }
    
    class func heightFromMediaItem(item: MediaItem, width: CGFloat) -> CGFloat {
        if item.size.width == width {
            return item.size.height
        }
        return width / item.size.width * item.size.height
    }
}
