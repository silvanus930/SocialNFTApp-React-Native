//
//  CustomCell1.swift
//  Persona
//
//  Created by Allan Zhang on 2/14/23.
//

import UIKit
import MessageKit

open class CustomCell1: MessageContentCell {
    
    public static var originalMessageViewBackgroundColor = UIColor(red: 0.0, green: 0.0, blue: 0.0, alpha: 0.5)
    public static var originalMessageViewBorderColor = UIColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.3)
    public static var originalMessageAvatarSize = CGSize(width: 24, height: 24)
    public static var originalMessageUsernameFont = UIFont.preferredFont(forTextStyle: .subheadline).withSize(UIFont.preferredFont(forTextStyle: .subheadline).pointSize * 0.8)
    public static var originalMessageUsernameTextColor = UIColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.7)
    public static var originalMessageDateFont = UIFont.preferredFont(forTextStyle: .subheadline).withSize(UIFont.preferredFont(forTextStyle: .subheadline).pointSize * 0.8)
    public static var originalMessageDateTextColor = UIColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.3)
    public static var originalMessageTextColor = UIColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 0.7)
    public static var originalMessageViewBorderWidth = 0.5
    public static var originalMessageViewCornerRadius = 10.0
    
    public static var originalMessageViewMargin = UIEdgeInsets(top: 16, left: 16, bottom: 12, right: 12)
    public static var originalMessageViewPadding = UIEdgeInsets(top: 16, left: 16, bottom: 12, right: 12)
    public static var originalMessageViewAvatarTrailing = 6.0
    public static var originalMessageViewAvatarBottom = 6.0

    public static var reactionFont = UIFont.systemFont(ofSize: UIFont.preferredFont(forTextStyle: .body).pointSize * 0.8)
    // MARK: - Properties
    
    /// The `MessageCellDelegate` for the cell.
    open override weak var delegate: MessageCellDelegate? {
        didSet {
            messageLabel.delegate = delegate
        }
    }
    
    /// The label used to display the message's text.
    open var messageLabel: MessageLabel = {
        let messageLabel = MessageLabel()
        messageLabel.translatesAutoresizingMaskIntoConstraints = false
        return messageLabel
    }()
    
    open var originalMessageView: UIView = {
        let messageView = UIView()
        messageView.translatesAutoresizingMaskIntoConstraints = false
        messageView.backgroundColor = CustomCell1.originalMessageViewBackgroundColor
        messageView.layer.borderColor = CustomCell1.originalMessageViewBorderColor.cgColor
        messageView.layer.borderWidth = CustomCell1.originalMessageViewBorderWidth
        messageView.layer.cornerRadius = CustomCell1.originalMessageViewCornerRadius
        messageView.clipsToBounds = true
        return messageView
    }()
    
    open var originalAvatarView: AvatarView = {
        let avatarView = AvatarView()
        avatarView.translatesAutoresizingMaskIntoConstraints = false
        avatarView.widthAnchor.constraint(equalToConstant: CustomCell1.originalMessageAvatarSize.width).isActive = true
        avatarView.heightAnchor.constraint(equalToConstant: CustomCell1.originalMessageAvatarSize.height).isActive = true
        return avatarView
    }()
    open var originalUsernameLabel: InsetLabel = {
        let label = InsetLabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.numberOfLines = 0
        return label
    }()
    open var originalMessageDateLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    open var originalImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 10
        return imageView
    }()
    var originalImageViewHeight: NSLayoutConstraint!

    open lazy var originalPlayButtonView: PlayButtonView = {
        let playButtonView = PlayButtonView()
        playButtonView.translatesAutoresizingMaskIntoConstraints = false
        playButtonView.isUserInteractionEnabled = false
        return playButtonView
    }()

    open var originalMessageLabel: MessageLabel = {
        let messageLabel = MessageLabel()
        messageLabel.translatesAutoresizingMaskIntoConstraints = false
        return messageLabel
    }()
    
    /// The play button view to display on video messages.
    open lazy var playButtonView: PlayButtonView = {
        let playButtonView = PlayButtonView()
        playButtonView.translatesAutoresizingMaskIntoConstraints = false
        playButtonView.isUserInteractionEnabled = false
        return playButtonView
    }()
    
    /// The image view display the media content.
    open var imageView: UIImageView = {
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 10
        return imageView
    }()
    var imageViewHeight: NSLayoutConstraint!
    
    var messageLabelLeading: NSLayoutConstraint!
    var messageLabelTrailing: NSLayoutConstraint!
    var messageLabelBottom: NSLayoutConstraint!
    
    // MARK: - Methods
    
    open override func apply(_ layoutAttributes: UICollectionViewLayoutAttributes) {
        super.apply(layoutAttributes)
        if let attributes = layoutAttributes as? MessagesCollectionViewLayoutAttributes {
            messageLabelLeading.constant = attributes.messageLabelInsets.left
            messageLabelTrailing.constant = -attributes.messageLabelInsets.right
            messageLabelBottom.constant = -attributes.messageLabelInsets.bottom

            messageLabel.font = attributes.messageLabelFont
            
            originalMessageLabel.font = attributes.messageLabelFont.withSize(attributes.messageLabelFont.pointSize * 0.8)
        }
    }
    
    open override func prepareForReuse() {
        super.prepareForReuse()
        messageLabel.attributedText = nil
        messageLabel.text = nil
        
        originalUsernameLabel.text = nil
        originalMessageDateLabel.text = nil
        originalMessageLabel.text = nil
        originalImageView.image = nil
        originalPlayButtonView.isHidden = true

        imageView.image = nil
        playButtonView.isHidden = true
        
        self.prepareExtraViewsForReuse()
    }
    
    open override func setupSubviews() {
        super.setupSubviews()
        messageContainerView.addSubview(messageLabel)
        messageContainerView.addSubview(imageView)
        messageContainerView.addSubview(playButtonView)
        messageContainerView.addSubview(originalMessageView)
        messageContainerView.addSubview(originalPlayButtonView)
        
        originalImageView.isHidden = true
        imageView.isHidden = true
        playButtonView.isHidden = true
        originalPlayButtonView.isHidden = true
        
        imageViewHeight = imageView.heightAnchor.constraint(equalToConstant: 0)

        messageLabelLeading = messageLabel.leadingAnchor.constraint(equalTo: messageContainerView.leadingAnchor)
        messageLabelTrailing = messageLabel.trailingAnchor.constraint(lessThanOrEqualTo: messageContainerView.trailingAnchor)
        messageLabelBottom = messageLabel.bottomAnchor.constraint(equalTo: messageContainerView.bottomAnchor, constant: 0)

        NSLayoutConstraint.activate([
            messageLabelLeading,
            messageLabelTrailing,
            messageLabelBottom,
            
            imageView.leadingAnchor.constraint(equalTo: messageContainerView.leadingAnchor, constant: CustomCell1SizeCalculator.imageInsets.left),
            imageView.trailingAnchor.constraint(equalTo: messageContainerView.trailingAnchor, constant: -CustomCell1SizeCalculator.imageInsets.right),
            imageView.bottomAnchor.constraint(equalTo: messageLabel.topAnchor, constant: -CustomCell1SizeCalculator.imageInsets.bottom),
            imageViewHeight,
            
            playButtonView.centerXAnchor.constraint(equalTo: imageView.centerXAnchor),
            playButtonView.centerYAnchor.constraint(equalTo: imageView.centerYAnchor)
        ])

        originalImageViewHeight = originalImageView.heightAnchor.constraint(equalToConstant: 0)

        let originalMessageHeaderView = UIStackView(arrangedSubviews: [originalAvatarView, originalUsernameLabel, originalMessageDateLabel])
        originalMessageHeaderView.translatesAutoresizingMaskIntoConstraints = false
        originalMessageHeaderView.axis = .horizontal
        originalMessageHeaderView.spacing = CustomCell1.originalMessageViewAvatarTrailing

        let originalMessageStackView = UIStackView(arrangedSubviews: [originalMessageHeaderView, originalImageView, originalMessageLabel])
        originalMessageStackView.translatesAutoresizingMaskIntoConstraints = false
        originalMessageStackView.axis = .vertical
        originalMessageStackView.alignment = .leading
        originalMessageStackView.spacing = CustomCell1.originalMessageViewAvatarBottom
        originalMessageView.addSubview(originalMessageStackView)
        
        NSLayoutConstraint.activate([
            originalImageViewHeight,
            
            originalMessageView.leadingAnchor.constraint(equalTo: messageContainerView.leadingAnchor, constant: CustomCell1.originalMessageViewMargin.left),
            originalMessageView.trailingAnchor.constraint(equalTo: messageContainerView.trailingAnchor, constant: -CustomCell1.originalMessageViewMargin.right),
            originalMessageView.topAnchor.constraint(equalTo: messageContainerView.topAnchor, constant: CustomCell1.originalMessageViewMargin.top),
            
            originalMessageStackView.leadingAnchor.constraint(equalTo: originalMessageView.leadingAnchor, constant: CustomCell1.originalMessageViewPadding.left),
            originalMessageStackView.trailingAnchor.constraint(equalTo: originalMessageView.trailingAnchor, constant: -CustomCell1.originalMessageViewPadding.right),
            originalMessageStackView.topAnchor.constraint(equalTo: originalMessageView.topAnchor, constant: CustomCell1.originalMessageViewPadding.top),
            originalMessageStackView.bottomAnchor.constraint(equalTo: originalMessageView.bottomAnchor, constant: -CustomCell1.originalMessageViewPadding.bottom),
            
            originalPlayButtonView.centerXAnchor.constraint(equalTo: originalImageView.centerXAnchor),
            originalPlayButtonView.centerYAnchor.constraint(equalTo: originalImageView.centerYAnchor)
        ])
        
        self.setupExtraViews()
    }
    
    open override func configure(with message: MessageType, at indexPath: IndexPath, and messagesCollectionView: MessagesCollectionView) {
        super.configure(with: message, at: indexPath, and: messagesCollectionView)
        
        imageView.image = nil
        originalImageView.image = nil
        imageView.isHidden = true
        originalMessageView.isHidden = true

        guard let displayDelegate = messagesCollectionView.messagesDisplayDelegate else {
            return
        }
        
        let enabledDetectors = displayDelegate.enabledDetectors(for: message, at: indexPath, in: messagesCollectionView)
        var replyMessage: Message?
        var replyMediaItem: MediaItem?
        var originalMessage: Message?
        var originalMediaItem: MediaItem?

        messageLabel.configure {
            messageLabel.enabledDetectors = enabledDetectors
            for detector in enabledDetectors {
                let attributes = displayDelegate.detectorAttributes(for: detector, and: message, at: indexPath)
                messageLabel.setAttributes(attributes, detector: detector)
            }
            
            let textColor = displayDelegate.textColor(for: message, at: indexPath, in: messagesCollectionView)
            
            replyMessage = message as? Message
            originalMessage = replyMessage?.replyMessage
            
            switch message.kind {
            case .attributedText(let attributedText):
                imageView.isHidden = true
                messageLabel.attributedText = attributedText

            case .text(let text), .emoji(let text):
                imageView.isHidden = true
                messageLabel.attributedText =
                    NSAttributedString(string: text,
                                       attributes: CustomCell1.messageAttributes(font: messageLabel.font,
                                                                                 textColor: textColor)
                    )

            case .photo(let mediaItem):
                replyMediaItem = mediaItem
                
                imageView.image = mediaItem.image ?? mediaItem.placeholderImage
                imageView.isHidden = false
                playButtonView.isHidden = true
                
                if let message = message as? Message,
                   !message.includedText.isEmpty {
                    messageLabel.attributedText =
                    NSAttributedString(string: message.includedText,
                                       attributes: CustomCell1.messageAttributes(font: messageLabel.font,
                                                                                 textColor: textColor)
                    )
                }
                
            case .video(let mediaItem):
                replyMediaItem = mediaItem
                
                imageView.image = mediaItem.image ?? mediaItem.placeholderImage
                imageView.isHidden = false
                playButtonView.isHidden = false
                
                if let message = message as? Message,
                   !message.includedText.isEmpty {
                    messageLabel.attributedText =
                        NSAttributedString(string: message.includedText,
                                           attributes: CustomCell1.messageAttributes(font: messageLabel.font,
                                                                                     textColor: textColor)
                    )
                }
                
            case .custom(let data):
                if let reply = data as? ReplyMessageData {
                    messageLabel.attributedText = NSAttributedString(string: reply.text,
                                                                     attributes: CustomCell1.messageAttributes(
                                                                        font: messageLabel.font, textColor: textColor)
                    )
                    
                    originalMessage = reply.originalMessage
                }
            default:
                break
            }
            
            if let parentMessage = originalMessage {
                originalMessageView.isHidden = false

                switch parentMessage.kind {
                case .attributedText(let attributedText):
                    originalImageView.isHidden = true
                    originalMessageLabel.attributedText =
                        NSAttributedString(string: attributedText.string,
                                           attributes: CustomCell1.parentMessageAttributes(font: messageLabel.font.withSize(messageLabel.font.pointSize * 0.8),
                                                                                           textColor: textColor))
                case .text(let text), .emoji(let text):
                    originalImageView.isHidden = true
                    originalMessageLabel.attributedText =
                        NSAttributedString(string: text,
                                           attributes: CustomCell1.parentMessageAttributes(font: messageLabel.font.withSize(messageLabel.font.pointSize * 0.8),
                                                                                           textColor: textColor))
                case .custom(let reply):
                    originalImageView.isHidden = true//AZ to ascertain if replied image is not hidden
                    originalMessageLabel.attributedText =
                        NSAttributedString(string: ((reply as? ReplyMessageData)?.text ?? ""),
                                           attributes: CustomCell1.parentMessageAttributes(font: messageLabel.font.withSize(messageLabel.font.pointSize * 0.8),
                                                                                           textColor: textColor))

                case .photo(let mediaItem):
                    originalMediaItem = mediaItem
                    
                    originalImageView.image = mediaItem.image ?? mediaItem.placeholderImage
                    originalImageView.isHidden = false
                    originalPlayButtonView.isHidden = true
                    
                    if !parentMessage.includedText.isEmpty {
                        originalMessageLabel.attributedText =
                            NSAttributedString(string: parentMessage.includedText,
                                               attributes: CustomCell1.parentMessageAttributes(font: messageLabel.font.withSize(messageLabel.font.pointSize * 0.8),
                                                                                               textColor: textColor))
                    }
                    
                case .video(let mediaItem):
                    originalMediaItem = mediaItem
                    
                    originalImageView.image = mediaItem.image ?? mediaItem.placeholderImage
                    originalImageView.isHidden = false
                    originalPlayButtonView.isHidden = false
                    
                    if !parentMessage.includedText.isEmpty {
                        originalMessageLabel.attributedText =
                            NSAttributedString(string: parentMessage.includedText,
                                               attributes: CustomCell1.parentMessageAttributes(font: messageLabel.font.withSize(messageLabel.font.pointSize * 0.8),
                                                                                               textColor: textColor))
                    }
                    
                default:
                    originalImageView.isHidden = true
                    break
                }
                
                displayDelegate.configureAvatarView(originalAvatarView, for: parentMessage, at: indexPath, in: messagesCollectionView)
                originalUsernameLabel.attributedText = NSAttributedString(
                    string: parentMessage.sender.displayName,
                    attributes: [.foregroundColor: CustomCell1.originalMessageUsernameTextColor,
                                 .font: CustomCell1.originalMessageUsernameFont])
                originalMessageDateLabel.attributedText = NSAttributedString(
                    string: MessageKitDateFormatter.shared.string(from: parentMessage.sentDate),
                    attributes: [.foregroundColor: CustomCell1.originalMessageDateTextColor,
                                 .font: CustomCell1.originalMessageDateFont])
            }
            
            if let originalMediaItem = originalMediaItem {
                let imageWidth = messageContainerView.bounds.width - CustomCell1.originalMessageViewMargin.horizontal - CustomCell1.originalMessageViewPadding.horizontal
                let imageHeight = CustomCell1SizeCalculator.heightFromMediaItem(item: originalMediaItem, width: imageWidth)
                
                originalImageViewHeight.constant = imageHeight
            }

            if let parentMediaItem = replyMediaItem {
                let imageWidth = messageContainerView.bounds.width - CustomCell1SizeCalculator.imageInsets.horizontal
                let imageHeight = CustomCell1SizeCalculator.heightFromMediaItem(item: parentMediaItem, width: imageWidth)
                
                imageViewHeight.constant = imageHeight
            }
            
            self.configureExtraViews(with: message, at: indexPath, and: messagesCollectionView)
        }
        
        if let messageWithMedia = originalMessage,
           originalMediaItem != nil {
            displayDelegate.configureMediaMessageImageView(originalImageView, for: messageWithMedia, at: indexPath, in: messagesCollectionView)
        }
        if let messageWithMedia = replyMessage,
           replyMediaItem != nil {
            displayDelegate.configureMediaMessageImageView(imageView, for: messageWithMedia, at: indexPath, in: messagesCollectionView)
        }
    }
    
    /// Used to handle the cell's contentView's tap gesture.
    /// Return false when the contentView does not need to handle the gesture.
    open override func cellContentView(canHandle touchPoint: CGPoint) -> Bool {
        if !messageLabel.handleGesture(CGPointMake(touchPoint.x - messageLabel.frame.minX, touchPoint.y - messageLabel.frame.minY)) {
            return originalMessageLabel.handleGesture(CGPointMake(touchPoint.x - originalMessageLabel.frame.minX, touchPoint.y - originalMessageLabel.frame.minY))
        }
        return true
    }
    
    class func parentMessageAttributes(font: UIFont, textColor: UIColor?) -> [NSAttributedString.Key: Any] {
//        var attributes: [NSAttributedString.Key: Any] = [.font: UIFont.italicSystemFont(ofSize: font.pointSize * 0.9)]
//        if let textColor = textColor {
//            attributes[.foregroundColor] = textColor
//        }
//        return attributes
        return [.font: font, .foregroundColor: textColor]
    }
    
    class func parentMessageInfoAttributes(font: UIFont, textColor: UIColor?) -> [NSAttributedString.Key: Any] {
        var attributes: [NSAttributedString.Key: Any] = [.font: font.withSize(font.pointSize * 0.8)]
        if let textColor = textColor {
            attributes[.foregroundColor] = textColor
        }
        return attributes
    }
    
    class func spacingAttributes(font: UIFont, textColor: UIColor?) -> [NSAttributedString.Key: Any] {
        var attributes: [NSAttributedString.Key: Any] = [.font: font.withSize(6)]
        if let textColor = textColor {
            attributes[.foregroundColor] = textColor
        }
        return attributes
    }
    
    class func messageAttributes(font: UIFont, textColor: UIColor?) -> [NSAttributedString.Key: Any] {
        var attributes: [NSAttributedString.Key: Any] = [.font: font]
        if let textColor = textColor {
            attributes[.foregroundColor] = textColor
        }
        return attributes
    }
}
