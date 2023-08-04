//
//  PostDiscussionViewController.swift
//  Persona
//
//  Created by Allan Zhang on 3/14/23.
//

import UIKit
import MessageKit
import InputBarAccessoryView
import SDWebImage
import AVFoundation
import AVKit
import BSImagePicker
import Photos
import SafariServices


class PostDiscussionViewController: MessagesViewController, CustomCellDelegate {
    
    public var refPath: String? //this is the path of the post
    public var firstPostMessage: Message? //affects: retrieveMessagesAndStartListener
    private var messages = [Message]()
    private let selfSender = Sender(senderId: UserManager.shared.currentUserId, displayName: UserManager.shared.currentUsername)
    private var firstTimeRefreshed: Bool = false
    
    
    override func viewDidLoad() {
        
        //Important - this must be set prior to calling the super.viewDidLoad() as
        //it sets up the messageCollectionView first
        self.firstPostMessage?.showFullPostMessage = true
        messagesCollectionView = MessagesCollectionView(frame: .zero, collectionViewLayout: CustomMessagesCollectionViewFlowLayout())
        //shows the entire Post message instead of being cut off
        
        super.viewDidLoad()
        NSLog("🐵 post view did load")
        
        self.setupViewControllerDelegates()
        self.registerCustomCells()
        self.setupViews()
        self.customizeMessagesCollectionView()
        
        
        self.addSwipeGestureToMessagesView() //Adds the down swipe to dismiss keyboard
        self.retrieveMessageAndUserDataWithListner()
        self.addNavBar()
        
//        self.setupNotificationObservers()
        
    }
    
    var previousViewFrameOnScreen: CGRect?
    @objc func checkViewPosition() {
        let viewFrameInWindow = view.convert(view.bounds, to: nil)
        let windowFrame = UIApplication.shared.windows.first?.frame ?? .zero
        let viewFrameOnScreen = CGRect(x: viewFrameInWindow.origin.x + windowFrame.origin.x,
                                       y: viewFrameInWindow.origin.y + windowFrame.origin.y,
                                       width: viewFrameInWindow.size.width,
                                       height: viewFrameInWindow.size.height)
        
        
        //Show the the input bar if it is not shown already
        if !hasShownInputBarAlready {
            self.evaluateInputBarAppearanceNeeds(viewFrameOnScreen: viewFrameOnScreen)
        } else {
            if previousViewFrameOnScreen != viewFrameOnScreen { //if it has been shown, then use the more relaxed evaluation approach
                self.evaluateInputBarAppearanceNeeds(viewFrameOnScreen: viewFrameOnScreen)
                // Update the previous value of viewFrameOnScreen
                previousViewFrameOnScreen = viewFrameOnScreen
            }
        }
    }
    
    
    private func evaluateInputBarAppearanceNeeds(viewFrameOnScreen: CGRect) {
        if viewFrameOnScreen.origin.x > 10 || viewFrameOnScreen.origin.x < -10 {
            if self.isFirstResponder || self.messageInputBar.inputTextView.isFirstResponder {
                self.dismissKeyboard()
            }
            self.hideInputBar()
        } else {
            self.unHideInputBar()
        }
    }
    
    private func retrieveMessageAndUserDataWithListner() {
        if UserManager.shared.allPersonaUsers.isEmpty {
            self.retrieveUserList(shouldProceedToGetMessages: true) // will automatically get messages
        } else {
            self.retrieveUserList(shouldProceedToGetMessages: false)
            self.retrieveMessagesAndStartListener()
        }
    }
    
    
    var hasShownInputBarAlready = false
    var displayLink: CADisplayLink?
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        NSLog("🐵 view will appear")
        self.establishViewListner()
        
    }
    
    private func establishViewListner() {
        
        self.invalidateViewListner()
        self.displayLink = CADisplayLink(target: self, selector: #selector(checkViewPosition))
        self.displayLink?.add(to: .main, forMode: .default)
    }
    
    private func invalidateViewListner() {
        self.displayLink?.invalidate()
        self.displayLink = nil
    }
    
    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
//        NSLog("🐵 view will layout subviews")

    }
     
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        print ("at view did appear")
        
        if UserManager.shared.startingInDM {
            print ("⚠️🐵 showing the input bar from DM")
            self.showInputBar(scrollToBottom: true)
        } else {
            self.checkViewPosition() //for race condition in which right bar -> self profile -> nav back to chat tab: no input bar
        }
    }
    
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        NSLog("🐵 View will disappear")
    }
    
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        NSLog("🐵 View did disappear")
        
        //reset hasShown boolean
        self.invalidateViewListner()
        self.hasShownInputBarAlready = false
        
        //reset the DM channel status
        if UserManager.shared.startingInDM {
            
            //reset the currentChatDocPath to the public channel chatDocPath
            if let originalPublicChatDocPath = UserManager.shared.userIsStartingInDmChatPaths[false] {
                NSLog("🐵 User was previously in DM. Resetting status")
                
                //Set the original path which is casted to default status [false]
                UserManager.shared.currentChatDocPath = originalPublicChatDocPath
                
                //set it back to default condition, which is false
                UserManager.shared.startingInDM = false
            }

        }
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    //Data method. Enables custom cell return
    public override func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        
        guard let messagesDataSource = messagesCollectionView.messagesDataSource else {
            fatalError("Ouch. nil data source for messages")
        }
        
        let cellToReturn: UICollectionViewCell
        let message = messagesDataSource.messageForItem(at: indexPath, in: messagesCollectionView)
        switch message.kind {
        case .text, .attributedText, .emoji:
            let cell: MessageContentCell
            if (message as? Message)?.proposal != nil {
                cell = messagesCollectionView.dequeueReusableCell(CustomProposalMessageCell.self, for: indexPath)
            } else {
                cell = messagesCollectionView.dequeueReusableCell(CustomTextMessageCell.self, for: indexPath)
            }
            cell.configure(with: message, at: indexPath, and: messagesCollectionView)
            cell.delegate = self
            
            cellToReturn = cell
        case .photo, .video:
            let cell: MessageContentCell
            if ((message as? Message)?.includedText ?? "").isEmpty {
                cell = messagesCollectionView.dequeueReusableCell(CustomMediaMessageCell.self, for: indexPath)
                cell.backgroundColor = .clear
            } else {
                cell = messagesCollectionView.dequeueReusableCell(CustomCell1.self, for: indexPath)
            }
            cell.configure(with: message, at: indexPath, and: messagesCollectionView)
            cell.delegate = self

            cellToReturn = cell
        case .custom(let data):
            let cell: MessageContentCell
            if let _ = data as? Post {
                cell = messagesCollectionView.dequeueReusableCell(CustomPostMessageCell.self, for: indexPath)
            } else if let _ = data as? Proposal {
                cell = messagesCollectionView.dequeueReusableCell(CustomProposalMessageCell.self, for: indexPath)
            } else {
                cell = messagesCollectionView.dequeueReusableCell(CustomCell1.self, for: indexPath)
            }
            cell.configure(with: message, at: indexPath, and: messagesCollectionView)
            cell.delegate = self

            cellToReturn = cell
        default:
            cellToReturn = super.collectionView(collectionView, cellForItemAt: indexPath)
        }

        //Add a pan gesture recognizer for swipe to reply
        if cellToReturn.contentView.gestureRecognizers?.first(where: { recognizer in
            recognizer as? UIPanGestureRecognizer != nil
        }) == nil {
            let recognizer = UIPanGestureRecognizer(target: self, action: #selector(onPanMessage))
            recognizer.delegate = self
            cellToReturn.contentView.addGestureRecognizer(recognizer)
        }
        return cellToReturn
    }
    
    //Commenting out gesture override method due to conflict with RN bestures. To further explore down the road
    override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        if let view = gestureRecognizer.view,
            let gestureRecognizer = gestureRecognizer as? UIPanGestureRecognizer {
            let translation = gestureRecognizer.translation(in: view)
            return abs(translation.y) <= abs(translation.x)
        }

        return true
    }

    
    @IBAction func onPanMessage(_ sender: UIPanGestureRecognizer) {
        if let cell = sender.view?.superview as? UICollectionViewCell {
            let view = (cell as? MessageContentCell)?.messageContainerView ?? cell.contentView
            let translation = sender.translation(in: sender.view)
            switch sender.state {
            case .began:
                view.tag = 0
            case .changed:
                let dx = max(0, CGFloat(Int(min(translation.x, AppConstants.ViewStandards.CELL_SWIPE_MAX_OFFSET)) - view.tag))
                view.frame = view.frame.offsetBy(dx: dx, dy: 0)
                view.tag = Int(dx) + view.tag
            case .cancelled:
                view.frame = view.frame.offsetBy(dx: CGFloat(-view.tag), dy: 0)
                view.tag = 0
            case .ended:
                view.frame = view.frame.offsetBy(dx: CGFloat(-view.tag), dy: 0)

                if view.tag == Int(AppConstants.ViewStandards.CELL_SWIPE_MAX_OFFSET),
                   let indexPath = messagesCollectionView.indexPath(for: cell),
                   let messagesDataSource = messagesCollectionView.messagesDataSource,
                   let message = messagesDataSource.messageForItem(at: indexPath, in: messagesCollectionView) as? Message {
                     if !self.isShowingReplyBar {
                         self.showReplyViewOnInputBar(repliedMessage: message)
                     } else {
                         //update the reply bar message
                         self.updateReplyInfoForExistingReplyBar(repliedMessage: message)
                     }
                }
                view.tag = 0
            default:
                break
            }
        }
    }
    
    private func outputCellContentWith(cell: CustomCell1) {
        print ("🤜 Outputting cell content: \(cell.messageLabel.text)")
    }
    
    //Overrides menu shown for long press without subclassing cells
    //Long press to reply, copy, or edit
    var isLongPressing = false
    var longPressedSelection: Message?
    
    //The photo attachment logic
    private var attachmentsDataSource: AttachmentsDataSource!
    private let attachmentsCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .horizontal
        layout.itemSize = CGSize(width: 64, height: 64) //image size for the attachments
        layout.minimumInteritemSpacing = 2 //the spacing between each image
        layout.minimumLineSpacing = 2
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        collectionView.showsHorizontalScrollIndicator = false
        collectionView.backgroundColor = .clear
        collectionView.contentInset = UIEdgeInsets(top: 2, left: 20, bottom: 0, right: 20) //insets for attachments collectionview
        collectionView.register(ImageCollectionViewCell.self, forCellWithReuseIdentifier: "ImageCell")
        return collectionView
    }()
    
    //Photo uploading logic
    private var isUploading: Bool = false
