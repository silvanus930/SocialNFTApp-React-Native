//
//  CustomTextMessageCell.swift
//  Persona
//
//  Created by Allan Zhang on 2/17/23.
//

import UIKit
import MessageKit

/// A subclass of `MessageContentCell` used to display text messages.
open class CustomTextMessageCell: TextMessageCell {

    open override func prepareForReuse() {
        super.prepareForReuse()
        self.prepareExtraViewsForReuse()
    }

    open override func setupSubviews() {
        super.setupSubviews()
        self.setupExtraViews()
    }

    open override func configure(with message: MessageType, at indexPath: IndexPath, and messagesCollectionView: MessagesCollectionView) {
        super.configure(with: message, at: indexPath, and: messagesCollectionView)

        guard let dataSource = messagesCollectionView.messagesDataSource else {
            return
        }

        self.configureExtraViews(with: message, at: indexPath, and: messagesCollectionView)
    }
}
