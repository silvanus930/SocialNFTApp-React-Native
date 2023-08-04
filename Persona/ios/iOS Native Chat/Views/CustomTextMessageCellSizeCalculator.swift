//
//  CustomTextMessageCellSizeCalculator.swift
//  Persona
//
//  Created by Allan Zhang on 2/20/23.
//

import Foundation
import MessageKit

open class CustomTextMessageCellSizeCalculator: TextMessageSizeCalculator {
    
    func messageLabelInsets(for message: MessageType) -> UIEdgeInsets {
        let dataSource = messagesLayout.messagesDataSource
        let isFromCurrentSender = dataSource.isFromCurrentSender(message: message)
        return isFromCurrentSender ? outgoingMessageLabelInsets : incomingMessageLabelInsets
    }

    open override func messageContainerSize(for message: MessageType) -> CGSize {
        let avatarWidth = avatarSize(for: message).width
        let messagePadding = super.messageContainerPadding(for: message)
        let accessoryWidth = accessoryViewSize(for: message).width
        let accessoryPadding = accessoryViewPadding(for: message)
        let maxWidth = messagesLayout.itemWidth - avatarWidth - messagePadding.horizontal - accessoryWidth - accessoryPadding.horizontal - avatarLeadingTrailingPadding

        var messageContainerSize: CGSize
        if let cache = MessageSizeCalculator.cachedSize(for: message, maxWidth: maxWidth) {
            messageContainerSize = cache
        } else {
            messageContainerSize = super.messageContainerSize(for: message)
            messageContainerSize.width = max(messageContainerSize.width,
                                             MessageSizeCalculator.calculateReactionsViewSize(for: message, maxWidth: maxWidth).width)
            MessageSizeCalculator.cacheSize(for: message, maxWidth: maxWidth, size: messageContainerSize)
        }

        // reactions
        messageContainerSize.width = max(messageContainerSize.width,
                                         MessageSizeCalculator.calculateReactionsViewSize(for: message, maxWidth: maxWidth).width)
        return messageContainerSize
    }
    
    open override func messageContainerPadding(for message: MessageType) -> UIEdgeInsets {
        var edgeInsets = super.messageContainerPadding(for: message)
        
        let avatarWidth = avatarSize(for: message).width
        let messagePadding = super.messageContainerPadding(for: message)
        let accessoryWidth = accessoryViewSize(for: message).width
        let accessoryPadding = accessoryViewPadding(for: message)
        let maxWidth = messagesLayout.itemWidth - avatarWidth - messagePadding.horizontal - accessoryWidth - accessoryPadding.horizontal - avatarLeadingTrailingPadding

        // reactions
        let reactionsHeight = MessageSizeCalculator.calculateReactionsViewSize(for: message, maxWidth: maxWidth).height
        edgeInsets.bottom += reactionsHeight > 0 ? reactionsHeight + 10 : 0
        edgeInsets.bottom += ((message as? Message)?.threadMessages ?? []).isEmpty ? 0 : AppConstants.ViewStandards.THREADS_BUTTON_HEIGHT
        return edgeInsets
    }
}
