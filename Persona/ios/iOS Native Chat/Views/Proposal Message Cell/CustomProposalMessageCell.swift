//
//  CustomProposalMessageCell.swift
//  MessageKitChatProject
//
//  Created by Master on 3/9/23.
//

import UIKit
import MessageKit

open class CustomProposalMessageCell: MessageContentCell {
    
    public static var cardViewBackgroundColor = UIColor.init(hex: "131517")
    public static var actionButtonBackgroundColor = UIColor.init(hex: "1e1f25")
    
    public static var actionColors: [UIColor] = [UIColor.init(hex: "3cb043"), UIColor.init(hex: "ff2e2e"), UIColor.white]
    public static var actionTitles: [String] = ["Yes", "No", "Abstain"]
    
    public static var proposalLabelFont = UIFont.systemFont(ofSize: 12)
    public static var titleLabelFont = UIFont.boldSystemFont(ofSize: 16)
    public static var descriptionLabelFont = UIFont.systemFont(ofSize: 12)
    public static var quorumLabelFont = UIFont.systemFont(ofSize: 12)
    public static var timerLabelFont = UIFont.systemFont(ofSize: 12)
    public static var actionTitleLabelFont = UIFont.systemFont(ofSize: 12)
    
    // MARK: - Properties
    
    /// The `MessageCellDelegate` for the cell.
    open override weak var delegate: MessageCellDelegate? {
        didSet {
            messageLabel.delegate = delegate
        }
    }
    
    open var proposalLabel: UILabel = {
        let proposalLabel = UILabel()
        proposalLabel.translatesAutoresizingMaskIntoConstraints = false
        proposalLabel.text = "Proposal"
        proposalLabel.textAlignment = .center
        return proposalLabel
    }()
    
    open var cardView: UIView = {
        let cardView = UIView()
        cardView.translatesAutoresizingMaskIntoConstraints = false
        cardView.clipsToBounds = true
        cardView.layer.cornerRadius = 10
        return cardView
    }()
    
    open var titleLabel: UILabel = {
        let titleLabel = UILabel()
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.numberOfLines = 0
        titleLabel.lineBreakMode = .byWordWrapping
        titleLabel.textAlignment = .center
        return titleLabel
    }()
    
    open var descriptionLabel: UILabel = {
        let descriptionLabel = UILabel()
        descriptionLabel.translatesAutoresizingMaskIntoConstraints = false
        descriptionLabel.numberOfLines = 0
        descriptionLabel.lineBreakMode = .byWordWrapping
        descriptionLabel.textAlignment = .center
        return descriptionLabel
    }()
    
    open var actionsStackView: UIStackView = {
        let stackView = UIStackView()
        stackView.axis = .horizontal
        stackView.distribution = .fillEqually
        stackView.spacing = 6
        return stackView
    }()
    
    open var quorumLabel: UILabel = { // Added by Allan
        let quorumLabel = UILabel()
        quorumLabel.translatesAutoresizingMaskIntoConstraints = false
        return quorumLabel
    }()
    
    open var timerLabel: UILabel = {
        let timerLabel = UILabel()
        timerLabel.translatesAutoresizingMaskIntoConstraints = false
        return timerLabel
    }()
    
    /// The label used to display the message's text.
    open var messageLabel: MessageLabel = {
        let messageLabel = MessageLabel()
        messageLabel.translatesAutoresizingMaskIntoConstraints = false
        messageLabel.lineBreakMode = .byWordWrapping
        messageLabel.numberOfLines = 0
        return messageLabel
    }()
    
    private var messageLeadingConstraint: NSLayoutConstraint!
    private var messageTrailingConstraint: NSLayoutConstraint!
    private var messageBottomConstraint: NSLayoutConstraint!
    
    private var message: MessageType?
    private var progressViews: [UIProgressView] = []
    private var avatarStackViews: [UIStackView] = []
    