//    {
//        didSet {
//            uploadingProgresBar.isHidden = !isUploading
//        }
//    }
    private let uploadingProgresBar: UIProgressView = {
        let progressBar = UIProgressView(progressViewStyle: .bar)
        progressBar.translatesAutoresizingMaskIntoConstraints = false
        progressBar.trackTintColor = UIColor(hex: AppConstants.ChatDesign.INPUTBAR_BACKGROUND_COLOR_CODE) //progress bar track color here
        progressBar.progressTintColor = .white //progress bar color here
        progressBar.heightAnchor.constraint(equalToConstant: 1).isActive = true
        progressBar.isHidden = false
        progressBar.alpha = 0.0
        return progressBar
    }()
    
    
    override func collectionView(_ collectionView: UICollectionView, shouldShowMenuForItemAt indexPath: IndexPath) -> Bool {
        
        isLongPressing = true
        longPressedSelection = self.messages[indexPath.section]
//        print ("long pressed on \(longPressedSelection?.includedText)")
        
        self.presentBottomReplySheet()
        return false
    }
    
    func customizeMessagesCollectionView() {
        
        //Make the messages closer together. Default is 3
        //        let layout = messagesCollectionView.collectionViewLayout as? MessagesCollectionViewFlowLayout //CustomCell1
        let layout = messagesCollectionView.collectionViewLayout as? CustomMessagesCollectionViewFlowLayout
        layout?.sectionInset = UIEdgeInsets(top: 1, left: 8, bottom: 1, right: 8)
        
        // Hide the outgoing avatar and adjust the label alignment to line up with the messages
        layout?.setMessageOutgoingAvatarSize(.zero)
        layout?
            .setMessageOutgoingMessageTopLabelAlignment(LabelAlignment(
                textAlignment: .right,
                textInsets: UIEdgeInsets(top: 0, left: 0, bottom: 0, right: 8)))
        
        //this edges the bottom time label closer to the message bubble
//        layout?
//            .setMessageOutgoingMessageBottomLabelAlignment(LabelAlignment(
//                textAlignment: .right,
//                textInsets: UIEdgeInsets(top: -10, left: 0, bottom: 0, right: 8)))
        
        //This aligns the username display with the avatar
        layout?
            .setMessageIncomingMessageTopLabelAlignment(LabelAlignment(
                textAlignment: .left,
                textInsets: UIEdgeInsets(top: 0, left: 40, bottom: 4, right: 8)))
        
        layout?.setMessageIncomingAccessoryViewPosition(.cellTop)
        layout?.setMessageOutgoingAccessoryViewPosition(.cellTop)
        

    }
    
    func configureAvatarView(_ avatarView: AvatarView, for message: MessageType, at indexPath: IndexPath, in messagesCollectionView: MessagesCollectionView) {
        
//        let message = messages[indexPath.section]
        
//        let avatar = SampleData.shared.getAvatarFor(sender: message.sender)
//        avatarView.set(avatar: avatar)
        avatarView.isHidden = isPreviousMessageSameSender(at: indexPath)
//        avatarView.layer.borderWidth = 2
//        avatarView.layer.borderColor = UIColor.primaryColor.cgColor
        if let userProfileImageUrl = UserManager.shared.getUserProfileImageUrlFrom(userId: message.sender.senderId),
           let imageURL = URL(string: userProfileImageUrl) {
            avatarView.sd_setImage(with: imageURL, placeholderImage: UIImage.init(systemName: "person.circle.fill")?.withTintColor(.black, renderingMode: .alwaysOriginal), options: [], context: [.imageThumbnailPixelSize: CGSize(width: avatarView.bounds.width * 2.5, height: avatarView.bounds.height * 2.5)])
        } else {
            avatarView.image = UIImage.init(systemName: "person.circle.fill")?.withTintColor(.black, renderingMode: .alwaysOriginal)
        }
    }
    
    
    private func registerCustomCells() {
        //        messagesCollectionView.register(LinkPreviewMessageCell.self)
        messagesCollectionView.register(CustomCell1.self)
        messagesCollectionView.register(CustomTextMessageCell.self)
        messagesCollectionView.register(CustomMediaMessageCell.self)
        messagesCollectionView.register(CustomPostMessageCell.self)
        messagesCollectionView.register(CustomProposalMessageCell.self)
    }
    
    //Input bar extension
    var isShowingReplyBar = false
    private func showReplyViewOnInputBar(repliedMessage: Message) {
        
        let inputView = UIView()
        inputView.translatesAutoresizingMaskIntoConstraints = false
        let heightOfView: CGFloat = AppConstants.ViewStandards.INPUTBAR_HEIGHT
        
        // Set the background color of the inputView to match the messageInputBar
        inputView.backgroundColor = UIColor(hex: AppConstants.ChatDesign.INPUTBAR_BACKGROUND_COLOR_CODE)
        //messageInputBar.topStackView.backgroundColor = .clear //will make everything on the view clear
        messageInputBar.topStackView.superview?.backgroundColor = .clear
        messageInputBar.topStackView.insertArrangedSubview(inputView, at: 0)
        
        // Set the width of the inputView to be equal to the width of the topStackView
        inputView.widthAnchor.constraint(equalTo: messageInputBar.topStackView.widthAnchor, constant: 0.0).isActive = true
        inputView.heightAnchor.constraint(equalToConstant: heightOfView).isActive = true
        inputView.frame.origin.y = messageInputBar.frame.maxY
        inputView.tag = AppConstants.ViewDesignations.INPUTBAR_REPLYVIEW_TAG
        
        //Adds the labels
        let latBuffer: CGFloat = 20.0
        let longBuffer: CGFloat = 8.0
        let labelsBuffer: CGFloat = 20.0
        
        
        let smallReplyLabel = UILabel(frame: CGRect(x: latBuffer,
                                                    y: longBuffer,
                                                    width: self.view.frame.width - (latBuffer),
                                                    height: 20))
        smallReplyLabel.text = self.generateRepliedUserDescription(repliedUserId: repliedMessage.sender.senderId)
        smallReplyLabel.numberOfLines = 1
        smallReplyLabel.font = .systemFont(ofSize: 12)
        smallReplyLabel.textColor = .white
        smallReplyLabel.alpha = 0.0
        smallReplyLabel.tag = 1
        
        let smallDismissButton = UIButton(frame: CGRect(x: 0, y: -5, width: 28, height: 28))
        let buttonImage = UIImage(systemName: "x.circle.fill")?.withTintColor(.gray, renderingMode: .alwaysOriginal)
        smallDismissButton.setImage(buttonImage, for: .normal)
        smallDismissButton.center = CGPoint(x: smallReplyLabel.frame.width - 8, y: 18) //alters the positioning of smallDismissButton
        smallDismissButton.alpha = 0.0
        smallDismissButton.addTarget(self, action: #selector(onReplyDismissTapped), for: .touchUpInside)
        
        let largeReplyLabel = UILabel(frame: CGRect(x: latBuffer,
                                                    y: smallReplyLabel.frame.size.height + labelsBuffer - 10, // move it up 10 points
                                                    width: self.view.frame.width * 0.86, // set width to 86% of view width
                                                    height: 26))
        
        largeReplyLabel.text = self.makeRepliedTextBasedOnMessage(message: repliedMessage)
        largeReplyLabel.numberOfLines = 2
        largeReplyLabel.font = UIFont.italicSystemFont(ofSize: 14)
        largeReplyLabel.textColor = .white
        largeReplyLabel.alpha = 0.0
        largeReplyLabel.tag = 2
        
        inputView.addSubview(smallReplyLabel)
        inputView.addSubview(largeReplyLabel)
        inputView.addSubview(smallDismissButton)
        inputView.bringSubviewToFront(smallReplyLabel)
        inputView.bringSubviewToFront(largeReplyLabel)
        inputView.bringSubviewToFront(smallDismissButton)
        
        // Add layout constraints
        NSLayoutConstraint.activate([
            smallReplyLabel.leadingAnchor.constraint(equalTo: inputView.leadingAnchor, constant: latBuffer),
            smallReplyLabel.topAnchor.constraint(equalTo: inputView.topAnchor, constant: longBuffer),
            smallReplyLabel.trailingAnchor.constraint(equalTo: inputView.trailingAnchor, constant: -latBuffer),
            
            largeReplyLabel.leadingAnchor.constraint(equalTo: inputView.leadingAnchor, constant: latBuffer),
            largeReplyLabel.topAnchor.constraint(equalTo: smallReplyLabel.bottomAnchor, constant: labelsBuffer - 10), // move it up 10 points
            largeReplyLabel.trailingAnchor.constraint(equalTo: inputView.trailingAnchor, constant: -latBuffer),
            
            smallDismissButton.widthAnchor.constraint(equalToConstant: 32),
            smallDismissButton.heightAnchor.constraint(equalToConstant: 32),
            smallDismissButton.trailingAnchor.constraint(equalTo: smallReplyLabel.leadingAnchor, constant: -8),
            smallDismissButton.topAnchor.constraint(equalTo: inputView.topAnchor)
        ])
        
        // Animate the inputView to slide up
        let needsScrollToBottom = messagesCollectionView.contentOffset.y + messagesCollectionView.frame.height == messagesCollectionView.contentSize.height //for managing threads
        UIView.animate(withDuration: 0.3, delay: 0.0, options: [.curveEaseInOut], animations: {
            inputView.frame.origin.y = self.messageInputBar.frame.maxY - heightOfView
            self.messagesCollectionView.contentOffset = self.messagesCollectionView.contentOffset.applying(CGAffineTransform(translationX: 0, y: heightOfView)) //for threads
        }, completion: {_ in
            self.isShowingReplyBar = true
            
            UIView.animate(withDuration: 0.3) {
                smallReplyLabel.alpha = 1.0
                largeReplyLabel.alpha = 0.6
                smallDismissButton.alpha = 1.0
            } completion: { _ in
                
            }
        })
    }

    private func updateReplyInfoForExistingReplyBar(repliedMessage: Message) {
        
//        let inputView = messageInputBar.topStackView.arrangedSubviews[0]
//        if inputView.tag != AppConstants.ViewDesignations.INPUTBAR_REPLYVIEW_TAG {
//            print ("Inputview tag \(inputView.tag) is not the same as \(AppConstants.ViewDesignations.INPUTBAR_REPLYVIEW_TAG)")
//            return
//        }
        guard let inputView = messageInputBar.topStackView.viewWithTag(AppConstants.ViewDesignations.INPUTBAR_REPLYVIEW_TAG) else {
            print ("Inputview not found")
            return
        }
        
        for subview in inputView.subviews {
            if subview.tag == 1 {
                //this subview is the user reply tag
                if let smallReplyLabel = subview as? UILabel {
                    smallReplyLabel.text = self.generateRepliedUserDescription(repliedUserId: repliedMessage.sender.senderId)
                }
            } else if subview.tag == 2 {
                if let largeReplyLabel = subview as? UILabel {
                    largeReplyLabel.text = self.makeRepliedTextBasedOnMessage(message: repliedMessage)
                }
            }
        }
    }
    
    private func makeRepliedTextBasedOnMessage(message: Message) -> String {
        var replyText = ""
        
        if message.includedText.isEmpty || message.includedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            
            print ("I have evaluted this to be empty")

            if let mediaUrl = message.mediaUrl {
                if FirestoreHelper.shared.isPhotoOrVideo(mediaUrl: mediaUrl) == .photo {
                    replyText = "📸 [photo message]"
                } else if FirestoreHelper.shared.isPhotoOrVideo(mediaUrl: mediaUrl) == .video {
                    replyText = "📹 [video message]"
                } else {
                    print ("no media type found")
                }
            } else {
                print ("no media url found for this message")
            }
        } else {
            replyText = message.includedText
        }
        
        
        return replyText
    }
    
    private func generateRepliedUserDescription(repliedUserId: String) -> String {
        //turn replied userID to username AZ
        var replyToNote = ""
        if let userName = UserManager.shared.getUserNameFrom(userId: repliedUserId) {
            replyToNote = " to @\(userName)"
        }
        
        var generatedText = "⮐ Replying\(replyToNote)"
        if repliedUserId == UserManager.shared.currentUserId {
            generatedText = "⮐ Replying to myself"
        }
        
        return generatedText
    }
    
    @objc private func onReplyDismissTapped() {
        print ("Dismissing the reply button")
        self.dismissReplyViewOnInputBar()
    }
    
    
    private func dismissReplyViewOnInputBar(completion: (() -> Void)? = nil) {
        for view in messageInputBar.topStackView.subviews {
            if view.tag == AppConstants.ViewDesignations.INPUTBAR_REPLYVIEW_TAG { //Find the view that is the inputbar
                UIView.animate(withDuration: 0.3, delay: 0.0, options: [.curveEaseInOut], animations: {
                    view.frame.origin.y = self.messageInputBar.frame.origin.y
                    view.alpha = 0.0
                }, completion: {_ in
                    view.removeFromSuperview() //removes the reply bar from superview
                    self.isShowingReplyBar = false //indicates that reply bar is not showing
                    self.longPressedSelection = nil //resets the long press selected message
                    completion?()
                })
                break
            }
        }
    }

    
    private func setupViews() {
        self.view.backgroundColor = .lightText
        self.messagesCollectionView.backgroundColor = UIColor.init(hex: AppConstants.ChatDesign.CHAT_BACKGROUND_COLOR_CODE)
        
        //adding a top buffer to the view
        let buffer: CGFloat = 188.0
        messagesCollectionView.contentInset = UIEdgeInsets(top: buffer, left: 0, bottom: 0, right: 0)
        messagesCollectionView.scrollIndicatorInsets = UIEdgeInsets(top: buffer, left: 0, bottom: 0, right: 0)
        
        self.customizeInputBar()
        self.customizeAttachmentsCollectionView()
    }
    
    private func customizeAttachmentsCollectionView() {
        attachmentsCollectionView.backgroundColor = messageInputBar.backgroundView.backgroundColor
        
        attachmentsDataSource = AttachmentsDataSource(collectionView: attachmentsCollectionView, onAttachmentsDeleted: { _ in
            if self.attachmentsDataSource.attachments.isEmpty {
                UIView.animate(withDuration: 0.3) {
                    self.attachmentsCollectionView.superview?.isHidden = true
                }
            }
        })
        
        attachmentsCollectionView.dataSource = self.attachmentsDataSource
        attachmentsCollectionView.delegate = self.attachmentsDataSource

        attachmentsCollectionView.heightAnchor.constraint(equalToConstant: 66).isActive = true //height of the attachments collectionview
        
        let backgroundView = UIView()
        backgroundView.backgroundColor = .clear
        backgroundView.addSubview(attachmentsCollectionView)
        backgroundView.clipsToBounds = true
        
        messageInputBar.topStackView.addArrangedSubview(backgroundView)

        NSLayoutConstraint.activate([
            attachmentsCollectionView.leadingAnchor.constraint(equalTo: backgroundView.leadingAnchor),
            attachmentsCollectionView.topAnchor.constraint(equalTo: backgroundView.topAnchor),
            attachmentsCollectionView.widthAnchor.constraint(equalTo: messageInputBar.topStackView.widthAnchor),
            backgroundView.heightAnchor.constraint(equalToConstant: 66) //height of the attachments collectionview
        ])

        backgroundView.isHidden = true
    }
    
    
    
    private func customizeInputBar() {
        
        messageInputBar.backgroundView.backgroundColor = UIColor.init(hex: AppConstants.ChatDesign.INPUTBAR_BACKGROUND_COLOR_CODE)
        messageInputBar.inputTextView.backgroundColor = UIColor.init(hex: AppConstants.ChatDesign.INPUTBAR_TEXTVIEW_COLOR_CODE)
        messageInputBar.backgroundColor = UIColor.init(hex: "282932") //override?
        messageInputBar.inputTextView.textColor = .white
        messageInputBar.separatorLine.isHidden = true
        messageInputBar.inputTextView.layer.cornerRadius = 12.0
        messageInputBar.inputTextView.layer.masksToBounds = true
        messageInputBar.inputTextView.placeholder = " Aa"
        
        let leftPadding = 6.0
        let textContainerInset = messageInputBar.inputTextView.textContainerInset
        messageInputBar.inputTextView.textContainerInset = UIEdgeInsets(top: textContainerInset.top + 0,
                                                                        left: CGFloat(leftPadding),
                                                                        bottom: textContainerInset.bottom + 0,
                                                                        right: textContainerInset.right)
        
        self.setupInputButtons()
        self.configureInputBarPadding()
    }
    
    //Inputbar input bar customization
    private func setupInputButtons() {
        
        let sizeOfButton: CGFloat = 28
        let buttonBuffer: CGFloat = 1.0
        
        //Right send button confirguration
        messageInputBar.setRightStackViewWidthConstant(to: sizeOfButton + 4, animated: false)
        messageInputBar.sendButton.setSize(CGSize(width: sizeOfButton, height: sizeOfButton), animated: false)
        let sendButtonImage = UIImage(systemName: "paperplane.fill")?.withTintColor(.white, renderingMode: .alwaysOriginal)
        messageInputBar.sendButton.setImage(sendButtonImage, for: .normal)
        let sendButtonImageDisabled = UIImage(systemName: "paperplane")?.withTintColor(UIColor(white: 0.9, alpha: 0.5), renderingMode: .alwaysOriginal)
        messageInputBar.sendButton.setImage(sendButtonImageDisabled, for: .disabled)
        
        messageInputBar.sendButton.title = nil
        
        //Left buttonss
        let plusButton = InputBarButtonItem()
        plusButton.translatesAutoresizingMaskIntoConstraints = false
        plusButton.setSize(CGSize (width: sizeOfButton, height: sizeOfButton), animated: false) //plus button size
        plusButton.setImage(UIImage(systemName: "plus.circle.fill", withConfiguration: UIImage.SymbolConfiguration(pointSize: sizeOfButton, weight: .regular, scale: .large)), for: .normal) // plus button image size(point size will affect the image size)
        plusButton.tintColor = UIColor.white.withAlphaComponent(0.8)

        plusButton.onTouchUpInside { [weak self] _ in
            self?.onChatOptionsButtonTapped()
        }
        
//        messageInputBar.setLeftStackViewWidthConstant(to: (sizeOfButton) + (buttonBuffer*4), animated: false)
//        messageInputBar.setStackViewItems ([plusButton], forStack: .left, animated: false)
        // Spacer
        let spacer = InputBarButtonItem()
        spacer.translatesAutoresizingMaskIntoConstraints = false
        spacer.setSize(CGSize(width: buttonBuffer * 8, height: 0), animated: false)
        
        messageInputBar.setLeftStackViewWidthConstant(to: (sizeOfButton*1) + (buttonBuffer*8), animated: false)
        messageInputBar.setStackViewItems ([plusButton, spacer], forStack: .left, animated: false)
        
        //adding the upload bar here
        messageInputBar.addSubview(uploadingProgresBar)
        NSLayoutConstraint.activate([
            messageInputBar.topAnchor.constraint(equalTo: uploadingProgresBar.topAnchor),
            messageInputBar.leadingAnchor.constraint(equalTo: uploadingProgresBar.leadingAnchor),
            messageInputBar.trailingAnchor.constraint(equalTo: uploadingProgresBar.trailingAnchor)
        ])
    }
    
    private func configureInputBarPadding() {
        // Entire InputBar padding
        messageInputBar.padding.bottom = 10 //10
        messageInputBar.padding.top = 10
        
        //A negative number extends the text input bar while a positive numver shortens it
        messageInputBar.middleContentViewPadding.right = 0
        messageInputBar.middleContentViewPadding.left = 0
        
        // or InputTextView padding
        messageInputBar.inputTextView.textContainerInset.bottom = 4
    }
    
    
    //on attachment onattachment button
    private func onChatOptionsButtonTapped() {
        self.presentBottomMediaSheet()
    }
    
    
    
    //for testing only
    var functionIndex = 0

    func buttonPressed(functionA: () -> Void, functionB: () -> Void) {
        if functionIndex == 0 {
            functionA()
            functionIndex = 1
        } else {
            functionB()
            functionIndex = 0
        }
    }
    
    private func presentBottomMediaSheet() {
        
        if self.messageInputBar.inputTextView.isFirstResponder {
            self.dismissKeyboard()
        }
        
        if #available(iOS 15.0, *) {
            let sheetViewController = ChatBottomMediaSelectionViewController()
            sheetViewController.delegate = self
            if let sheet = sheetViewController.sheetPresentationController {
                sheet.prefersGrabberVisible = true
                sheet.detents = [.medium()]
            }
            self.makeVibration()
            present(sheetViewController, animated: true)
        } else {
            //show action sheet
        }
    }
    
    private func presentBottomReplySheet() {
        
        if #available(iOS 15.0, *) {
            let sheetViewController = ChatBottomSelectionViewController()
            sheetViewController.delegate = self
            if let sheet = sheetViewController.sheetPresentationController {
                sheet.prefersGrabberVisible = true
                sheet.detents = [.medium()]
            }
            self.makeVibration()
            present(sheetViewController, animated: true)
        } else {
            //show action sheet
        }
    }
    
    private func makeVibration() {
        let generator = UIImpactFeedbackGenerator(style: .heavy)
        generator.impactOccurred()
    }
    
    
    
    private func getPhotoFromPhotoLibrary() {
        print("About to present photo library picker")
        
        let imagePicker = ImagePickerController()
        imagePicker.settings.selection.max = 4 // Set maximum number of images to select here
        imagePicker.settings.theme.selectionFillColor = UIColor.blue.withAlphaComponent(0.5) // Set selection fill color here
        imagePicker.settings.theme.selectionStrokeColor = UIColor.white // Set selection stroke color here
        imagePicker.settings.theme.selectionShadowColor = UIColor.blue // Set selection shadow color here
        imagePicker.settings.fetch.assets.supportedMediaTypes = [.image] // Only show images in the library
        imagePicker.settings.list.cellsPerRow = {(verticalSize: UIUserInterfaceSizeClass, horizontalSize: UIUserInterfaceSizeClass) -> Int in
            switch (verticalSize, horizontalSize) {
            case (.compact, .regular):
                return 3 // Number of cells per row for compact height (e.g. iPhone landscape)
            case (.compact, .compact):
                return 4 // Number of cells per row for compact height (e.g. iPhone portrait)
            default:
                return 4 // Number of cells per row for other height (e.g. iPad)
            }
        }
        
        self.presentImagePicker(imagePicker, select: { (asset) in
            print("Selected: \(asset)")
        }, deselect: { (asset) in
            print("Deselected: \(asset)")
        }, cancel: { (assets) in
            print("Canceled with selections: \(assets)")
            self.unHideInputBar()
        }, finish: { (assets) in
            print("Finished with selections: \(assets)")
            
            let manager = PHImageManager.default()
            let options = PHImageRequestOptions()
            options.deliveryMode = .fastFormat

            var previewImages = [UIImage]()
            var originalImages = [UIImage]()
            let dispatchGroup = DispatchGroup()
            let originalOptions = PHImageRequestOptions()
            originalOptions.deliveryMode = .highQualityFormat
            originalOptions.resizeMode = .none
            originalOptions.isSynchronous = false
            
            for asset in assets {
                if asset.mediaType == .image {
                    dispatchGroup.enter()
                    manager.requestImage(for: asset, targetSize: CGSize(width: 80, height: 80), contentMode: .aspectFill, options: options) { image, info in
                        if let image = image {
                            previewImages.append(image)
                            NSLog("Appending thumbnail image")
                        }
                        dispatchGroup.leave()
                    }
                    
                    dispatchGroup.enter()
                    manager.requestImage(for: asset, targetSize: PHImageManagerMaximumSize, contentMode: .aspectFill, options: originalOptions) { image, info in
                        if let originalImage = image {
                            originalImages.append(originalImage)
                            NSLog("Appending original image")
                        } else {
                            print("Unable to cast?")
                        }
                        dispatchGroup.leave()
                    }
                } else if asset.mediaType == .video {
                    dispatchGroup.enter()
                    manager.requestAVAsset(forVideo: asset, options: nil) { [weak self] (asset, _, _) in
                        if let asset = asset as? AVURLAsset {
                            ChatBottomMediaSelectionViewController.generateThumbnail(from: asset.url) { [weak self] thumbnail in
                                if let thumbnail = thumbnail {
                                    //self?.setAttachmentImages([thumbnail]) //to do AZ
                                }
                                dispatchGroup.leave()
                            }
                        } else {
                            dispatchGroup.leave()
                        }
                    }
                }
            }

            dispatchGroup.notify(queue: .main) {
                NSLog("Finished all appending")
                self.setAttachmentImages(previewImages, originalImages: originalImages) //this shows the attached images
                self.unHideInputBar()
            }
        })
    }
    
    private func getVideoFromLibrary() {
        print("About to present photo library picker")
        let imagePicker = ImagePickerController()
        imagePicker.settings.selection.max = 1 // Set maximum number of images to select here
        imagePicker.settings.theme.selectionFillColor = UIColor.blue.withAlphaComponent(0.5) // Set selection fill color here
        imagePicker.settings.theme.selectionStrokeColor = UIColor.white // Set selection stroke color here
        imagePicker.settings.theme.selectionShadowColor = UIColor.blue // Set selection shadow color here
        imagePicker.settings.fetch.assets.supportedMediaTypes = [.video] // Only show videos in the library
        imagePicker.settings.list.cellsPerRow = {(verticalSize: UIUserInterfaceSizeClass, horizontalSize: UIUserInterfaceSizeClass) -> Int in
            switch (verticalSize, horizontalSize) {
            case (.compact, .regular):
                return 3 // Number of cells per row for compact height (e.g. iPhone landscape)
            case (.compact, .compact):
                return 4 // Number of cells per row for compact height (e.g. iPhone portrait)
            default:
                return 4 // Number of cells per row for other height (e.g. iPad)
            }
        }
        
        self.presentImagePicker(imagePicker, select: { (asset) in
            print("Selected: \(asset)")
        }, deselect: { (asset) in
            print("Deselected: \(asset)")
        }, cancel: { (assets) in
            print("Canceled with selections: \(assets)")
            self.unHideInputBar()
        }, finish: { (assets) in
            print("Finished with selections: \(assets)")
            self.unHideInputBar()
        })
    }
    
    
    private func setupViewControllerDelegates() {
        //Handles logic for sourcing and displaying messages
        messagesCollectionView.messagesDataSource = self
        messagesCollectionView.messagesLayoutDelegate = self
        messagesCollectionView.messagesDisplayDelegate = self
        
        //Handles logic for interaction with a specific message
        messagesCollectionView.messageCellDelegate = self
        
        //Handles logic for interaction with the input bar
        messageInputBar.delegate = self
        
        //Handles logic for interaction with the textview inside the input bar
        messageInputBar.inputTextView.delegate = self
        
    }
    
    private func retrieveMessagesAndStartListener() {
            
            //To update for Post
            guard let currentChatPath = self.refPath else {
                print ("Unable to find a path")
                return
            }
            
            FirestoreManager.shared.retrieveAndListenForMessagesFrom(chatDocPath: currentChatPath, messagesCollectionType: .comments) { [weak self] result in
                switch result {
                case .success(let retrievedMessages):
                    self?.messages = retrievedMessages
                case .failure(let retrivalError):
                    print ("Message retrival error \(retrivalError)")
                }
                
                if let firstMessage = self?.firstPostMessage {
                    self?.messages.insert(firstMessage, at: 0)
                }
                
                self?.updateMessagesAfterRetrival()
            }
        }
    
    private func retrieveUserList(shouldProceedToGetMessages: Bool = false) {
        
        FirestoreManager.shared.getPersonaUsers { result in
            switch result {
            case .success(let retrievedUsers):
                print ("👩🏼 Retrieved \(retrievedUsers.count) users")
                
                //First time reload logic / edge case
                //The first time, the user objects may not be retrieved when the messages are retieved,
                //if so, then trigger a reload to the collection view when the users are afterwards retrieved
                
                UserManager.shared.updateUsersListWith(retrievedUsers: retrievedUsers)
                if shouldProceedToGetMessages {
                    print ("👩🏼 Reload data after data retrival")
                    self.retrieveMessagesAndStartListener()
                }
                
                
            case .failure(let retrivalError):
                print ("User retrival error \(retrivalError)")
            }
            
        }
        
    }
    
    
    // Given a quirk with MessageKit used in a childViewController,
    // this function is need to show the input bar
    private func showInputBar(scrollToBottom: Bool = false) {
        DispatchQueue.main.async {
            UIView.animate(withDuration: 0.2, animations: {
                self.view.updateConstraints()
                self.view.layoutIfNeeded()
            }) { (completed) in
                self.becomeFirstResponder()
                if scrollToBottom == true {
                    print ("⚠️ Scroll to latest message from showing input bar")
                    self.scrollToLatestMessage(delayInMiliseconds: 50, animated: false) //Disabling scrolling to reduce visual clutter
                }
            }
        }
    }
    
    private func dismissKeyboard() {
        print ("💼 calling resign first responder?")
        self.messageInputBar.inputTextView.resignFirstResponder()
    }
    
    private func updateMessagesAfterRetrival() {
        DispatchQueue.main.async {
            //print ("⚠️ Reloading data function ")
            self.messagesCollectionView.reloadData()
            if self.firstTimeRefreshed == false {
                self.firstTimeRefreshed = true
                self.scrollToLatestMessage(delayInMiliseconds: 10, animated: true)
            }
        }
    }
    
    private func scrollToLatestMessage(delayInMiliseconds: Int = 0,
                                       animated: Bool = true) {
        
//         A delay is recommended when this is linked with another animation
//         such as the keyboard appearing
        let dispatchAfter = DispatchTimeInterval.milliseconds(delayInMiliseconds)
        DispatchQueue.main.asyncAfter(deadline: .now() + dispatchAfter) {
            self.messagesCollectionView.scrollToLastItem(animated: animated)
            print ("Scrolling to last message")
        }
    }
    
    
    
}

