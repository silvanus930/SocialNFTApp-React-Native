//
//  AttachmentsDataSource.swift
//  Persona
//
//  Created by Allan Zhang on 3/13/23.
//

import UIKit

class AttachmentsDataSource: NSObject, UICollectionViewDataSource, UICollectionViewDelegate {
    
    var attachments: [UIImage] = [] //the preview attachments
    var videoFile: URL?
    
    private var collectionView: UICollectionView!
    private var canDeleteAttachment: (() -> Bool)?
    private var onAttachmentsDeleted: ((UIImage) -> Void)?
    
    
    init(collectionView: UICollectionView!, canDeleteAttachment: (() -> Bool)? = nil, onAttachmentsDeleted: ((UIImage) -> Void)? = nil) {
        self.collectionView = collectionView
        self.canDeleteAttachment = canDeleteAttachment
        self.onAttachmentsDeleted = onAttachmentsDeleted
    }
    
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return attachments.count
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "ImageCell", for: indexPath) as! ImageCollectionViewCell
        cell.imageView.image = attachments[indexPath.item]
        cell.setDeleteButtonVisibility(visibility: true)
        cell.deleteButton.tag = indexPath.item
        if cell.deleteButton.allTargets.isEmpty {
            cell.deleteButton.addTarget(self, action: #selector(onDelete), for: .touchUpInside)
        }
        return cell
    }
    
    func removeAllAttachments() {
        if let image = self.attachments.first {
            self.attachments.removeAll()
            self.collectionView.reloadData()
            onAttachmentsDeleted?(image)
        }
    }
    
    @IBAction func onDelete(_ sender: UIButton) {
        if let canDeleteAttachment = canDeleteAttachment {
            if !canDeleteAttachment() {
                return
            }
        }
        
        if attachments.count > sender.tag {
            let imageToDelete = attachments[sender.tag]
            
            attachments.remove(at: sender.tag)
            collectionView.reloadData()
            
            onAttachmentsDeleted?(imageToDelete)
        }
    }
}

