//
//  CustomPostMessageCell.swift
//  Persona
//
//  Created by Allan Zhang on 3/4/23.
//

import UIKit
import MessageKit

open class CustomPostMessageCell: MessageContentCell {
    
    public static var titleLabelFont = UIFont.boldSystemFont(ofSize: 16)
    public static var subtitleLabelFont = CustomMessagesCollectionViewFlowLayout.topLabelFont
    public static var commentLabelFont = UIFont.systemFont(ofSize: 10)
    
    public static var maxNumberOfLines: Int = 2 // Added by Allan
    
    // MARK: - Properties
    
    /// The `MessageCellDelegate` for the cell.
    open override weak var delegate: MessageCellDelegate? {
        didSet {
            messageLabel.delegate = delegate
        }
    }
    
    open var postAvatarView: AvatarView = {
        let avatarView = AvatarView()
        avatarView.translatesAutoresizingMaskIntoConstraints = false
        avatarView.widthAnchor.constraint(equalToConstant: CustomCell1.originalMessageAvatarSize.width).isActive = true
        avatarView.heightAnchor.constraint(equalToConstant: CustomCell1.originalMessageAvatarSize.height).isActive = true
        return avatarView
    }()

    open var subtitleLabel: UILabel = {
        let subtitleLabel = UILabel()
        subtitleLabel.translatesAutoresizingMaskIntoConstraints = false
        subtitleLabel.alpha = 0.9
        return subtitleLabel
    }()
    
    open var titleLabel: UILabel = {
        let titleLabel = UILabel()
        titleLabel.numberOfLines = 0
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.setContentCompressionResistancePriority(.required, for: .horizontal)
        titleLabel.setContentHuggingPriority(.defaultLow, for: .horizontal)
        return titleLabel
    }()
    
    open var timestampLabel: UILabel = {
        let timestampLabel = UILabel()
        timestampLabel.translatesAutoresizingMaskIntoConstraints = false
        return timestampLabel
    }()
    
