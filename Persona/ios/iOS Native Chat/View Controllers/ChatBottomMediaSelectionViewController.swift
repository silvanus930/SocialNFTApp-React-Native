//
//  ChatBottomMediaSelectionViewController.swift
//  Persona
//
//  Created by Allan Zhang on 3/9/23.
//

import UIKit
import Photos

protocol ChatBottomMediaSelectionDelegate: AnyObject {
    func didTapMediaView(_ view: UIView)
    func attachImages(_ images: [UIImage])
}

class ChatBottomMediaSelectionViewController: UIViewController {
    
    weak var delegate: ChatBottomMediaSelectionDelegate?
    
    var images = [UIImage]()
    var originalImages = [Int: UIImage]()
    var selectedImages = [UIImage]()
    let bottomContainerView1 = UIView()
    let bottomContainerView2 = UIView()
    let bottomContainerView3 = UIView()
    
    
    let collectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .horizontal
        layout.itemSize = CGSize(width: 80, height: 80)
        layout.minimumInteritemSpacing = 10 //the spacing between each image
        layout.minimumLineSpacing = 10
        let collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        collectionView.showsHorizontalScrollIndicator = false
        collectionView.backgroundColor = .clear
        collectionView.contentInset = UIEdgeInsets(top: 0, left: 20, bottom: 0, right: 0) //adds a left buffer to the view
        collectionView.register(ImageCollectionViewCell.self, forCellWithReuseIdentifier: "ImageCell")
        return collectionView
    }()
    
    let attachImagesButton: UIButton = {
        let button = UIButton()
        button.translatesAutoresizingMaskIntoConstraints = false
        button.alpha = 0.0
        button.backgroundColor = UIColor.init(hex: "3cb043")
        button.setTitle("Attach photos", for: .normal)
        button.layer.cornerRadius = 8.0
        return button
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = .clear
        let blurEffect = UIBlurEffect(style: .dark)
        let visualEffectView = UIVisualEffectView(effect: blurEffect)
        visualEffectView.frame = view.bounds
        visualEffectView.alpha = 1.0
        view.addSubview(visualEffectView)
        
        view.addSubview(collectionView)
        
        collectionView.dataSource = self
        collectionView.delegate = self
        
        NSLayoutConstraint.activate([
            collectionView.topAnchor.constraint(equalTo: view.topAnchor, constant: 60), //adds a 100 point buffer to the very top
            collectionView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            collectionView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            collectionView.heightAnchor.constraint(equalToConstant: 90)
        ])
        
        let titleLabel = UILabel(frame: CGRect(x: 20, y: 20, width: 240, height: 40))
        titleLabel.font = .systemFont(ofSize: 16, weight: .bold)
        titleLabel.text = "Recent photos"
        titleLabel.textColor = .white
        view.addSubview(titleLabel)
        
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.topAnchor, constant: 40), //adds a 100 point buffer to the very top
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            titleLabel.heightAnchor.constraint(equalToConstant: 40)
        ])
        
        requestPhotoLibraryAccess()
        self.setupBottomContainerViews()
        self.selectedImages.removeAll()
        
        view.addSubview(attachImagesButton)
        attachImagesButton.addTarget(self, action: #selector(onAttachImageButtonTapped), for: .touchUpInside)
        //The height anchors for the attach button
        NSLayoutConstraint.activate([
            attachImagesButton.topAnchor.constraint(equalTo: bottomContainerView3.bottomAnchor, constant: 15),
            attachImagesButton.leadingAnchor.constraint(equalTo: bottomContainerView3.leadingAnchor),
            attachImagesButton.trailingAnchor.constraint(equalTo: bottomContainerView3.trailingAnchor),
            attachImagesButton.heightAnchor.constraint(equalToConstant: 54)
        ])
        
    }
    
    func updateAttachImagesButtonAlpha() {
        let alpha: CGFloat = selectedImages.count > 0 ? 1.0 : 0.0
        UIView.animate(withDuration: 0.3) {
            self.attachImagesButton.alpha = alpha
        }
    }
    
    //This method is specifically for working with the fast image preview
    //on attach onattach
    @objc func onAttachImageButtonTapped() {
        print ("calling attachImages delegate method")
        
        //run selectedImages based on their indexes in images, and then pick those in originalImages
        let selectedIndexList = selectedImages.map { aImage -> Int? in
            return self.images.firstIndex(of: aImage)
        }.compactMap { $0 }
        
        print("Selected image indexes: \(selectedIndexList)")
        
        let selectedOriginalImages = selectedIndexList.map { index -> UIImage in
            return self.originalImages[index]!
        }
        
        print("Selected original images: \(selectedOriginalImages)")
        
        //Compress the images
        
        delegate?.attachImages(selectedOriginalImages)
        //calls setAttachmentImages after
    }
    
    
    
    
    func requestPhotoLibraryAccess() {
        PHPhotoLibrary.requestAuthorization { [weak self] status in
            switch status {
            case .authorized:
                self?.fetchLatestPhotos()
            case .denied, .restricted:
                print("Access to photo library denied")
            case .notDetermined:
                print("Access to photo library not determined")
            default:
                break
            }
        }
    }
    
    private func setupBottomContainerViews() {
        // Set up BottomContainerView1
        bottomContainerView1.translatesAutoresizingMaskIntoConstraints = false
        bottomContainerView1.backgroundColor = UIColor(hex: AppConstants.ChatDesign.CHAT_BACKGROUND_COLOR_CODE)
        bottomContainerView1.layer.cornerRadius = 8.0
        
        view.addSubview(bottomContainerView1)
        bottomContainerView1.tag = AppConstants.ViewDesignations.BOTTOM_MEDIA_PHOTO_LIBRARY
        self.addImageViewAndLabelToParentView(parentView: bottomContainerView1, iconImageName: "photo.stack.fill", iconLabel: "Open photo library")
        
        // Set up BottomContainerView2
        bottomContainerView2.translatesAutoresizingMaskIntoConstraints = false
        bottomContainerView2.backgroundColor = UIColor(hex: AppConstants.ChatDesign.CHAT_BACKGROUND_COLOR_CODE)
        bottomContainerView2.layer.cornerRadius = 8.0
        
        view.addSubview(bottomContainerView2)
        bottomContainerView2.tag = AppConstants.ViewDesignations.BOTTOM_MEDIA_SELECT_VIDEO
        self.addImageViewAndLabelToParentView(parentView: bottomContainerView2, iconImageName: "video.square", iconLabel: "Select video")
        
        // Set up BottomContainerView3
        bottomContainerView3.translatesAutoresizingMaskIntoConstraints = false
        bottomContainerView3.backgroundColor = UIColor(hex: AppConstants.ChatDesign.CHAT_BACKGROUND_COLOR_CODE)
        bottomContainerView3.layer.cornerRadius = 8.0
        
        view.addSubview(bottomContainerView3)
        bottomContainerView3.tag = AppConstants.ViewDesignations.BOTTOM_MEDIA_TAKE_PHOTO
        self.addImageViewAndLabelToParentView(parentView: bottomContainerView3, iconImageName: "camera.fill", iconLabel: "Take photo")
        
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
        print ("Tapped on view")
        
        delegate?.didTapMediaView(view)
    }
    
    private func addImageViewAndLabelToParentView(parentView: UIView, iconImageName: String, iconLabel: String) {
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
        imageView.image = UIImage(systemName: iconImageName)?.withTintColor(.gray, renderingMode: .alwaysOriginal)
        stackView.addArrangedSubview(imageView)
        imageView.widthAnchor.constraint(equalToConstant: 30).isActive = true
        imageView.heightAnchor.constraint(equalToConstant: 30).isActive = true
        imageView.contentMode = .scaleAspectFit
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
    
    
    func fetchLatestPhotos() {
        print("📸 Fetching latest photos from preview bar")
        let options = PHFetchOptions()
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        options.fetchLimit = 20
        
        let result = PHAsset.fetchAssets(with: .image, options: options)
        let manager = PHImageManager.default()
        
        let thumbnailOptions = PHImageRequestOptions()
        thumbnailOptions.deliveryMode = .fastFormat
        
        let originalOptions = PHImageRequestOptions()
        originalOptions.deliveryMode = .highQualityFormat
        originalOptions.resizeMode = .none
        originalOptions.isSynchronous = false
        
        for i in 0..<result.count {
            let asset = result.object(at: i)
            
            manager.requestImage(for: asset, targetSize: CGSize(width: 160, height: 160), contentMode: .aspectFill, options: thumbnailOptions) { [weak self] image, info in
                if let image = image {
                    self?.images.append(image)
                    DispatchQueue.main.async {
                        self?.collectionView.reloadData()
                    }
                }
            }
            
            //this sets the original size
            manager.requestImage(for: asset, targetSize: PHImageManagerMaximumSize, contentMode: .aspectFill, options: originalOptions)
            { [weak self] image, info in
                if let originalImage = image {
                    //NSLog("running this loop")
                    self?.originalImages[i] = originalImage
                    
                } else {
                    print ("Unable to cast?")
                }
            }
        } //end for loop
        
        print ("Thumbnail images are \(self.images)")
        print ("Origial images are \(self.originalImages)")
        
        
    }
    
    
    
    //target max dimension of 1920
    func targetSizeForMaxDimension(originalSize: CGSize, maxDimension: CGFloat) -> CGSize {
        let width = originalSize.width
        let height = originalSize.height
        
        if width <= maxDimension && height <= maxDimension {
            return originalSize
        }
        
        let aspectRatio = width / height
        
        if width > height {
            let newWidth = maxDimension
            let newHeight = newWidth / aspectRatio
            return CGSize(width: newWidth, height: newHeight)
        } else {
            let newHeight = maxDimension
            let newWidth = newHeight * aspectRatio
            return CGSize(width: newWidth, height: newHeight)
        }
    }
    
    
    
    
}