//Add some custom gestures to the message view
extension PostDiscussionViewController {
    
    private func addSwipeGestureToMessagesView() {
        let swipeGesture = UISwipeGestureRecognizer(target: self, action: #selector(handleSwipeGesture))
        swipeGesture.direction = .down
        self.messagesCollectionView.addGestureRecognizer(swipeGesture)
    }
    
    @objc func handleSwipeGesture(gesture: UISwipeGestureRecognizer) {
        print ("Swiped down")
        if self.messageInputBar.inputTextView.isFirstResponder {
            self.dismissKeyboard()
        }
    }
    
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
        return true
    }
}


// MARK: - MessagesViewController display methods
extension PostDiscussionViewController: MessagesDataSource, MessagesLayoutDelegate, MessagesDisplayDelegate {
    
    func currentSender() -> MessageKit.SenderType {
        return selfSender
    }
    
    //Data method
    func messageForItem(at indexPath: IndexPath, in messagesCollectionView: MessageKit.MessagesCollectionView) -> MessageKit.MessageType {
        //This can be modified with different types of messages
        guard indexPath.section < messages.count else {
            print("🛑 Index out of bounds error: Invalid section: \(indexPath.section), messages count: \(messages.count)")
            
            //returns a dummy variable when its out of bounds
            let dummyMessage = Message(sender: Sender(senderId: "1", displayName: "1"), kind: .text("1"), sentDate: Date(), messageId: "1234", isDeleted: false, isThread: false, seen: [:])
            return dummyMessage
        }
        return messages[indexPath.section]
        
    }
    