    open var imageView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 10
        imageView.widthAnchor.constraint(equalTo: imageView.heightAnchor).isActive = true
        return imageView
    }()
    
    /// The label used to display the message's text.
    open var messageLabel: MessageLabel = {
        let messageLabel = MessageLabel()
        messageLabel.translatesAutoresizingMaskIntoConstraints = false
        messageLabel.alpha = 0.9
        messageLabel.lineBreakMode = .byWordWrapping
        messageLabel.numberOfLines = CustomPostMessageCell.maxNumberOfLines // Added by Allan
        return messageLabel
    }()
    
    open var ellipsisLabel: UILabel = { // Added by Allan
        let ellipsisLabel = UILabel()
        ellipsisLabel.translatesAutoresizingMaskIntoConstraints = false
        ellipsisLabel.alpha = 0.9
        ellipsisLabel.text = "..."
        return ellipsisLabel
    }()
    
    open var commentLabel: UILabel = {
        let commentLabel = UILabel()
        commentLabel.translatesAutoresizingMaskIntoConstraints = false
        commentLabel.alpha = 0.9
        return commentLabel
    }()
    
    private var imageHeightConstraint: NSLayoutConstraint!
    private var contentLeadingConstraint: NSLayoutConstraint!
    private var contentTrailingConstraint: NSLayoutConstraint!
    private var contentTopConstraint: NSLayoutConstraint!
    
    // MARK: - Methods
    
    open override func apply(_ layoutAttributes: UICollectionViewLayoutAttributes) {
        super.apply(layoutAttributes)
        if let attributes = layoutAttributes as? MessagesCollectionViewLayoutAttributes {
            messageLabel.font = attributes.messageLabelFont
            ellipsisLabel.font = attributes.messageLabelFont // Added by Allan
            titleLabel.font = CustomPostMessageCell.titleLabelFont
            subtitleLabel.font = CustomPostMessageCell.subtitleLabelFont
            commentLabel.font = CustomPostMessageCell.commentLabelFont
            
            contentLeadingConstraint.constant = attributes.messageLabelInsets.left
            contentTrailingConstraint.constant = -attributes.messageLabelInsets.right
            contentTopConstraint.constant = attributes.messageLabelInsets.top
        }
    }
    
    open override func prepareForReuse() {
        super.prepareForReuse()
        messageLabel.attributedText = nil
        messageLabel.text = nil
        
        titleLabel.text = nil
        subtitleLabel.text = nil
        imageView.image = nil
        
        ellipsisLabel.isHidden = true // Added by Allan
        
        self.prepareExtraViewsForReuse()
    }
    
    open override func setupSubviews() {
        super.setupSubviews()
        
        imageView.isHidden = true
        avatarView.isHidden = true
        
        let headerView = UIStackView(arrangedSubviews: [postAvatarView, subtitleLabel, timestampLabel])
        headerView.translatesAutoresizingMaskIntoConstraints = false
        headerView.axis = .horizontal
        headerView.spacing = 6
        
        let messageView = UIStackView(arrangedSubviews: [messageLabel, ellipsisLabel]) // Added by Allan
        messageView.axis = .vertical
        
        let commentView = UIStackView(arrangedSubviews: [UIView(), commentLabel])
        commentView.translatesAutoresizingMaskIntoConstraints = false
        commentView.axis = .horizontal
        commentView.isHidden = true
        
        let stackView = UIStackView(arrangedSubviews: [headerView, titleLabel, imageView, messageView, commentView])
        stackView.translatesAutoresizingMaskIntoConstraints = false
        stackView.axis = .vertical
        stackView.alignment = .leading
        stackView.spacing = CustomPostMessageCellSizeCalculator.verticalSpacing
        
        messageContainerView.addSubview(stackView)
        
        contentLeadingConstraint = stackView.leadingAnchor.constraint(equalTo: messageContainerView.leadingAnchor)
        contentLeadingConstraint.isActive = true
        contentTrailingConstraint = stackView.trailingAnchor.constraint(equalTo: messageContainerView.trailingAnchor)
        contentTrailingConstraint.isActive = true
        contentTopConstraint = stackView.topAnchor.constraint(equalTo: messageContainerView.topAnchor)
        contentTopConstraint.isActive = true
        
        imageHeightConstraint = imageView.heightAnchor.constraint(equalToConstant: 0)
        imageHeightConstraint.isActive = true

        self.setupExtraViews()
        
        messageContainerView.layer.cornerRadius = 16
        messageContainerView.layer.borderColor = UIColor(white: 1, alpha: 0.3).cgColor
        messageContainerView.layer.borderWidth = 0.5
    }
    
    open override func layoutMessageContainerView(with attributes: MessagesCollectionViewLayoutAttributes) {
        super.layoutMessageContainerView(with: attributes)
        
        var frame = messageContainerView.frame
        frame.origin.x = (self.frame.size.width - messageContainerView.frame.size.width) / 2
        messageContainerView.frame = frame
    }

    open override func layoutAvatarView(with attributes: MessagesCollectionViewLayoutAttributes) {
        
    }
    
    open override func cellContentView(canHandle touchPoint: CGPoint) -> Bool {
        return messageLabel.handleGesture(CGPointMake(touchPoint.x - messageLabel.frame.minX, touchPoint.y - messageLabel.frame.minY))
    }
    
    open override func configure(with message: MessageType, at indexPath: IndexPath, and messagesCollectionView: MessagesCollectionView) {
        super.configure(with: message, at: indexPath, and: messagesCollectionView)
        
        imageView.image = nil
        ellipsisLabel.isHidden = true // Added by Allan
        
        guard let displayDelegate = messagesCollectionView.messagesDisplayDelegate else {
            return
        }
        
        let enabledDetectors = displayDelegate.enabledDetectors(for: message, at: indexPath, in: messagesCollectionView)
        
        messageLabel.configure {
            messageLabel.enabledDetectors = enabledDetectors
            for detector in enabledDetectors {
                let attributes = displayDelegate.detectorAttributes(for: detector, and: message, at: indexPath)
                messageLabel.setAttributes(attributes, detector: detector)
            }
            
            let textColor = displayDelegate.textColor(for: message, at: indexPath, in: messagesCollectionView)
            messageLabel.textColor = textColor
            titleLabel.textColor = textColor
            subtitleLabel.textColor = textColor
            commentLabel.textColor = textColor
            ellipsisLabel.textColor = textColor // Added by Allan
            
            timestampLabel.attributedText = NSAttributedString(string: MessageKitDateFormatter.shared.string(from: message.sentDate),
                                                               attributes: [.foregroundColor: CustomMessagesCollectionViewFlowLayout.bottomLabelColor,
                                                                            .font: CustomMessagesCollectionViewFlowLayout.bottomLabelFont])
            
            if case let .custom(data) = message.kind,
               let post = data as? Post {
                subtitleLabel.text = message.sender.displayName
                commentLabel.text = "\(1) Comment"
                titleLabel.text = post.title
                
                if let url = URL(string: post.mediaUrl) {
                    imageView.sd_setImage(with: url)
                    imageView.isHidden = false
                    
                    imageHeightConstraint.constant = min(messageContainerView.frame.width - contentLeadingConstraint.constant + contentTrailingConstraint.constant, CustomPostMessageCellSizeCalculator.imageSize)
                } else {
                    imageView.isHidden = true
                }
                
                
                let displayText = post.text
                messageLabel.text = displayText
                
                
                // Added by Allan
                let size = MessageSizeCalculator.calculatePostSize(for: post, maxWidth: messageContainerView.frame.width - contentLeadingConstraint.constant + contentTrailingConstraint.constant, messageLabelFont: messageLabel.font)
                ellipsisLabel.isHidden = (message as? Message)?.showFullPostMessage == true || size.height <= CGFloat(CustomPostMessageCell.maxNumberOfLines) * messageLabel.font.lineHeight
                messageLabel.numberOfLines = (message as? Message)?.showFullPostMessage == true ? 0 : CustomPostMessageCell.maxNumberOfLines
            }

            self.configureExtraViews(with: message, at: indexPath, and: messagesCollectionView)
        }
        
        displayDelegate.configureAvatarView(postAvatarView, for: message, at: indexPath, in: messagesCollectionView)
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