extension ChatBottomMediaSelectionViewController: UICollectionViewDataSource {
    
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return images.count
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "ImageCell", for: indexPath) as! ImageCollectionViewCell
        cell.imageView.image = images[indexPath.item]
        cell.circleView.isHidden = false
        return cell
    }
}

extension ChatBottomMediaSelectionViewController: UICollectionViewDelegate {
    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        // Handle image selection from scroller
        let cell = collectionView.cellForItem(at: indexPath) as! ImageCollectionViewCell
        if let cellImage = cell.imageView.image {
            if !self.selectedImages.contains(cellImage) {
                //Add the image to the selected images array
                print ("add image")
                
                self.selectedImages.append(cellImage)
                
                
                //UI for image selection
                cell.circleView.backgroundColor = .white
                cell.circleView.alpha = 1.0
                cell.circleView.isHidden = false
            } else {
                //remove the image from the selected images array
                print ("remove image")
                if let index = self.selectedImages.firstIndex(of: cellImage) {
                    
                    self.selectedImages.remove(at: index)
                    
                    cell.circleView.backgroundColor = UIColor.white.withAlphaComponent(0.3)
                    cell.circleView.alpha = 1.0
                    cell.circleView.isHidden = false
                } else {
                    print ("cannot get image of index")
                }
            }
            
            //include the attach button, if avaliable
            updateAttachImagesButtonAlpha()
            
        } else {
            print ("No image found when tapped")
        }
        
    }
}

