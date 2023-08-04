//
//  ChatBottomSelectionViewController.swift
//
//  Created by Allan Zhang on 2/3/23.
//

import UIKit
import EmojiPicker

protocol ChatBottomSelectionDelegate: AnyObject {
    func didTapView(_ view: UIView)
    func didSelectEmoji(_ emoji: String, induceWaiting: Bool) //induced waiting to slow down the animation
}

class ChatBottomSelectionViewController: UIViewController {
    
    weak var delegate: ChatBottomSelectionDelegate?
    
    let circleEmojiStackView = UIStackView()
    let bottomContainerView1 = UIView()
    let bottomContainerView2 = UIView()
    let bottomContainerView3 = UIView()
    let emojis = ["❤️", "👍", "🔥", "💯", "👋", "➕"]
    let sizeOfCell = 40.0
    
    let collectionView = UICollectionView(frame: .zero, collectionViewLayout: UICollectionViewFlowLayout())
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Do any additional setup after loading the view.
        self.view.backgroundColor = .clear
        let blurEffect = UIBlurEffect(style: .dark)
        let visualEffectView = UIVisualEffectView(effect: blurEffect)
        visualEffectView.frame = view.bounds
        visualEffectView.alpha = 1.0
        view.addSubview(visualEffectView)
        view.isUserInteractionEnabled = true
        
