//
//  CustomMediaMessageCellSizeCalculator.swift
//  Persona
//
//  Created by Allan Zhang on 2/20/23.
//

import Foundation
import MessageKit

open class CustomMediaMessageCellSizeCalculator: MediaMessageSizeCalculator {
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