class ImageCollectionViewCell: UICollectionViewCell {
    let imageView: UIImageView = {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.layer.cornerRadius = 6
        imageView.layer.borderWidth = 0.5
        imageView.layer.borderColor = UIColor.gray.cgColor
        imageView.translatesAutoresizingMaskIntoConstraints = false
        return imageView
    }()
    
    let circleView: UIView = {
        let view = UIView()
        view.layer.cornerRadius = 10 //set the corner radius to half the width/height to make it circular
        view.layer.borderColor = UIColor.white.cgColor
        view.layer.borderWidth = 1
        view.backgroundColor = UIColor.white.withAlphaComponent(0.3) //set the background color to 30% transparent white
        view.translatesAutoresizingMaskIntoConstraints = false
        view.isHidden = true //hide the circle by default
        return view
    }()
    
    let deleteButton: UIButton = {
        let button = UIButton()
        button.translatesAutoresizingMaskIntoConstraints = false
        button.setImage(UIImage(systemName: "xmark", withConfiguration: UIImage.SymbolConfiguration(pointSize: 10, weight: .regular, scale: .small)), for: .normal) // Allan : delete button image size(point size will affect the image size)
        button.tintColor = UIColor.white
        button.backgroundColor = .black
        button.layer.borderColor = UIColor(white: 0.8, alpha: 1).cgColor
        button.clipsToBounds = true
        button.layer.borderWidth = 0
        button.layer.cornerRadius = 8 // Allan : delete button size / 2 (corner radius)
        button.isHidden = true
        return button
    }()
    
