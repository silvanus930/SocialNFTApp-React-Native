//
//  CustomExtension.swift
//  Persona
//
//  Created by Allan Zhang on 2/20/23.
//

import MessageKit

//With tuplized ordering
extension MessageContentCell {
    var extraViews: UIStackView {
        get {
            if let extraViews = contentView.viewWithTag(AppConstants.ViewDesignations.EXTRA_VIEWS_TAG) as? UIStackView {
                return extraViews
            }
            
            let reactionsView = UIStackView(arrangedSubviews: [])
            reactionsView.translatesAutoresizingMaskIntoConstraints = false
            reactionsView.axis = .vertical
            reactionsView.alignment = .leading

            let threadsButton = UIButton()
            threadsButton.translatesAutoresizingMaskIntoConstraints = false
            threadsButton.tintColor = UIColor.white // Allan: button tint color
            threadsButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 14) // Allan: button title font
            threadsButton.setImage(UIImage(systemName: "message"), for: .normal)
            threadsButton.setTitle(" 0 Threads", for: .normal)
            threadsButton.addTarget(self, action: #selector(onTapThreads), for: .touchUpInside)
            threadsButton.heightAnchor.constraint(equalToConstant: AppConstants.ViewStandards.THREADS_BUTTON_HEIGHT).isActive = true

            let extraViews = UIStackView(arrangedSubviews: [reactionsView, threadsButton])
            extraViews.translatesAutoresizingMaskIntoConstraints = false
            extraViews.axis = .vertical
            extraViews.alignment = .leading
            extraViews.tag = AppConstants.ViewDesignations.EXTRA_VIEWS_TAG
            return extraViews
        }
    }
    
    var reactionsView: UIStackView {
        get {
            return extraViews.arrangedSubviews[0] as! UIStackView
        }
    }
    
    var threadsButton: UIButton {
        get {
            return extraViews.arrangedSubviews[1] as! UIButton
        }
    }
    
    func setupExtraViews() {
        let extraViews = self.extraViews
        contentView.addSubview(extraViews)
        
        NSLayoutConstraint.activate([
            extraViews.leadingAnchor.constraint(equalTo: messageContainerView.leadingAnchor),
            extraViews.trailingAnchor.constraint(equalTo: messageContainerView.trailingAnchor),
            extraViews.topAnchor.constraint(equalTo: messageContainerView.bottomAnchor, constant: 4)
        ])
    }
    
    func prepareExtraViewsForReuse() {
        reactionsView.isHidden = true
        for subview in reactionsView.arrangedSubviews {
            reactionsView.removeArrangedSubview(subview)
            subview.removeFromSuperview()
        }
        
        threadsButton.isHidden = true
    }
    
    func configureExtraViews(with message: MessageType, at indexPath: IndexPath, and messagesCollectionView: MessagesCollectionView) {
        guard let dataSource = messagesCollectionView.messagesDataSource else {
            return
        }

        // Updated by Allan: reactions alignment
        let isFromCurrentSender = dataSource.isFromCurrentSender(message: message)
        if let reactions = MessageContentCell.generateReactionsView(for: message,
                                                                    maxWidth: messageContainerView.bounds.width,
                                                                    alignment: isFromCurrentSender ? .trailing : .leading) {
            reactionsView.isHidden = false
            reactionsView.alignment = isFromCurrentSender ? .trailing : .leading
            reactionsView.addArrangedSubview(reactions)

            for row in reactions.arrangedSubviews {
                if let row = row as? UIStackView {
                    for itemView in row.arrangedSubviews {
                        if let itemButton = itemView as? UIButton {
                            itemButton.addTarget(self, action: #selector(onTapEmoji), for: .touchUpInside)
                        }
                    }
                }
            }
        } else {
            reactionsView.isHidden = true
        }
        
        let threadsCount = ((message as? Message)?.threadMessages ?? []).count
        threadsButton.isHidden = (threadsCount == 0)
        threadsButton.setTitle(" \(threadsCount) Threads", for: .normal)
    }

    
    @IBAction func onTapEmoji(_ sender: UIButton) {
        if let title = sender.title(for: .normal) {
            (self.delegate as? CustomCellDelegate)?.didTapReaction(in: self, emoji: String(title.prefix(1)))
        }
    }
    
    @IBAction func onTapThreads(_ sender: UIButton) {
        (self.delegate as? CustomCellDelegate)?.didTapThreads(in: self)
    }


    class func generateReactionsView(for message: MessageType, maxWidth: CGFloat, alignment: UIStackView.Alignment) -> UIStackView? {
        // calculate the reactions part
        if let message = message as? Message,
           let endorsements = message.endorsements,
           !endorsements.reactions.isEmpty {
            
            let parentView = UIStackView()
            parentView.translatesAutoresizingMaskIntoConstraints = false
            parentView.axis = .vertical
            parentView.alignment = alignment
            parentView.spacing = 4
            
            // Get the emojis and counts as an array of tuples
            var reactions: [(emoji: String, count: Int)] = []
            for (key, value) in endorsements.reactions {
                reactions.append((emoji: key, count: value.count))
            }
            
            // Sort the array based on the count of reactions, then alphabetically
            reactions.sort { ($0.count, $0.emoji) > ($1.count, $1.emoji) }
            
            var rowView: UIStackView?
            var tag = 0
            for reaction in reactions {
                let emoji = reaction.emoji
                let count = reaction.count
                if count == 0 {
                    tag += 1
                    continue
                }
                
                let itemButton = UIButton(type: .custom)
                itemButton.translatesAutoresizingMaskIntoConstraints = false
                itemButton.setContentHuggingPriority(.defaultHigh, for: .horizontal)
                itemButton.setContentHuggingPriority(.defaultHigh, for: .vertical)
                itemButton.setTitle("\(emoji) \(count)", for: .normal)
                itemButton.titleLabel?.font = CustomCell1.reactionFont
                itemButton.contentEdgeInsets = .init(top: 4, left: 8, bottom: 4, right: 8)
                itemButton.layer.cornerRadius = 10
                itemButton.clipsToBounds = true
                itemButton.backgroundColor = UIColor(hex: AppConstants.ChatDesign.INPUTBAR_BACKGROUND_COLOR_CODE)
                itemButton.layer.borderColor = UIColor.clear.cgColor
                itemButton.tag = tag
                
                if rowView == nil {
                    rowView = UIStackView()
                    rowView?.axis = .horizontal
                    rowView?.spacing = 4
                    rowView?.alignment = .trailing
                    parentView.addArrangedSubview(rowView!)
                }
                rowView?.addArrangedSubview(itemButton)
                rowView?.layoutIfNeeded()
                
                if rowView!.arrangedSubviews.count > 1 && rowView!.bounds.width > maxWidth {
                    // Line break
                    rowView?.removeArrangedSubview(itemButton)
                    itemButton.removeFromSuperview()
                    
                    rowView = UIStackView()
                    rowView?.axis = .horizontal
                    rowView?.alignment = .trailing
                    rowView?.spacing = 4
                    parentView.addArrangedSubview(rowView!)
                    rowView?.addArrangedSubview(itemButton)
                }
                tag += 1
            }
            
            return parentView
        }
        return nil
    }
}


extension MessageSizeCalculator {
    static var cachedReactionsSizes: [String: [CGFloat: CGSize]] = [:]
    static var cachedMessageSizes: [String: [CGFloat: CGSize]] = [:]
    