        self.setupEmojisView()
        self.setupBottomContainerViews()
        
    }
    
    private func setupEmojisView() {
        // Set up CollectionView
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        collectionView.backgroundColor = .clear
        collectionView.register(EmojiCell.self, forCellWithReuseIdentifier: "EmojiCell")
        collectionView.dataSource = self
        collectionView.delegate = self

        view.addSubview(collectionView)

        // Add constraints for CollectionView
        NSLayoutConstraint.activate([
            collectionView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20.0),
            collectionView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            collectionView.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.75),
            collectionView.heightAnchor.constraint(equalToConstant: 44)
        ])
    }
    
    @objc func emojiTapped(_ gestureRecognizer: UITapGestureRecognizer) {
        let tappedView = gestureRecognizer.view
        print ("tapped on view \(tappedView?.tag)")
    }
    
    @objc func tappedOnStackView(_ gestureRecognizer: UITapGestureRecognizer) {
        print ("tapping on stack view")
        guard let parentView = gestureRecognizer.view else {
            print ("no view from the tap gesture found")
            return
        }
        let tapLocation = gestureRecognizer.location(in: parentView)
        print ("tap location: \(tapLocation)")
        
        for subview in parentView.subviews {
            if subview.frame.contains(tapLocation) {
                print ("subview \(subview.tag) found for location")
            }
        }
        
    }
    
    @objc func tappedOnCircleView() {
        print ("tapping on circle view")
    }
    
    
    private func setupBottomContainerViews() {
        // Set up BottomContainerView1
        bottomContainerView1.translatesAutoresizingMaskIntoConstraints = false
        bottomContainerView1.backgroundColor = UIColor(hex: AppConstants.ChatDesign.CHAT_BACKGROUND_COLOR_CODE)
        bottomContainerView1.layer.cornerRadius = 8.0
        
        view.addSubview(bottomContainerView1)
        bottomContainerView1.tag = AppConstants.ViewDesignations.BOTTOM_SHEET_REPLY_OPTION
        self.addImageViewAndLabelToParentView(parentView: bottomContainerView1, iconImageName: "arrowshape.turn.up.left.fill", iconLabel: "Reply message")
        
        // Set up BottomContainerView2
        bottomContainerView2.translatesAutoresizingMaskIntoConstraints = false
        bottomContainerView2.backgroundColor = UIColor(hex: AppConstants.ChatDesign.CHAT_BACKGROUND_COLOR_CODE)
        bottomContainerView2.layer.cornerRadius = 8.0
        
        view.addSubview(bottomContainerView2)
        bottomContainerView2.tag = AppConstants.ViewDesignations.BOTTOM_SHEET_COPY_OPTION
        self.addImageViewAndLabelToParentView(parentView: bottomContainerView2, iconImageName: "doc.on.doc", iconLabel: "Copy message")
        
        // Set up BottomContainerView3
        bottomContainerView3.translatesAutoresizingMaskIntoConstraints = false
        bottomContainerView3.backgroundColor = UIColor(hex: AppConstants.ChatDesign.CHAT_BACKGROUND_COLOR_CODE)
        bottomContainerView3.layer.cornerRadius = 8.0
        
        view.addSubview(bottomContainerView3)
        bottomContainerView3.tag = AppConstants.ViewDesignations.BOTTOM_SHEET_EDIT_OPTION
        self.addImageViewAndLabelToParentView(parentView: bottomContainerView3, iconImageName: "rectangle.and.pencil.and.ellipsis", iconLabel: "Edit message")
        
        // Add constraints for BottomContainerViews
        let bottomContainerHeight: CGFloat = 60.0
        let containerWidthMultiplier: CGFloat = 0.9
        NSLayoutConstraint.activate([
            bottomContainerView1.topAnchor.constraint(equalTo: collectionView.bottomAnchor, constant: 10.0),
            bottomContainerView1.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            bottomContainerView1.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: containerWidthMultiplier),
            bottomContainerView1.heightAnchor.constraint(equalToConstant: bottomContainerHeight),
            
            bottomContainerView2.topAnchor.constraint(equalTo: bottomContainerView1.bottomAnchor, constant: 10.0),
            bottomContainerView2.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            bottomContainerView2.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: containerWidthMultiplier),
            bottomContainerView2.heightAnchor.constraint(equalToConstant: bottomContainerHeight),
            
            bottomContainerView3.topAnchor.constraint(equalTo: bottomContainerView2.bottomAnchor, constant: 10.0),
            bottomContainerView3.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            bottomContainerView3.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: containerWidthMultiplier),
            bottomContainerView3.heightAnchor.constraint(equalToConstant: bottomContainerHeight)
        ])
        
        // Add gesture recognizer to bottomContainerView1
        let tapGestureRecognizer1 = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        bottomContainerView1.addGestureRecognizer(tapGestureRecognizer1)

        // Add gesture recognizer to bottomContainerView2
        let tapGestureRecognizer2 = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        bottomContainerView2.addGestureRecognizer(tapGestureRecognizer2)

        // Add gesture recognizer to bottomContainerView3
        let tapGestureRecognizer3 = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        bottomContainerView3.addGestureRecognizer(tapGestureRecognizer3)
        
        
    }
    
    @objc func handleTap(sender: UITapGestureRecognizer) {
        guard let view = sender.view else {
            return
        }
        
        delegate?.didTapView(view)
    }
    
    func addImageViewAndLabelToParentView(parentView: UIView, iconImageName: String, iconLabel: String) {
        // Create UIStackView and add it to the parent view
        let stackView = UIStackView()
        stackView.translatesAutoresizingMaskIntoConstraints = false
        parentView.addSubview(stackView)
        stackView.leadingAnchor.constraint(equalTo: parentView.leadingAnchor).isActive = true
        stackView.trailingAnchor.constraint(equalTo: parentView.trailingAnchor).isActive = true
        stackView.topAnchor.constraint(equalTo: parentView.topAnchor).isActive = true
        stackView.bottomAnchor.constraint(equalTo: parentView.bottomAnchor).isActive = true

        // Create UIImageView and add it to the stack view
        let imageView = UIImageView()
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.image = UIImage(systemName: iconImageName)
        stackView.addArrangedSubview(imageView)
        imageView.widthAnchor.constraint(equalToConstant: 30).isActive = true
        imageView.heightAnchor.constraint(equalToConstant: 30).isActive = true
        imageView.layoutMargins = UIEdgeInsets(top: 0, left: 20, bottom: 0, right: 0)

        // Create UILabel and add it to the stack view
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        stackView.addArrangedSubview(label)
        label.text = iconLabel
        label.textColor = .white

        // Set stack view properties
        stackView.axis = .horizontal
        stackView.distribution = .fill
        stackView.alignment = .center
        stackView.spacing = 20
        stackView.layoutMargins = UIEdgeInsets(top: 0, left: 10, bottom: 0, right: 10)
        stackView.isLayoutMarginsRelativeArrangement = true
    }

}