    private var imageTopConstraint: NSLayoutConstraint!
    private var imageTrailingConstraint: NSLayoutConstraint!
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        contentView.addSubview(imageView)
        contentView.addSubview(circleView) //add the circle view as a subview
        contentView.addSubview(deleteButton)
        
        imageTopConstraint = imageView.topAnchor.constraint(equalTo: contentView.topAnchor)
        imageTrailingConstraint = imageView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor)
        
        NSLayoutConstraint.activate([
            imageTopConstraint,
            imageTrailingConstraint,
            imageView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            imageView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor),
            circleView.widthAnchor.constraint(equalToConstant: 20), //set the width and height of the circle view
            circleView.heightAnchor.constraint(equalToConstant: 20),
            circleView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -5), //position the circle view in the upper-right corner
            circleView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 5),
            deleteButton.widthAnchor.constraint(equalToConstant: 16), // Allan : delete button size
            deleteButton.heightAnchor.constraint(equalToConstant: 16), // Allan : delete button size
            deleteButton.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            deleteButton.topAnchor.constraint(equalTo: contentView.topAnchor),
        ])
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func setDeleteButtonVisibility(visibility: Bool) {
        deleteButton.isHidden = !visibility
        
        imageTopConstraint.constant = visibility ? 10 : 0 // Allan : delete button size / 2 from the upper-right corner
        imageTrailingConstraint.constant = visibility ? -10 : 0 // Allan : delete button size / 2 from the upper-right corner
    }
}


extension ChatBottomMediaSelectionViewController {
    func fetchLatestMedia() {
        let options = PHFetchOptions()
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        options.fetchLimit = 20
        
        let allPhotos = PHAssetCollection.fetchAssetCollections(with: .smartAlbum, subtype: .smartAlbumUserLibrary, options: nil)
        guard let collection = allPhotos.firstObject else { return }
        let result = PHAsset.fetchAssets(in: collection, options: options)
        
        for i in 0..<result.count {
            let asset = result.object(at: i)
            let manager = PHImageManager.default()
            let options = PHImageRequestOptions()
            options.deliveryMode = .opportunistic
            
            if asset.mediaType == .image {
                manager.requestImage(for: asset, targetSize: CGSize(width: 80, height: 80), contentMode: .aspectFill, options: options) { [weak self] image, info in
                    if let image = image {
                        self?.images.append(image)
                        self?.collectionView.reloadData()
                    }
                }
            } else if asset.mediaType == .video {
                manager.requestAVAsset(forVideo: asset, options: nil) { [weak self] (asset, _, _) in
                    if let asset = asset as? AVURLAsset {
                        ChatBottomMediaSelectionViewController.generateThumbnail(from: asset.url) { [weak self] thumbnail in
                            if let thumbnail = thumbnail {
                                self?.images.append(thumbnail)
                                self?.collectionView.reloadData()
                            }
                        }
                    }
                }
            }
        }
        
    }
    
    static func generateThumbnail(from url: URL, completion: @escaping (UIImage?) -> Void) {
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
}