    // MARK: - Methods
    
    open override func apply(_ layoutAttributes: UICollectionViewLayoutAttributes) {
        super.apply(layoutAttributes)
        if let attributes = layoutAttributes as? MessagesCollectionViewLayoutAttributes {
            cardView.backgroundColor = CustomProposalMessageCell.cardViewBackgroundColor
            
            proposalLabel.font = CustomProposalMessageCell.proposalLabelFont
            titleLabel.font = CustomProposalMessageCell.titleLabelFont
            descriptionLabel.font = CustomProposalMessageCell.descriptionLabelFont
            quorumLabel.font = CustomProposalMessageCell.quorumLabelFont
            timerLabel.font = CustomProposalMessageCell.timerLabelFont
            
            messageLabel.font = attributes.messageLabelFont
            
            messageLeadingConstraint.constant = attributes.messageLabelInsets.left
            messageTrailingConstraint.constant = -attributes.messageLabelInsets.right
            messageBottomConstraint.constant = -attributes.messageLabelInsets.bottom
        }
    }
    
    open override func prepareForReuse() {
        super.prepareForReuse()
        messageLabel.attributedText = nil
        messageLabel.text = nil
        
        titleLabel.text = nil
        descriptionLabel.text = nil
        quorumLabel.text = nil
        timerLabel.text = nil
        
        for subview in actionsStackView.arrangedSubviews {
            actionsStackView.removeArrangedSubview(subview)
            subview.removeFromSuperview()
        }
        
        progressViews.removeAll()
        avatarStackViews.removeAll()
        
        self.prepareExtraViewsForReuse()
    }
    