    static var cachedPostSizes: [String: [CGFloat: CGSize]] = [:]
    static var cachedPostDates: [String: Date] = [:]
    
    class func calculateReactionsViewSize(for message: MessageType, maxWidth: CGFloat) -> CGSize {
        // calculate the reactions part
        if let message = message as? Message,
           let endorsements = message.endorsements,
           !endorsements.reactions.isEmpty {
            
            var result: CGSize = .zero
            var row: CGSize = .zero
            
            let reactions = endorsements.reactions.map({ (key: String, value: [String]) in
                return (key, value.count)
            })
            let key = reactions.map({ (key, value) in
                return "\(key)\(value)"
            }).joined(separator: ",")
            if let sizes = cachedReactionsSizes[key],
               let size = sizes[maxWidth] {
                return size
            }
            
            for (emoji, count) in reactions {
                if count == 0 {
                    continue
                }
                
                let attributedText = NSAttributedString(string: "\(emoji) \(count)",
                                                        attributes: CustomCell1.messageAttributes(font: CustomCell1.reactionFont, textColor: nil))
                var size = CustomCell1SizeCalculator.labelSize(for: attributedText, considering: maxWidth)
                size = CGSize(width: size.width + 16, height: size.height + 8)
                
                if row == .zero {
                    row = size
                } else {
                    if row.width + size.width + 4 > maxWidth {
                        result.width = max(result.width, row.width)
                        result.height += (result.height == 0) ? row.height : (row.height + 4)
                        
                        row = .zero
                    }
                    
                    row.width += (row.width == 0) ? size.width : (size.width + 4)
                    row.height = max(row.height, size.height)
                }
            }
            
            if row.width > 0 {
                result.width = max(result.width, row.width)
                result.height += (result.height == 0) ? row.height : (row.height + 4)
            }
            
            var sizes = cachedReactionsSizes[key] ?? [:];
            sizes[maxWidth] = result
            cachedReactionsSizes[key] = sizes
            
            return result
        }
        return .zero
    }
    
    class func removeCache(for message: MessageType, maxWidth: CGFloat?) {
        if let maxWidth = maxWidth {
            var sizes = cachedMessageSizes[message.messageId] ?? [:]
            sizes.removeValue(forKey: maxWidth)
            cachedMessageSizes[message.messageId] = sizes
        } else {
            cachedMessageSizes.removeValue(forKey: message.messageId)
        }
    }
    
    class func cacheSize(for message: MessageType, maxWidth: CGFloat, size: CGSize) {
        var sizes = cachedMessageSizes[message.messageId] ?? [:]
        sizes[maxWidth] = size
        cachedMessageSizes[message.messageId] = sizes
    }
    
    class func cachedSize(for message: MessageType, maxWidth: CGFloat) -> CGSize? {
        return cachedMessageSizes[message.messageId]?[maxWidth]
    }
    
    
    class func calculatePostSize(for post: Post, maxWidth: CGFloat, messageLabelFont: UIFont) -> CGSize {
        if cachedPostDates[post.id] != post.editDate {
            cachedPostSizes.removeValue(forKey: post.id)
            cachedPostDates[post.id] = post.editDate
        }
        
        if let cache = cachedPostSizes[post.id]?[maxWidth] {
            return cache
        } else {
            let text = NSAttributedString(string: post.text, attributes: [.font: messageLabelFont])
            let size = CustomCell1SizeCalculator.labelSize(for: text, considering: maxWidth)

            print("\(post.id), \(maxWidth), \(size)")

            var sizes = cachedPostSizes[post.id] ?? [:]
            sizes[maxWidth] = size
            cachedPostSizes[post.id] = sizes
            
            return size
        }
    }
}

extension UIEdgeInsets {
    var vertical: CGFloat {
        return top + bottom
    }
    
    var horizontal: CGFloat {
        return left + right
    }
}

extension HorizontalEdgeInsets {
    var horizontal: CGFloat {
        return left + right
    }
}