extension ChatBottomSelectionViewController: UICollectionViewDataSource {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        print ("total count is \(emojis.count)")
        return emojis.count
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "EmojiCell", for: indexPath) as? EmojiCell else {
            fatalError("Unable to dequeue EmojiCell")
        }

        let emoji = emojis[indexPath.item]
        cell.emojiLabel.text = emoji

        return cell
    }
}

extension ChatBottomSelectionViewController: UICollectionViewDelegate {
//    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
//        let cell = collectionView.cellForItem(at: indexPath) as! EmojiCell
//        let emoji = cell.emojiLabel.text!
//        print("Tapped on emoji: \(emoji)")
//    }
    
    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        guard let cell = collectionView.cellForItem(at: indexPath) as? EmojiCell else {
            return
        }
        
        let circleView = cell.circleView
        
        let emojiLabel = cell.emojiLabel
        let emoji = cell.emojiLabel.text!

        if emojiLabel.text == "❤️" {
            self.animateHeartMovementWith(emojiLabel: emojiLabel)
            delegate?.didSelectEmoji(emoji, induceWaiting: true)
        } else if emojiLabel.text == "➕" {
            self.showEmojiPicker(fromCell: circleView)
        } else if emojiLabel.text == "👍" || emojiLabel.text == "👋" {
            self.animateThumbsUpMovementWith(emojiLabel: emojiLabel)
            delegate?.didSelectEmoji(emoji, induceWaiting: true)
        } else if emojiLabel.text == "🔥" {
            self.animateFlameSizeWith(emojiLabel: emojiLabel)
            delegate?.didSelectEmoji(emoji, induceWaiting: true)
        } else {
            delegate?.didSelectEmoji(emoji, induceWaiting: true)
        }
        
        
    }
    
    private func showEmojiPicker(fromCell: UIView) {
        let viewController = EmojiPickerViewController()
            viewController.delegate = self
            viewController.sourceView = fromCell
            present(viewController, animated: true)
    }
    
    private func animateFlameSizeWith(emojiLabel: UILabel) {
        let duplicateEmojiLabel = UILabel()
        duplicateEmojiLabel.text = emojiLabel.text
        duplicateEmojiLabel.textColor = emojiLabel.textColor
        duplicateEmojiLabel.font = emojiLabel.font
        duplicateEmojiLabel.textAlignment = emojiLabel.textAlignment
        duplicateEmojiLabel.sizeToFit()
        
        let originalFrame = emojiLabel.convert(emojiLabel.bounds, to: view)
        duplicateEmojiLabel.frame = originalFrame
        view.addSubview(duplicateEmojiLabel)
        
        let growDuration = 0.3
        let shrinkDuration = 0.2
        let initialScale: CGFloat = 0.8
        let finalScale: CGFloat = 1.5
        
        UIView.animate(withDuration: growDuration, delay: 0, options: [.curveEaseIn], animations: {
            emojiLabel.alpha = 0.0
            duplicateEmojiLabel.transform = CGAffineTransform(scaleX: finalScale, y: finalScale)
        }, completion: { _ in
            UIView.animate(withDuration: shrinkDuration, delay: 0, options: [.curveEaseOut], animations: {
                duplicateEmojiLabel.transform = CGAffineTransform(scaleX: finalScale, y: finalScale)
            }, completion: { _ in
                UIView.animate(withDuration: shrinkDuration, delay: 0, options: [.curveEaseIn], animations: {
                    duplicateEmojiLabel.transform = CGAffineTransform(scaleX: 1, y: 1)
                    emojiLabel.alpha = 1.0
                }, completion: { _ in
                    duplicateEmojiLabel.removeFromSuperview()
                })
            })
        })
    }

    

    private func animateHeartMovementWith(emojiLabel: UILabel) {
        let duplicateEmojiLabel = UILabel()
        duplicateEmojiLabel.text = emojiLabel.text
        duplicateEmojiLabel.textColor = emojiLabel.textColor
        duplicateEmojiLabel.font = emojiLabel.font
        duplicateEmojiLabel.textAlignment = emojiLabel.textAlignment
        duplicateEmojiLabel.sizeToFit()
        
        let originalFrame = emojiLabel.convert(emojiLabel.bounds, to: view)
        duplicateEmojiLabel.frame = originalFrame
        view.addSubview(duplicateEmojiLabel)
        
        let scaleUpDuration = 0.1
        let scaleDownDuration = 0.2
        let initialScale: CGFloat = 0.8
        let finalScale: CGFloat = 1.2
        
        UIView.animate(withDuration: scaleUpDuration, delay: 0, options: [.curveEaseIn], animations: {
            emojiLabel.alpha = 0.0
            duplicateEmojiLabel.transform = CGAffineTransform(scaleX: initialScale, y: initialScale)
        }, completion: { _ in
            UIView.animate(withDuration: scaleDownDuration, delay: 0, options: [.curveEaseOut], animations: {
                duplicateEmojiLabel.transform = CGAffineTransform(scaleX: finalScale, y: finalScale)
            }, completion: { _ in
                UIView.animate(withDuration: scaleDownDuration, delay: 0, options: [.curveEaseIn], animations: {
                    duplicateEmojiLabel.transform = CGAffineTransform(scaleX: 1, y: 1)
                    emojiLabel.alpha = 1.0
                }, completion: { _ in
                    duplicateEmojiLabel.removeFromSuperview()
                })
            })
        })
    }
    
    private func animateThumbsUpMovementWith(emojiLabel: UILabel) {
        let duplicateEmojiLabel = UILabel()
        duplicateEmojiLabel.text = emojiLabel.text
        duplicateEmojiLabel.textColor = emojiLabel.textColor
        duplicateEmojiLabel.font = emojiLabel.font
        duplicateEmojiLabel.textAlignment = emojiLabel.textAlignment
        duplicateEmojiLabel.sizeToFit()
        
        let originalFrame = emojiLabel.convert(emojiLabel.bounds, to: view)
        duplicateEmojiLabel.frame = originalFrame
        view.addSubview(duplicateEmojiLabel)
        
        let tiltDuration = 0.2
        let initialTiltAngle: CGFloat = -30
        let finalTiltAngle: CGFloat = 10
        
        UIView.animate(withDuration: tiltDuration, delay: 0, options: [.curveEaseIn], animations: {
            emojiLabel.alpha = 0.0
            duplicateEmojiLabel.transform = CGAffineTransform(rotationAngle: initialTiltAngle * .pi / 180.0)
        }, completion: { _ in
            UIView.animate(withDuration: tiltDuration, delay: 0, options: [.curveEaseOut], animations: {
                duplicateEmojiLabel.transform = CGAffineTransform(rotationAngle: finalTiltAngle * .pi / 180.0)
            }, completion: { _ in
                UIView.animate(withDuration: tiltDuration, delay: 0, options: [.curveEaseIn], animations: {
                    duplicateEmojiLabel.transform = CGAffineTransform(rotationAngle: 0)
                    emojiLabel.alpha = 1.0
                }, completion: { _ in
                    duplicateEmojiLabel.removeFromSuperview()
                })
            })
        })
    }



}

