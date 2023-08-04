import Foundation
import SwiftUI
import SotoS3
import SotoS3FileTransfer
import FirebaseFirestore

struct AsyncLoadImage: View {
    var mediaUrl: String
    var targetWidth: Int
    var targetHeight: Int?
    @State var loading = true
    var displaySquare: Bool = false
    
    var body: some View {
        VStack(alignment: .center) {
            HStack(alignment: .center) {
                AsyncNSImage(mediaUrl: mediaUrl, targetWidth: targetWidth, targetHeight: targetHeight, displaySquare: displaySquare, loading: $loading)
                    .id(mediaUrl)
                    .frame(width: CGFloat(targetWidth))
                if loading {
                    ProgressView()
                }
            }
        }
    }
}

struct AsyncNSImage: NSViewRepresentable {
    var mediaUrl: String
    var targetWidth: Int
    var targetHeight: Int?
    var displaySquare: Bool
    @Binding var loading: Bool
    
    func makeNSView(context: Context) -> NSImageView {
        let targetUrl = getResizedImageUrl(targetWidth: targetWidth, targetHeight: targetHeight, origUrl: mediaUrl)
        let imageView = NSImageView()
        imageView.imageScaling = NSImageScaling.scaleNone
        
        DispatchQueue.global().async {
            guard let url = URL(string: targetUrl), let data = try? Data(contentsOf: url) else { return }
            DispatchQueue.main.async {
                guard let image = NSImage(data: data) else { return }
                if let targetHeight = targetHeight {
                    image.size = NSSize(width: targetWidth, height: targetHeight)
                } else {
                    if displaySquare && image.size.height < image.size.width {
                        let scaledWidth = CGFloat(targetWidth) * image.size.width / image.size.height
                        image.size = NSSize(width: scaledWidth, height: CGFloat(targetWidth))
                    } else {
                        let scaledHeight = CGFloat(targetWidth) * image.size.height / image.size.width
                        image.size = NSSize(width: CGFloat(targetWidth), height: scaledHeight)
                    }
                }
                loading = false
                imageView.image = image
            }
        }
        return imageView
    }
    
    func updateNSView(_ image: NSImageView, context: Context) {
    }
}

func getNSImage(mediaUrl: String, targetWidth: Int, closure onCompletion: @escaping (NSImage) -> Void) {
    let targetUrl = getResizedImageUrl(targetWidth: targetWidth, origUrl: mediaUrl)
    let image = NSImage(named: mediaUrl)
    if let image = image {
        onCompletion(image)
    } else {
        DispatchQueue.global().async {
            guard let url = URL(string: targetUrl), let data = try? Data(contentsOf: url) else { return }
            DispatchQueue.main.async {
                guard let image = NSImage(data: data) else { return }
                let scaledHeight = CGFloat(targetWidth) * image.size.height / image.size.width
                image.size = NSSize(width: CGFloat(targetWidth), height: scaledHeight)
                image.setName(mediaUrl)
                onCompletion(image)
            }
        }
    }
}

let bucket = "persona-content-store"

let client = AWSClient(
    credentialProvider: .static(accessKeyId: "AKIARZGGW2YSUBK6V2NE", secretAccessKey: "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"),
    httpClientProvider: .createNew
)
let s3 = S3(client: client, region: .useast2)
let s3FileTransfer = S3FileTransferManager(s3: s3, threadPoolProvider: .createNew)

func addImageToPost(userID: String, onPersonaID: String, onPostID: String, url: NSURL, width: CGFloat, height: CGFloat) -> String? {
    guard let path = url.path, let filename = url.lastPathComponent, let ext = url.pathExtension else { return nil }
    
    let mediaData = [
        "userID": userID,
        "origFileName": filename,
    ]
    let db = Firestore.firestore()
    let mediaRef = db.collection("media").addDocument(data: mediaData)
    let uniqueFileName = "\(mediaRef.documentID).\(ext)"
    
    let uploadFuture = s3FileTransfer.copy(
        from: path,
        to: S3File(url: "s3://\(bucket)/\(uniqueFileName)")!
    )
    let publicPath = "https://persona-content-store.s3.us-east-2.amazonaws.com/\(uniqueFileName)"
    uploadFuture.whenComplete { result in
        switch result {
        case .success():
            let newGalleryUri = [
                "uri": publicPath,
                "width": width,
                "height": height
            ] as [String : Any]
            db.collection("personas").document(onPersonaID).collection("posts").document(onPostID).setData(["galleryUris": FirebaseFirestore.FieldValue.arrayUnion([newGalleryUri]), "mediaType": "gallery"], merge: true)
        case .failure(let error):
            print("Failed to upload image to s3", error.localizedDescription)
        }
    }
    
    return publicPath
}

func uploadImage(userID: String, url: NSURL) -> String? {
    guard let path = url.path, let filename = url.lastPathComponent, let ext = url.pathExtension else { return nil }
    
    let mediaData = [
        "userID": userID,
        "origFileName": filename,
    ]
    let db = Firestore.firestore()
    let mediaRef = db.collection("media").addDocument(data: mediaData)
    let uniqueFileName = "\(mediaRef.documentID).\(ext)"
    
    let uploadFuture = s3FileTransfer.copy(
        from: path,
        to: S3File(url: "s3://\(bucket)/\(uniqueFileName)")!
    )
    let publicPath = "https://persona-content-store.s3.us-east-2.amazonaws.com/\(uniqueFileName)"
    return publicPath
}