    func numberOfSections(in messagesCollectionView: MessageKit.MessagesCollectionView) -> Int {
        print ("⚠️ Total message count: \(messages.count)")
        return messages.count
    }
    
    
    
    //Display methods
    //This modifies the message style so that it combines a group of messages sent
    //into a cohesive whole
    func messageStyle(for message: MessageType, at indexPath: IndexPath, in messagesCollectionView: MessagesCollectionView) -> MessageStyle {
        //return .bubbleTail(.bottomLeft, .curved)
        //return .bubble
        var corners: UIRectCorner = []
        
        //Message sender
        if isFromCurrentSender(message: message) {
            corners.formUnion(.topLeft)
            corners.formUnion(.bottomLeft)
            if !isPreviousMessageSameSender(at: indexPath) {
                corners.formUnion(.topRight)
            }
            if !isNextMessageSameSender(at: indexPath) {
                corners.formUnion(.bottomRight)
            }
        } else {
            corners.formUnion(.topRight)
            corners.formUnion(.bottomRight)
            if !isPreviousMessageSameSender(at: indexPath) {
                corners.formUnion(.topLeft)
            }
            if !isNextMessageSameSender(at: indexPath) {
                corners.formUnion(.bottomLeft)
            }
        }
        
        return .custom { view in
            let radius: CGFloat = 16
            let path = UIBezierPath(
                roundedRect: view.bounds,
                byRoundingCorners: corners,
                cornerRadii: CGSize(width: radius, height: radius))
            let mask = CAShapeLayer()
            mask.path = path.cgPath
            view.layer.mask = mask
        }
    }
    
    
    func configureAccessoryView(_ accessoryView: UIView, for message: MessageType, at indexPath: IndexPath, in messagesCollectionView: MessagesCollectionView) {
        
    }
    