    open override func setupSubviews() {
        super.setupSubviews()
        
        let bottomStackView = UIStackView(arrangedSubviews: [quorumLabel, UIView(), timerLabel])
        bottomStackView.translatesAutoresizingMaskIntoConstraints = false
        bottomStackView.axis = .horizontal
        
        let cardStackView = UIStackView(arrangedSubviews: [titleLabel, descriptionLabel, actionsStackView, bottomStackView])
        cardStackView.translatesAutoresizingMaskIntoConstraints = false
        cardStackView.axis = .vertical
        cardStackView.spacing = CustomProposalMessageCellSizeCalculator.verticalSpacing
        
        cardView.addSubview(cardStackView)
        cardStackView.leadingAnchor.constraint(equalTo: cardView.leadingAnchor, constant: CustomProposalMessageCellSizeCalculator.cardViewInsets.left).isActive = true
        cardStackView.trailingAnchor.constraint(equalTo: cardView.trailingAnchor, constant: -CustomProposalMessageCellSizeCalculator.cardViewInsets.right).isActive = true
        cardStackView.topAnchor.constraint(equalTo: cardView.topAnchor, constant: CustomProposalMessageCellSizeCalculator.cardViewInsets.top).isActive = true
        cardStackView.bottomAnchor.constraint(equalTo: cardView.bottomAnchor, constant: -CustomProposalMessageCellSizeCalculator.cardViewInsets.bottom).isActive = true
        
        let contentStackView = UIStackView(arrangedSubviews: [proposalLabel, cardView])
        contentStackView.translatesAutoresizingMaskIntoConstraints = false
        contentStackView.axis = .vertical
        contentStackView.spacing = CustomProposalMessageCellSizeCalculator.proposalLabelBottomSpacing
        
        let contentView = UIView()
        contentView.translatesAutoresizingMaskIntoConstraints = false
        contentView.backgroundColor = .clear
        contentView.addSubview(contentStackView)
        
        contentStackView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: CustomProposalMessageCellSizeCalculator.cardViewInsets.left).isActive = true
        contentStackView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -CustomProposalMessageCellSizeCalculator.cardViewInsets.right).isActive = true
        contentStackView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: CustomProposalMessageCellSizeCalculator.cardViewInsets.top).isActive = true
        contentStackView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -CustomProposalMessageCellSizeCalculator.cardViewInsets.bottom).isActive = true
        
        messageContainerView.addSubview(contentView)
        contentView.leadingAnchor.constraint(equalTo: messageContainerView.leadingAnchor, constant: CustomProposalMessageCellSizeCalculator.contentViewInsets.left).isActive = true
        contentView.trailingAnchor.constraint(equalTo: messageContainerView.trailingAnchor, constant: -CustomProposalMessageCellSizeCalculator.contentViewInsets.right).isActive = true
        contentView.topAnchor.constraint(equalTo: messageContainerView.topAnchor, constant: CustomProposalMessageCellSizeCalculator.contentViewInsets.top).isActive = true
        
        messageContainerView.addSubview(messageLabel)
        messageLeadingConstraint = messageLabel.leadingAnchor.constraint(equalTo: messageContainerView.leadingAnchor)
        messageLeadingConstraint.isActive = true
        messageTrailingConstraint = messageLabel.trailingAnchor.constraint(equalTo: messageContainerView.trailingAnchor)
        messageTrailingConstraint.isActive = true
        messageBottomConstraint = messageLabel.bottomAnchor.constraint(equalTo: messageContainerView.bottomAnchor)
        messageBottomConstraint.isActive = true
        
        self.setupExtraViews()
    }
    
    open override func configure(with message: MessageType, at indexPath: IndexPath, and messagesCollectionView: MessagesCollectionView) {
        self.message = message
        super.configure(with: message, at: indexPath, and: messagesCollectionView)
        
        for subview in actionsStackView.arrangedSubviews {
            actionsStackView.removeArrangedSubview(subview)
            subview.removeFromSuperview()
        }
        progressViews.removeAll()
        avatarStackViews.removeAll()
        
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
            proposalLabel.textColor = textColor
            titleLabel.textColor = textColor
            descriptionLabel.textColor = textColor
            quorumLabel.textColor = textColor
            timerLabel.textColor = textColor
            messageLabel.textColor = textColor
            
            var proposal: Proposal? = nil
            switch message.kind {
            case .text(let text), .emoji(let text):
                proposal = (message as? Message)?.proposal
                messageLabel.text = text
            case .attributedText(let text):
                proposal = (message as? Message)?.proposal
                messageLabel.attributedText = text
            case .custom(let data):
                proposal = data as? Proposal
            default:
                break
            }
            
            if let proposal = proposal {
                titleLabel.text = proposal.proposalTitle
                descriptionLabel.text = proposal.text
                
                for index in 0..<proposal.voteType {
                    let actionButton = UIButton(type: .custom)
                    actionButton.translatesAutoresizingMaskIntoConstraints = false
                    actionButton.heightAnchor.constraint(equalToConstant: CustomProposalMessageCellSizeCalculator.actionButtonHeight).isActive = true
                    actionButton.backgroundColor = CustomProposalMessageCell.actionButtonBackgroundColor
                    actionButton.clipsToBounds = true
                    actionButton.layer.cornerRadius = 6
                    actionButton.tag = index
                    
                    let titleLabel = UILabel()
                    titleLabel.translatesAutoresizingMaskIntoConstraints = false
                    titleLabel.text = CustomProposalMessageCell.actionTitles[index % CustomProposalMessageCell.actionColors.count]
                    titleLabel.textColor = CustomProposalMessageCell.actionColors[index % CustomProposalMessageCell.actionColors.count]
                    titleLabel.font = CustomProposalMessageCell.actionTitleLabelFont
                    
                    let progressBar = UIProgressView(progressViewStyle: .bar)
                    progressBar.translatesAutoresizingMaskIntoConstraints = false
                    progressBar.layer.borderColor = CustomProposalMessageCell.actionColors[index % CustomProposalMessageCell.actionColors.count].withAlphaComponent(0.5).cgColor
                    progressBar.progressTintColor = CustomProposalMessageCell.actionColors[index % CustomProposalMessageCell.actionColors.count]
                    progressBar.layer.borderWidth = 1
                    progressBar.heightAnchor.constraint(equalToConstant: 10).isActive = true
                    progressBar.layer.cornerRadius = 5
                    progressBar.clipsToBounds = true
                    
                    let stackView = UIStackView(arrangedSubviews: [titleLabel, progressBar])
                    stackView.translatesAutoresizingMaskIntoConstraints = false
                    stackView.axis = .vertical
                    stackView.spacing = 4
                    
                    actionButton.addSubview(stackView)
                    stackView.leadingAnchor.constraint(equalTo: actionButton.leadingAnchor, constant: 10).isActive = true
                    stackView.trailingAnchor.constraint(equalTo: actionButton.trailingAnchor, constant: -10).isActive = true
                    stackView.bottomAnchor.constraint(equalTo: actionButton.centerYAnchor, constant: 10).isActive = true
                    
                    actionsStackView.addArrangedSubview(actionButton)
                    
                    actionButton.addTarget(self, action: #selector(onTapAction), for: .touchUpInside)
                    
                    progressViews.append(progressBar)
                    
                    let avatarStackView = UIStackView()
                    avatarStackView.translatesAutoresizingMaskIntoConstraints = false
                    avatarStackView.axis = .horizontal
                    avatarStackView.spacing = -CustomProposalMessageCellSizeCalculator.avatarImageViewSize / 2
                    
                    actionButton.addSubview(avatarStackView)
                    avatarStackView.leadingAnchor.constraint(equalTo: actionButton.leadingAnchor, constant: 10).isActive = true
                    avatarStackView.bottomAnchor.constraint(equalTo: actionButton.bottomAnchor, constant: -10).isActive = true
                    
                    avatarStackViews.append(avatarStackView)
                }
                
                quorumLabel.text = "Quorum: \(proposal.quorum)"
                refreshTimer()
                setProgressBar(message: message, animated: false)
            }
            
            guard let dataSource = messagesCollectionView.messagesDataSource else {
                return
            }
            
            self.configureExtraViews(with: message, at: indexPath, and: messagesCollectionView)
        }
    }
    
    @IBAction func onTapAction(_ sender: UIButton) {
        (self.delegate as? CustomCellDelegate)?.didSelectProposalAction(in: self, actionIndex: sender.tag)
    }
    
    open override func cellContentView(canHandle touchPoint: CGPoint) -> Bool {
        return messageLabel.handleGesture(CGPointMake(touchPoint.x - messageLabel.frame.minX, touchPoint.y - messageLabel.frame.minY))
    }
    
    /// Handle tap gesture on contentView and its subviews.
    open override func handleTapGesture(_ gesture: UIGestureRecognizer) {
        for actionButton in actionsStackView.arrangedSubviews {
            let touchPoint = gesture.location(in: actionButton)
            if actionButton.bounds.contains(touchPoint) {
                self.onTapAction(actionButton as! UIButton)
                return
            }
        }
        
        let touchLocation = gesture.location(in: self)
        
        switch true {
        case messageContainerView.frame.contains(touchLocation) && !cellContentView(canHandle: convert(touchLocation, to: messageContainerView)):
            delegate?.didTapMessage(in: self)
        case avatarView.frame.contains(touchLocation):
            delegate?.didTapAvatar(in: self)
        case cellTopLabel.frame.contains(touchLocation):
            delegate?.didTapCellTopLabel(in: self)
        case cellBottomLabel.frame.contains(touchLocation):
            delegate?.didTapCellBottomLabel(in: self)
        case messageTopLabel.frame.contains(touchLocation):
            delegate?.didTapMessageTopLabel(in: self)
        case messageBottomLabel.frame.contains(touchLocation):
            delegate?.didTapMessageBottomLabel(in: self)
        case accessoryView.frame.contains(touchLocation):
            delegate?.didTapAccessoryView(in: self)
        default:
            delegate?.didTapBackground(in: self)
        }
    }
    
    /// Handle long press gesture, return true when gestureRecognizer's touch point in `messageContainerView`'s frame
    open override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        for actionButton in actionsStackView.arrangedSubviews {
            let touchPoint = gestureRecognizer.location(in: actionButton)
            if actionButton.bounds.contains(touchPoint) {
                return false
            }
        }
        
        let touchPoint = gestureRecognizer.location(in: self)
        guard gestureRecognizer.isKind(of: UILongPressGestureRecognizer.self) else { return false }
        return messageContainerView.frame.contains(touchPoint)
    }
    
    func setProgressBar(message: MessageType, animated: Bool) {
        self.message = message
        
        var proposal: Proposal? = nil
        switch message.kind {
        case .text(let text), .emoji(let text):
            proposal = (message as? Message)?.proposal
            messageLabel.text = text
        case .attributedText(let text):
            proposal = (message as? Message)?.proposal
            messageLabel.attributedText = text
        case .custom(let data):
            proposal = data as? Proposal
        default:
            break
        }
        
        if let proposal = proposal {
            var index = 0
            for progressBar in progressViews {
                let progress = min(1, Float(proposal.votes.filter({ (key, value) in
                    value == index
                }).count) / Float(proposal.quorum))
                if animated {
                    UIView.animate(withDuration: 0.25) {
                        progressBar.setProgress(progress, animated: true)
                    }
                } else {
                    progressBar.progress = progress
                }
                index += 1
            }
            
            for stackView in avatarStackViews {
                for subview in stackView.arrangedSubviews {
                    stackView.removeArrangedSubview(subview)
                    subview.removeFromSuperview()
                }
            }
            
            for vote in proposal.votes {
                if vote.value < avatarStackViews.count {
                    let stackView = avatarStackViews[vote.value]
                    
                    let avatarImageView = UIImageView()
                    avatarImageView.translatesAutoresizingMaskIntoConstraints = false
                    avatarImageView.widthAnchor.constraint(equalToConstant: CustomProposalMessageCellSizeCalculator.avatarImageViewSize).isActive = true
                    avatarImageView.heightAnchor.constraint(equalToConstant: CustomProposalMessageCellSizeCalculator.avatarImageViewSize).isActive = true
                    avatarImageView.clipsToBounds = true
                    avatarImageView.layer.cornerRadius = CustomProposalMessageCellSizeCalculator.avatarImageViewSize / 2
                    
                    avatarImageView.backgroundColor = .gray // need to replace by loading image from url
                    avatarImageView.layer.borderWidth = 1
                    avatarImageView.layer.borderColor = UIColor.white.cgColor
                    
                    stackView.addArrangedSubview(avatarImageView)
                }
            }
        }
    }
    
    func refreshTimer() {
        guard let message = message else {
            return
        }
        
        var proposal: Proposal? = nil
        switch message.kind {
        case .text(let text), .emoji(let text):
            proposal = (message as? Message)?.proposal
            messageLabel.text = text
        case .attributedText(let text):
            proposal = (message as? Message)?.proposal
            messageLabel.attributedText = text
        case .custom(let data):
            proposal = data as? Proposal
        default:
            break
        }
        
        if let proposal = proposal {
            let interval = proposal.endTime.timeIntervalSinceNow
            if interval <= 0 {
                timerLabel.text = "⏱️ Time Over"
            } else {
                let days: Int = Int(interval / 3600 / 24)
                let hours: Int = Int(interval / 3600) % 24
                let minutes: Int = Int(interval / 60) % 60
                let seconds: Int = Int(interval) % 60
                timerLabel.text = "⏱️ \(days)d:\(hours)h:\(minutes)m:\(seconds)s"
            }
        }
    }
}