extension ChatBottomSelectionViewController: UICollectionViewDelegateFlowLayout {
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        return CGSize(width: sizeOfCell, height: sizeOfCell)
    }
}

class EmojiCell: UICollectionViewCell {
    let circleView = UIView()
    let emojiLabel = UILabel()
    let sizeOfCell = 40.0

    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .clear
        

        circleView.backgroundColor = UIColor(hex: AppConstants.ChatDesign.MESSAGE_BUBBLE_OTHER_COLOR_CODE)
        circleView.layer.cornerRadius = sizeOfCell/2
        addSubview(circleView)

        emojiLabel.textAlignment = .center
        emojiLabel.font = UIFont.systemFont(ofSize: 20)
        circleView.addSubview(emojiLabel)

        circleView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            circleView.centerXAnchor.constraint(equalTo: centerXAnchor),
            circleView.centerYAnchor.constraint(equalTo: centerYAnchor),
            circleView.widthAnchor.constraint(equalToConstant: sizeOfCell),
            circleView.heightAnchor.constraint(equalToConstant: sizeOfCell)
        ])

        emojiLabel.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            emojiLabel.centerXAnchor.constraint(equalTo: circleView.centerXAnchor),
            emojiLabel.centerYAnchor.constraint(equalTo: circleView.centerYAnchor)
        ])
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

extension ChatBottomSelectionViewController: EmojiPickerDelegate {
    func didGetEmoji(emoji: String) {
        delegate?.didSelectEmoji(emoji, induceWaiting: true)
    }
}