    //Top label height
    func messageTopLabelHeight(for message: MessageType, at indexPath: IndexPath, in messagesCollectionView: MessagesCollectionView) -> CGFloat {
        if message.sender.senderId == selfSender.senderId {
            return 0
        }
        
        if self.isPreviousMessageSameSender(at: indexPath) {
            return 0
        }
        
        return CGFloat(CustomMessagesCollectionViewFlowLayout.avatarSize)
    }
    
    //Top label content
    func messageTopLabelAttributedText(for message: MessageType, at indexPath: IndexPath) -> NSAttributedString? {
        if message.sender.senderId == selfSender.senderId {
            return nil
        }
        
        return NSAttributedString(string: message.sender.displayName,
                                  attributes: [.foregroundColor: CustomMessagesCollectionViewFlowLayout.topLabelColor,
                                               .font: CustomMessagesCollectionViewFlowLayout.topLabelFont])
    }
    
    //Bottom label height
    func messageBottomLabelHeight(for message: MessageType, at indexPath: IndexPath, in messagesCollectionView: MessagesCollectionView) -> CGFloat {
        
        if self.isNextMessageSameSender(at: indexPath) {
            return 0
        }
        
        return CustomMessagesCollectionViewFlowLayout.bottomLabelInsets.vertical + CustomMessagesCollectionViewFlowLayout.bottomLabelFont.pointSize
    }
    
    //Bottom label content
    func messageBottomLabelAttributedText(for message: MessageType, at indexPath: IndexPath) -> NSAttributedString? {
        return NSAttributedString(string: MessageKitDateFormatter.shared.string(from: message.sentDate),
                                  attributes: [.foregroundColor: CustomMessagesCollectionViewFlowLayout.bottomLabelColor,
                                               .font: CustomMessagesCollectionViewFlowLayout.bottomLabelFont])
    }
    
    //On emoji tapped
    //CustomCellDelegate methods
    func didTapReaction(in cell: MessageCollectionViewCell, emoji: String) {

        guard let indexPath = self.messagesCollectionView.indexPath(for: cell) else {
            print ("Unable to find indexpath for emoji reacted cell")
            return
        }
        
        //Add an tapped animation
        
        let message = self.messages[indexPath.section]
        self.modifyEndorsementsForMessageWith(reactedMessage: message, emoji: emoji)
        
    }
    
    func didTapAvatar(in cell: MessageCollectionViewCell) {
        guard let indexPath = self.messagesCollectionView.indexPath(for: cell) else {
            print ("Unable to find indexpath for emoji reacted cell")
            return
        }
        
        let message = self.messages[indexPath.section]
        let messageSenderId = message.sender.senderId
        TriggerManager.shared?.triggerReactNative(bodyData: messageSenderId)
        
    }
        
    //Still need to register cells
    func didSelectProposalAction(in cell: MessageCollectionViewCell, actionIndex: Int) {
        guard let indexPath = messagesCollectionView.indexPath(for: cell) else {
            print ("Unable to find indexPath of a cell")
            return
        }
        guard let cell = cell as? MessageContentCell else {
            return
        }
        
        let message = messages[indexPath.section]
        var proposal: Proposal?
        switch message.kind {
        case .text, .emoji:
            proposal = message.proposal
        case .attributedText:
            proposal = message.proposal
        case .custom(let data):
            proposal = data as? Proposal
        default:
            return
        }

        if proposal != nil {
            if proposal!.votes[selfSender.senderId] == actionIndex {
                proposal!.votes.removeValue(forKey: selfSender.senderId)
            } else {
                proposal!.votes[selfSender.senderId] = actionIndex
            }
            switch message.kind {
            case .text, .emoji:
                message.proposal = proposal
            case .attributedText:
                message.proposal = proposal
            case .custom:
                message.kind = .custom(proposal)
            default:
                return
            }

            messages.replaceSubrange(Range(NSRange(location: indexPath.row, length: 1))!, with: [message])
            if let cell = cell as? CustomProposalMessageCell {
                cell.setProgressBar(message: message, animated: true)
            }
        }
    }
    
    func didTapThreads(in cell: MessageCollectionViewCell) {
        guard let indexPath = messagesCollectionView.indexPath(for: cell) else {
            print ("Unable to find indexPath of a thread cell")
            return
        }
        
        print ("tapping on threads")
        
//        let message = messages[indexPath.section]
//        if message.messageId == self.parentMessage?.messageId {
//            return
//        }
//
//        let threadsViewController = ThreadsViewController()
//        threadsViewController.parentMessage = message
//        threadsViewController.modalPresentationStyle = .overCurrentContext
//        self.present(threadsViewController, animated: true)
    }
    
    
    
