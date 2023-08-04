//
//  PhotoViewerViewController.swift
//  Persona
//
//  Created by Allan Zhang on 2/11/23.
//

import UIKit
import SDWebImage

class PhotoViewerViewController: UIViewController, UIScrollViewDelegate {
    
    private let scrollView: UIScrollView = {
        let scrollView = UIScrollView()
        scrollView.minimumZoomScale = 1.0
        scrollView.maximumZoomScale = 10.0
        return scrollView
    }()
    
    private let imageView: UIImageView = {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFit
        return imageView
    }()
    
    init(imageURL: URL) {
        super.init(nibName: nil, bundle: nil)
        
        // Use SDWebImage to download the image
        imageView.sd_setImage(with: imageURL) { (image, error, cacheType, url) in
            self.imageView.image = image
        }
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupViews()
    }
    
    private func setupViews() {
        
        self.view.backgroundColor = .clear
        let blurEffect = UIBlurEffect(style: .systemMaterialDark)
        let blurView = UIVisualEffectView(effect: blurEffect)
        blurView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(blurView)
        
        blurView.leftAnchor.constraint(equalTo: view.leftAnchor).isActive = true
        blurView.rightAnchor.constraint(equalTo: view.rightAnchor).isActive = true
        blurView.topAnchor.constraint(equalTo: view.topAnchor).isActive = true
        blurView.bottomAnchor.constraint(equalTo: view.bottomAnchor).isActive = true
        
        
        view.addSubview(scrollView)
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.delegate = self
        
        NSLayoutConstraint.activate([
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.topAnchor.constraint(equalTo: view.topAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        scrollView.addSubview(imageView)
        imageView.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            imageView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            imageView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            imageView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            imageView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
            imageView.heightAnchor.constraint(equalTo: scrollView.heightAnchor)
        ])
    }
    
    func viewForZooming(in scrollView: UIScrollView) -> UIView? {
        return imageView
    }
    
    //    private let imageView: UIImageView = {
    //            let imageView = UIImageView()
    //            imageView.contentMode = .scaleAspectFit
    //            return imageView
    //        }()
    //
    //        init(imageURL: URL) {
    //            super.init(nibName: nil, bundle: nil)
    //
    //            // Use SDWebImage to download the image
    //            imageView.sd_setImage(with: imageURL) { (image, error, cacheType, url) in
    //                self.imageView.image = image
    //            }
    //        }
    //
    //        required init?(coder: NSCoder) {
    //            fatalError("init(coder:) has not been implemented")
    //        }
    //
    //        override func viewDidLoad() {
    //            super.viewDidLoad()
    //            setupViews()
    //        }
    //
    //        private func setupViews() {
    //
    //            view.backgroundColor = .black
    //
    //            view.addSubview(imageView)
    //            imageView.translatesAutoresizingMaskIntoConstraints = false
    //
    //            NSLayoutConstraint.activate([
    //                imageView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
    //                imageView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
    //                imageView.topAnchor.constraint(equalTo: view.topAnchor),
    //                imageView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    //            ])
    //        }
    
    
}