    private func isPreviousMessageSameSender(at indexPath: IndexPath) -> Bool {
        guard indexPath.section - 1 >= 0 else { return false }
        guard indexPath.section < messages.count else  { return false }
        
        //a restricted type (i.e. currentMessageRestrictedType)  is a photo or video (to include other types) which
        //deserves its own bubble
        
        let currentMessage = messages[indexPath.section]
        var currentMessageRestrictedType = false
        let previousMessage = messages[indexPath.section - 1]
        var previousMessageRestrictedType = false
        
        switch currentMessage.kind {
        case .photo(_):
            currentMessageRestrictedType = true
        case .video(_):
            currentMessageRestrictedType = true
        case .custom(_):
            currentMessageRestrictedType = true
        default:
            break
        }
        
        switch previousMessage.kind {
        case .photo(_):
            previousMessageRestrictedType = true
        case .video(_):
            previousMessageRestrictedType = true
        case .custom(_):
            currentMessageRestrictedType = true
        default:
            break
        }
        
        if currentMessage.endorsements != nil {
            currentMessageRestrictedType = true
        }
        
        if previousMessage.endorsements != nil {
            previousMessageRestrictedType = true
        }
        
        if currentMessageRestrictedType || previousMessageRestrictedType {
            return false
        } else {
            return messages[indexPath.section].sender.senderId == messages[indexPath.section - 1].sender.senderId
        }
        
    }
    
    private func isNextMessageSameSender(at indexPath: IndexPath) -> Bool {
        guard indexPath.section + 1 < messages.count else { return false }
        guard indexPath.section < messages.count else  { return false }
        
        let currentMessage = messages[indexPath.section]
        var currentMessageRestrictedType = false
        let nextMessage = messages[indexPath.section + 1]
        var nextMessageRestrictedType = false
        
        switch currentMessage.kind {
        case .photo(_):
            currentMessageRestrictedType = true
        case .video(_):
            currentMessageRestrictedType = true
        case .custom(_):
            currentMessageRestrictedType = true
        default:
            break
        }
        
        switch nextMessage.kind {
        case .photo(_):
            nextMessageRestrictedType = true
        case .video(_):
            nextMessageRestrictedType = true
        case .custom(_):
            currentMessageRestrictedType = true
        default:
            break
        }
        
        if currentMessage.endorsements != nil {
            currentMessageRestrictedType = true
        }
        
        if nextMessage.endorsements != nil {
            nextMessageRestrictedType = true
        }
        
        
        if currentMessageRestrictedType || nextMessageRestrictedType {
            return false
        } else {
            return messages[indexPath.section].sender.senderId == messages[indexPath.section + 1].sender.senderId
        }
        
    }
    
    //The background for the messages, aka message bubble color
    func backgroundColor(for message: MessageType, at indexPath: IndexPath, in messagesCollectionView: MessagesCollectionView) -> UIColor {
        
        //Guard against out of range
        guard indexPath.section < messages.count else {
            if message.sender.senderId == selfSender.senderId {
                return UIColor.init(hex: AppConstants.ChatDesign.MESSAGE_BUBBLE_SELF_COLOR_CODE)
            } else {
                return UIColor.init(hex: AppConstants.ChatDesign.MESSAGE_BUBBLE_OTHER_COLOR_CODE)
            }
        }
        
        let thisMessage = messages[indexPath.section]
        if thisMessage.includedText == "" {
            //keep going here
            switch message.kind {
            case .photo(_):
                return UIColor.clear //a pure photo should not have any background color
            default:
                break
            }
        }
        
        if message.sender.senderId == selfSender.senderId {
            return UIColor.init(hex: AppConstants.ChatDesign.MESSAGE_BUBBLE_SELF_COLOR_CODE)
        } else {
            return UIColor.init(hex: AppConstants.ChatDesign.MESSAGE_BUBBLE_OTHER_COLOR_CODE)
        }
    }
    
    //The color for the texts in the messages
    func textColor(for message: MessageType, at indexPath: IndexPath, in messagesCollectionView: MessagesCollectionView) -> UIColor {
        if message.sender.senderId == selfSender.senderId {
            return .white
        } else {
            return UIColor.init(hex: "bfc0c6") //blue/greyish color
        }
    }
    
    
    //This configures media messages in the chat area
    func configureMediaMessageImageView(_ imageView: UIImageView, for message: MessageType, at indexPath: IndexPath, in messagesCollectionView: MessagesCollectionView) {
        guard let message = message as? Message else {
            print ("Unable to cast message in configureMediaMessageImageView")
            return
        }
        
//       print ("🏞️ Configure setting image \(message.kind) for cell indexpath \(indexPath)")

        switch message.kind {
        case .photo(let photoItem):
            imageView.image = nil
            
            imageView.sd_cancelCurrentImageLoad()
            imageView.sd_setImage(with: photoItem.url,
                                  placeholderImage: UIImage(named: "placeholderPNG")?.withTintColor(.black, renderingMode: .alwaysOriginal),
                                  options: [.retryFailed, .progressiveLoad],
                                  context: [.imageThumbnailPixelSize: CGSize(width: imageView.bounds.width * 2.5, height: imageView.bounds.height * 2.5)],
                                  progress: nil) { image, error, _, url in
                if let error = error as NSError? {
                    if error.domain == SDWebImageErrorDomain && error.code == 2001 {
                        print ("2001 error")
                        let options: SDWebImageOptions = [.progressiveLoad]
                        SDWebImageManager.shared.loadImage(with: photoItem.url,
                                                           options: options,
                                                           context: nil,
                                                           progress: nil) { (image, _, _, _, _, _) in
                            imageView.image = image
                            self.messagesCollectionView.reloadData()
                        }
                    } else {
                        print("Error: \(error.localizedDescription)")
                    }
                }
            }

        case .video(let movieItem):
            //print ("setting the video")
            if let movieURL = movieItem.url {
                
                self.generateThumbnail(from: movieURL) { image in
                    if let thumbnail = image {
                        imageView.image = thumbnail
                    }
                }
            }
        default:
            print ("🌁 Message at \(indexPath) is not an image")
            break
        }
    }
    
    private func grabThumbnailFromMovieWith(movieURL: URL) -> UIImage? {
        let asset = AVAsset(url: movieURL)
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        
        let time = CMTimeMakeWithSeconds(0.0, preferredTimescale: 1)
        
        do {
            let imageRef = try generator.copyCGImage(at: time, actualTime: nil)
            let thumbnail = UIImage(cgImage: imageRef)
            return thumbnail
        } catch let error as NSError {
            print("Error generating thumbnail: \(error)")
            return nil
        }
    }
    
    private func generateThumbnail(from url: URL, completion: @escaping (UIImage?) -> Void) {
        DispatchQueue.global(qos: .background).async {
            let asset = AVAsset(url: url)
            let imageGenerator = AVAssetImageGenerator(asset: asset)
            imageGenerator.appliesPreferredTrackTransform = true
            let time = CMTimeMake(value: 1, timescale: 60)
//            let options = [AVAssetImageGeneratorGenerateCGImagesAsynchronouslyOption: true]

            imageGenerator.generateCGImagesAsynchronously(forTimes: [NSValue(time: time)], completionHandler: { (requestedTime, image, actualTime, result, error) in

                if let image = image {
                    DispatchQueue.main.async {
                        completion(UIImage(cgImage: image))
                    }
                } else {
                    print("Error generating thumbnail: \(error?.localizedDescription ?? "unknown error")")
                }
            })
        }
    }
    
    //Detecting links
    func enabledDetectors(for message: MessageType, at indexPath: IndexPath, in messagesCollectionView: MessagesCollectionView) -> [DetectorType] {
        return [.url]
    }
    
    func detectorAttributes(for detector: DetectorType, and message: MessageType, at indexPath: IndexPath) -> [NSAttributedString.Key : Any] {
        return [.foregroundColor: UIColor.link, .underlineStyle: NSUnderlineStyle.single.rawValue]
    }
    
    
}

// MARK: - Message Cell interaction methods
extension PostDiscussionViewController: MessageCellDelegate {
    func didTapBackground(in cell: MessageCollectionViewCell) {
        print ("Tapped outside message cell")
        self.dismissKeyboard()
        if self.isShowingReplyBar {
            self.dismissReplyViewOnInputBar()
        }
    }
    
    
    //Tapped on regular image
    //onMessage tapped
    func didTapMessage(in cell: MessageCollectionViewCell) {
        
        if isLongPressing {
            isLongPressing = false
            return
        }
        
        guard let indexPath = messagesCollectionView.indexPath(for: cell) else {
            print ("Unable to find indexPath of a cell")
            return
        }
        
        print ("tapping on message of type \(type(of: cell))")
        
        
        let message = messages[indexPath.section]
        switch message.kind {
        case .photo(let mediaItem):
            guard let photoURL = mediaItem.url else {
                return
            }
            
            //Show VC with photoUrl
            let photoViewerVC = PhotoViewerViewController(imageURL: photoURL)
            present(photoViewerVC, animated: true)
            
        case .video(let mediaItem):
            guard let videoURL = mediaItem.url else {
                return
            }
            
            //Show VC with videoUrl
            let playerViewController = AVPlayerViewController()
            playerViewController.player = AVPlayer(url: videoURL)
            present(playerViewController, animated: true) {
                playerViewController.player?.play()
            }
        case .custom(let data):
            if let postData = data as? Post {
                let refPath = postData.ref.path
                print ("Tapping on post with ref path \(refPath)")
                
                //self.showPostDiscussionViewController(refPath: refPath, firstMessage: message)
            }
        default:
            break
        }
        
    }
    
    func didSelectURL(_ url: URL) {
        self.present(SFSafariViewController(url: url), animated: true)
    }
    
//    func showPostDiscussionViewController(refPath: String, firstMessage: Message) {
//        let postDiscussionVC = PostDiscussionViewController()
//        postDiscussionVC.modalPresentationStyle = .fullScreen
//        postDiscussionVC.transitioningDelegate = self
//        postDiscussionVC.refPath = refPath
//        postDiscussionVC.firstPostMessage = firstMessage
//        present(postDiscussionVC, animated: true, completion: nil)
//    }
    
    //Tapped on image or video message
    func didTapImage(in cell: MessageCollectionViewCell) {
        
        if isLongPressing {
            isLongPressing = false
            return
        }
        
        guard let indexPath = messagesCollectionView.indexPath(for: cell) else {
            print ("Unable to find indexPath of a cell")
            return
        }
        
        let message = messages[indexPath.section]
        
        switch message.kind {
        case .photo(let mediaItem):
            print ("📸 Tapping on a photo message")
            guard let photoURL = mediaItem.url else {
                return
            }
            
            //Show VC with photoUrl
            let photoViewerVC = PhotoViewerViewController(imageURL: photoURL)
            present(photoViewerVC, animated: true)
            
        case .video(let mediaItem):
            print ("🎥 Tapping on a video message")
            
            guard let videoURL = mediaItem.url else {
                return
            }
            
            let playerViewController = AVPlayerViewController()
            playerViewController.player = AVPlayer(url: videoURL)
            present(playerViewController, animated: true) {
                playerViewController.player?.play()
            }
            
        default:
            break
        }
        
    }
    
    
    
}


// MARK: - Text inputbar methods
extension PostDiscussionViewController: InputBarAccessoryViewDelegate {
    
    //When hitting the "Send" button
    //Onsend on send button
    func inputBar(_ inputBar: InputBarAccessoryView, didPressSendButtonWith text: String) {
        
        guard !text.replacingOccurrences(of: " ", with: "").isEmpty ||
                !attachmentsDataSource.attachments.isEmpty else {
            print ("Returning because no text OR no attachment")
            return
        }
        
        let repliedMessage = self.longPressedSelection //AZ needs to name this variable to something more reflective
        self.sendMessageWith(text: text,
                             repliedToMessage: repliedMessage)
    }
    
    
    func inputBar(_ inputBar: InputBarAccessoryView, didChangeIntrinsicContentTo size: CGSize) {
        print ("⚠️ scrollToLatestMessage from didChangeIntrinsicContentTo")
        self.scrollToLatestMessage(delayInMiliseconds: 100)
    }
    

    private func sendMessageWith(text: String,
                                 repliedToMessage: Message?) {

        
        //ensure that chatDocPath matches
        let currentChatPath = UserManager.shared.currentChatDocPath
        

        
        //If there is no attachment, send the text based message (inclusive of replies)
        if attachmentsDataSource.attachments.isEmpty {
            FirestoreManager.shared.sendMessageWith(text: text,
                                                    repliedToMessage: repliedToMessage,
                                                    chatDocPath: currentChatPath) { [weak self] success in
                if success {
                    print ("successfully sent message")
                    
                    //After successfully sending the message, clear the input textview
                    self?.performAfterSendMessageCleanUp()
                }
            }
        } else {
            //Initialize upload
            uploadingProgresBar.progress = 0.0
            self.isUploading = true
            var barProgress: Float = 0.0
            var cleanedUploadURLs = [URL]()
            let dispatchGroup = DispatchGroup()
            let debouncer = Debouncer(delay: 0.5)

            UIView.animate(withDuration: 0.1) {
                self.uploadingProgresBar.alpha = 1.0
            }

            print("📸 About to start upload with \(attachmentsDataSource.attachments.count) assets")

            for image in attachmentsDataSource.attachments {
                dispatchGroup.enter()

                AWSManager.shared.uploadImagesToS3WithProgress(images: [image]) { progress in
                    barProgress = progress
                    self.uploadingProgresBar.progress = barProgress
                    print("📸⬆️ the actual progress is \(barProgress)")
                } completionBlock: { success, urls, error in
                    if success {
                        if let receivedURL = urls.first {
                            if let cleanedURL = self.cleanUpURL(urlToClean: receivedURL) {
                                cleanedUploadURLs.append(cleanedURL)
                            } else {
                                // If unable to clean
                                cleanedUploadURLs.append(receivedURL)
                            }
                        }
                    } else {
                        // print(error?.localizedDescription)
                    }

                    dispatchGroup.leave()
                }
            }

            dispatchGroup.notify(queue: .main) {
                self.isUploading = false

                // Fully finished load
                print("📸 Finished upload with full URLs and dimensions \(cleanedUploadURLs)")

                SDWebImagePrefetcher.shared.prefetchURLs(cleanedUploadURLs) { _, _ in
                    debouncer.call {
                        self.sendBatchMessagesWithMedia(batchUrls: cleanedUploadURLs, lastText: text, lastRepliedMessage: repliedToMessage)
                    }
                }
            }
        } //end of else block for processing attachments
        
    }
    
    private func sendBatchMessagesWithMedia(batchUrls: [URL],
                                       lastText: String,
                                       lastRepliedMessage: Message?) {
        
        let currentChatPath = UserManager.shared.currentChatDocPath
        
        print ("📸 Finished upload, sending \(batchUrls.count) messages")
        
        for (index, mediaUrl) in batchUrls.enumerated() {
            // Do something with the media URL
            
            if index == batchUrls.count - 1 {
                // This is the last item in the array
                // Do something special for the last item
                
                FirestoreManager.shared.sendMessageWith(text: lastText,
                                                        repliedToMessage: lastRepliedMessage,
                                                        mediaUrl: mediaUrl.absoluteString,
                                                        chatDocPath: currentChatPath) { finished in
                    
                    print ("📸Sent the image with the reply")
                    self.performAfterUploadCleanUp()
                    
                }
                
            } else {
                FirestoreManager.shared.sendMessageWith(text: "",
                                                        repliedToMessage: lastRepliedMessage,
                                                        mediaUrl: mediaUrl.absoluteString,
                                                        chatDocPath: currentChatPath) { finished in
                    print ("📸Sent an image")
                }
            }
        }
    }
    
    private func cleanUpURL(urlToClean: URL) -> URL? {
        let urlString = urlToClean.absoluteString // convert URL to string
        let parts = urlString.split(separator: "?")
        let baseUrlString = String(parts[0])
        return URL(string: baseUrlString)
    }
    
    private func performAfterSendMessageCleanUp() {
        DispatchQueue.main.async {
            self.clearTextInputBar() //should also clear reply, if any
            self.scrollToLatestMessage(delayInMiliseconds: 100, animated: true)
        }
    }
    private func performAfterUploadCleanUp() {
        //you can delay the entire method too
        DispatchQueue.main.async {
            self.isUploading = false
            self.messageInputBar.inputTextView.text = ""
            self.attachmentsDataSource.removeAllAttachments()
            self.uploadingProgresBar.progress = 0
            AWSManager.shared.cleanStoredImageInfo()
            
            UIView.animate(withDuration: 0.1) {
                self.uploadingProgresBar.alpha = 0.0
            }
            if self.isShowingReplyBar {
                self.dismissReplyViewOnInputBar()
            }
            
            self.messagesCollectionView.reloadData()
//            print ("doing trickery")
//            let indexPath = IndexPath(row: 0, section: 30)
//            self.messagesCollectionView.scrollToItem(at: indexPath, at: .right, animated: true)
            self.scrollToLatestMessage(delayInMiliseconds: 10, animated: true)
            
            //self.scrollToLatestMessage(delayInMiliseconds: 100, animated: true)
        }
        
    }
    
    private func clearTextInputBar() {
        self.messageInputBar.inputTextView.text = ""
        self.longPressedSelection = nil //clears reply
        if isShowingReplyBar {
            print ("⚠️ Also dismissing the reply view controller")
            dismissReplyViewOnInputBar()
        }
    }
    
}

// MARK: - Text view interaction methods
extension PostDiscussionViewController: UITextViewDelegate {
    func textViewDidBeginEditing(_ textView: UITextView) {
        print("⚠️ scrollToLatestMessage text editing")
        
        //Wait a hot tiff, and then scroll to latest message
        self.scrollToLatestMessage(delayInMiliseconds: 400)
    }
}

extension PostDiscussionViewController: UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    
    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
    }
    
    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
        picker.dismiss(animated: true)
        
        
        //If its an image
        //        if let image = info[.editedImage] as? UIImage,
        //           let imageData = image.pngData() {
        //            //Upload photo
        //        } else if let videolUrl = info[.mediaURL] as? URL {
        //            //Upload video
        //        }
        
        //Upload image AZ
        //Upload image function
        
        
        
        
    }
}

extension PostDiscussionViewController: ChatBottomMediaSelectionDelegate {
    func didTapMediaView(_ view: UIView) {
        print ("view tag \(view.tag) from delegate method")
        if view.tag == AppConstants.ViewDesignations.BOTTOM_MEDIA_PHOTO_LIBRARY {
            print ("Want to see photo library")
            
            //First, dismiss the current view controller
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.0) {
                self.presentedViewController?.dismiss(animated: true, completion: {
                    //Then, present the other view controller
                    self.dismissKeyboard()
                    self.hideInputBar()
                    self.getPhotoFromPhotoLibrary()
                })
            }
        } else if view.tag == AppConstants.ViewDesignations.BOTTOM_MEDIA_SELECT_VIDEO {
            print ("Want to see video library")
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.0) {
                self.presentedViewController?.dismiss(animated: true, completion: {
                    //Then, present the other view controller
                    self.dismissKeyboard()
                    self.hideInputBar()
                    self.getVideoFromLibrary()
                })
            }
        }
    }
    
    //For photo like image picker, go to getPhotoFromPhotoLibrary
    func attachImages(_ images: [UIImage]) {
        print ("Attaching images \(images) which are")
        //Dismiss the bottom sheet view controller
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.0) {
            self.presentedViewController?.dismiss(animated: true, completion: {
                //For upload, enable the send button if images are attached
                if images.count > 0 {
                    self.setAttachmentImages(images)
                    self.messageInputBar.sendButton.isEnabled = true //if there is attachments, automatically enable the send button
                }
            })
        }
    }
    
    //Used by both chatBottomMediaSelectionDelegate and getPhotoFromPhotoLibrary
    private func setAttachmentImages(_ images: [UIImage], originalImages: [UIImage]? = nil) {
        attachmentsDataSource.attachments.removeAll()
        if let ogImages = originalImages {
            attachmentsDataSource.attachments.append(contentsOf: ogImages)
        } else {
            attachmentsDataSource.attachments.append(contentsOf: images)
        }
        
        attachmentsCollectionView.reloadData()
        
        DispatchQueue.global().async {
//            Thread.sleep(forTimeInterval: 0.05)
            DispatchQueue.main.async {
                for cell in self.attachmentsCollectionView.visibleCells {
                    cell.alpha = 0.0
                }
                UIView.animate(withDuration: 0.3) {
                    self.attachmentsCollectionView.superview?.isHidden = false
                } completion: { _ in
                    UIView.animate(withDuration: 0.3) {
                        for cell in self.attachmentsCollectionView.visibleCells {
                            cell.alpha = 1.0
                        }
                    }
                }
            }
        }
    }
}

extension PostDiscussionViewController: ChatBottomSelectionDelegate {
    
    func didTapView(_ view: UIView) {
        if view.tag == AppConstants.ViewDesignations.BOTTOM_SHEET_REPLY_OPTION {
            print ("Want to reply")
            self.onReplyTapped()
        }
    }
    
    //New delegate function for showing emojis
    func didSelectEmoji(_ emoji: String, induceWaiting: Bool) {
        //
        print ("Selected \(emoji)")
        var waitTime = 0.0
        if induceWaiting { //the induced waiting is to successfully dismiss the bottomSheet after the emoji picker is dismissed
            waitTime = 0.3
        }
        
        if let reactedMessage = self.longPressedSelection {
            self.modifyEndorsementsForMessageWith(reactedMessage: reactedMessage, emoji: emoji)
            self.longPressedSelection = nil
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + waitTime) {
            self.presentedViewController?.dismiss(animated: true, completion: {
            })
        }
    }
    
    private func modifyEndorsementsForMessageWith(reactedMessage: Message, emoji: String) {
        
        
        print ("Modifying message \(reactedMessage.includedText) with emoji \(emoji)")
        
        if let endorsements = reactedMessage.endorsements {
            let reactions = endorsements.reactions
            var updatedReactions = reactions
            if reactions.keys.contains(emoji) {
                //Emoji selection contains this emoji. Determine if user has already reacted or add to emoji reactions
                
                //Gets the list of users reacted to this emoji
                if let usersReacted = reactions[emoji] {
                    var updatedUsersReacted = usersReacted //The updated list of users who reacted to this particular emoji
                    
                    if usersReacted.contains(UserManager.shared.currentUserId) {
                        //User has already reacted, remove this user from the emoji's reactors
                        if let index = usersReacted.firstIndex(of: UserManager.shared.currentUserId) {
                            updatedUsersReacted.remove(at: index)
                        } else {
                            print ("Should not exist as confirmed by usersReacted.contains if statement")
                        }
                        
                    } else {
                        //Users has not reacted with this emoji. Add user's list to the list of emoji reactors
                        updatedUsersReacted.append(UserManager.shared.currentUserId)
                    }
                    
                    updatedReactions[emoji] = updatedUsersReacted //➡️ added or removed user from list of existing emoji reactions
                    
                } else {
                    print ("This should not exist. Keys contains this emoji, thus should cast successfully")
                }
            } else {
                //Existing reactions are there, but do not contain this particular emoji. Add user and their emoji reaction
                updatedReactions[emoji] = [UserManager.shared.currentUserId] //➡️ added emoji and user's reaction to emoji reactions
            }
            
            let updatedEmojiReactionData = EmojiReactionData(reactions: updatedReactions)
            reactedMessage.endorsements = updatedEmojiReactionData
            
            
            
        } else {
            //No endorsements at all. Set the reaction and add the endorsement. Updated message
            reactedMessage.endorsements = EmojiReactionData(reactions: [emoji: [UserManager.shared.currentUserId]]) //➡️ updated with new info to pass back to Firestore
        }
        
        //update the reacted message
        let currentChatPath = UserManager.shared.currentChatDocPath
    
        FirestoreManager.shared.updateMessageWithReactions(message: reactedMessage, chatDocPath: currentChatPath) { success in
            if !success {
                print ("Unable to update message with reaction: \(emoji)")
            }
        }

        
    }
    
    
    private func onReplyTapped() {
        guard let repliedMessage = self.longPressedSelection else {
            print ("Did not find a message to reply to") //AZ add additional considerations for photo messages
            return
        }

        //1. Dismiss the bottom sheet
        //2. Show extend the reply
        presentedViewController?.dismiss(animated: true, completion: {
            
        })
        
        //If not showing the reply bar
        if !self.isShowingReplyBar {
//            print ("Did not find reply bar, replying to \(repliedMessage.includedText)")
            self.showReplyViewOnInputBar(repliedMessage: repliedMessage)
        } else {
            //update the reply bar message
//            print ("Found reply bar, updating with \(repliedMessage.includedText)")
            self.updateReplyInfoForExistingReplyBar(repliedMessage: repliedMessage)
        }
        
        self.becomeFirstResponder()
    }
}


//Methods that are triggered from the React Native side
extension PostDiscussionViewController {
    private func setupNotificationObservers() {

        NotificationCenter.default.addObserver(self, selector: #selector(chatScreenRendered(_:)), name: Notification.Name("chatScreenRendered"), object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(sideBarRendered), name: Notification.Name("sideBarRendered"), object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(sideBarRemoved), name: Notification.Name("sideBarRemoved"), object: nil)
    }
    
    //This method is not called during initial app open for a signed in user, but when the channel is changed
    @objc func chatScreenRendered(_ notification: Notification) {
        if let userInfo = notification.userInfo, let chatDocPath = userInfo["chatDocPath"] as? String {
            print ("Received chat doc path \(chatDocPath) in native view is")
            
            // This evaluates whether it is a new chatDocPath (i.e. new room)
            // And then removes and updates the listner, and then refreshes the view
            if UserManager.shared.currentChatDocPath != chatDocPath {
                self.updateToNewChatRoom(chatDocPath: chatDocPath)
            }
        }
        
        DispatchQueue.main.async {
            self.showInputBar(scrollToBottom: true)
        }
    }
    
    private func updateToNewChatRoom(chatDocPath: String) {

        //1. Update UserManager current room to new room
        UserManager.shared.currentChatDocPath = chatDocPath
        
        //2. Stop the listner associated with the previous chatPath
        FirestoreManager.shared.currentMessagesListner?.remove()
        
        //3. Remove all the messages
        self.messages.removeAll()
        
        //3.5 Update the first time refresh token
        self.firstTimeRefreshed = false
        
        //4. Update the listener, which will also update to a new room
        self.retrieveMessagesAndStartListener()

    }
    
    //This is called when the side bar is shown
    @objc func sideBarRendered() {
        DispatchQueue.main.async {
            print ("Side bar shown, get rid of keybaord and hide input bar")
            self.dismissKeyboard()
            self.hideInputBar()
        }
    }
    
    private func hideInputBar() {
        if self.messageInputBar.alpha > 0.1 { //if the alpha is not 0, but given some room here using 0.1
            NSLog("🐵 Calling hide input bar because self.messageInputBar.alpha is \(self.messageInputBar.alpha)")
            UIView.animate(withDuration: 0.1) {
                self.messageInputBar.alpha = 0.0
            }
        }
        
    }
    
    @objc func sideBarRemoved() {
        DispatchQueue.main.async {
            print ("showing keyboard")
            self.unHideInputBar()
        }
    }
    
    private func unHideInputBar() {
        
        if !hasShownInputBarAlready {
            NSLog("🐵 Calling unhide input bar toggling hasShown to true")
            hasShownInputBarAlready = true
            self.showInputBar(scrollToBottom: true) //Workaround for MessageKit in a ChildViewController
        } else {
            NSLog("🐵 Calling unhide input bar with regular animation")
            UIView.animate(withDuration: 0.1) {
                self.messageInputBar.alpha = 1.0
            }

        }
    }
}


extension PostDiscussionViewController {
    @objc func goBack() {
        // Dismiss the modal view controller
        self.firstPostMessage?.showFullPostMessage = false
        self.dismiss(animated: true, completion: nil)
    }
    
    private func addNavBar() {
        // Create a UIView to act as your custom navigation bar
        let navBar = UIView(frame: CGRect(x: 0, y: 0, width: view.frame.width, height: 80 + view.safeAreaInsets.top))
        navBar.backgroundColor = messagesCollectionView.backgroundColor // set the same background color as messagesCollectionView
        
        // Create a back button to add to the custom navigation bar
        let backButton = UIButton(type: .system)
        let buttonImage = UIImage(systemName: "chevron.left")?.withTintColor(.white, renderingMode: .alwaysOriginal)
        backButton.setImage(buttonImage, for: .normal)
        backButton.addTarget(self, action: #selector(goBack), for: .touchUpInside)
        navBar.addSubview(backButton)
        
        // Position the back button on the left side of the custom navigation bar
        backButton.translatesAutoresizingMaskIntoConstraints = false
        backButton.leadingAnchor.constraint(equalTo: navBar.leadingAnchor, constant: 8).isActive = true
        backButton.widthAnchor.constraint(equalToConstant: 44).isActive = true
        backButton.heightAnchor.constraint(equalToConstant: 44).isActive = true
        backButton.centerYAnchor.constraint(equalTo: navBar.centerYAnchor, constant: (((80-44) + view.safeAreaInsets.top))/2).isActive = true
        
        // Add the custom navigation bar to your view controller's view
        view.addSubview(navBar)
        view.bringSubviewToFront(navBar)
    }
}
