//
//  AWSManager.swift
//  Persona
//
//  Created by Allan Zhang on 3/9/23.
//

import Foundation
import AWSS3
import MobileCoreServices
import AVFoundation

class AWSManager {
    
    static let shared = AWSManager()
    var imageToDimensions = [String: (CGFloat, CGFloat)]() //imageUrl: (width, height)
    

    public func cleanStoredImageInfo() {
        imageToDimensions.removeAll()
    }

    public func uploadImageToS3WithProgress(image: UIImage,
                                            progressBlock: @escaping((UIImage, Float) -> Void),
                                            completionBlock: @escaping((UIImage, Bool, URL?, Error?) -> Void)) {
        
        AWSServiceManager.default().defaultServiceConfiguration = AWSServiceConfiguration(region: .USEast2, credentialsProvider: AWSCognitoCredentialsProvider(regionType: .USEast2, identityPoolId: "us-east-2:153b7ff1-6f2d-42f8-80fb-9ac38179ffd3"))
        
        let transferUtility = AWSS3TransferUtility.default()
        let bucketName = "persona-content-store"
        let root = "https://persona-content-store.s3.us-east-2.amazonaws.com/"
        let key = "\(self.generateFileName()).jpg" //note jpg for key
        
        guard let data = image.jpegData(compressionQuality: 0.4) else {
            print("invalid image data!")
            completionBlock(image, false, nil, nil)
            return
        }
        
        //set the image to the temp storage
        imageToDimensions["\(root)\(key)"] = (image.size.width, image.size.height)

        let expression = AWSS3TransferUtilityUploadExpression()
        expression.progressBlock = { (task, progress) in
//            print("Upload progress: \(progress.fractionCompleted * 100)%")
            DispatchQueue.main.async {
                progressBlock(image, Float(progress.fractionCompleted))
            }
        }

        transferUtility.uploadData(
            data,
            bucket: bucketName,
            key: key,
            contentType: "image/jpeg",
            expression: expression,
            completionHandler: nil
        ).continueWith { (task) -> Any? in
            DispatchQueue.main.async {
                if let error = task.error {
                    print("Error uploading image: \(error.localizedDescription)")
                    completionBlock(image, false, nil, error)
                } else {
                    print("Image uploaded successfully!")
                    
                    let preSignedURLRequest = AWSS3GetPreSignedURLRequest()
                    preSignedURLRequest.bucket = bucketName
                    preSignedURLRequest.key = key
                    preSignedURLRequest.httpMethod = .GET
                    preSignedURLRequest.expires = Date(timeIntervalSinceNow: 3600) // Set the expiration time of the pre-signed URL
                    
                    AWSS3PreSignedURLBuilder.default()
                        .getPreSignedURL(preSignedURLRequest)
                        .continueWith(block: { task in
                            //print("Pre-signed URL: \(task.result)")
                            if let result = task.result,
                               let url = URL(string: result.absoluteString ?? "") {
                                completionBlock(image, true, url, nil)
                            } else {
                                completionBlock(image, false, nil, nil)
                            }
                            return nil
                        })
                }
            }
            return nil
        }
    }
    
    public func generateFileName() -> String {
        let userId = UserManager.shared.currentUserId
        let random8DigitAlpha = self.randomAlphaNumericForLength(length: 8)
        
        if userId.count >= 4 {
            let firstFourDigitsOfUserId = userId.prefix(4)
            return "\(firstFourDigitsOfUserId)-\(random8DigitAlpha)"
        } else {
            return random8DigitAlpha
        }
    }
    
    private func randomAlphaNumericForLength(length: Int) -> String {
        let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        var code = ""
        for _ in 0..<length {
            let randomIndex = Int(arc4random_uniform(UInt32(letters.count)))
            let randomLetter = letters[letters.index(letters.startIndex, offsetBy: randomIndex)]
            code += String(randomLetter)
        }
        return code
    }

    
    public func uploadImagesToS3WithProgress(images: [UIImage],
                                             progressBlock: @escaping((Float) -> Void),
                                             completionBlock: @escaping((Bool, [URL], Error?) -> Void)) {
        
        let totalImages = Float(images.count)
        var progressArray = Array(repeating: Float(0), count: images.count)
        var successCount = 0
        var urls = [URL]()
        
        func uploadImagesRecursive(images: [UIImage], index: Int) {
            if images.isEmpty {
                completionBlock(true, urls, nil)
            } else {
                uploadImageToS3WithProgress(image: images.first!) { _, progress in
                    progressArray[index] = progress
                    let totalProgress = progressArray.reduce(0, +) / totalImages
                    progressBlock(totalProgress)
                    print("Total upload progress: \(totalProgress)")
                } completionBlock: { _, success, url, error in
                    if success,
                       let url = url {
                        urls.append(url)
                        successCount += 1
                        if successCount == images.count {
                            completionBlock(true, urls, nil)
                        } else {
                            var remainingImages = images
                            remainingImages.removeFirst()
                            uploadImagesRecursive(images: remainingImages, index: index + 1)
                        }
                    } else {
                        completionBlock(false, [], error)
                        print ("⛔️Upload error! \(error)")
                    }
                }
            }
        }
        
        uploadImagesRecursive(images: images, index: 0)
    }
    
    public func uploadFileToS3WithProgress(file: URL,
                                           progressBlock: @escaping((URL, Float) -> Void),
                                           completionBlock: @escaping((URL, Bool, URL?, Error?) -> Void)) {

        
        
        
        AWSServiceManager.default().defaultServiceConfiguration = AWSServiceConfiguration(region: .USEast2, credentialsProvider: AWSCognitoCredentialsProvider(regionType: .USEast2, identityPoolId: "us-east-2:153b7ff1-6f2d-42f8-80fb-9ac38179ffd3"))
        
        let transferUtility = AWSS3TransferUtility.default()
        let bucketName = "persona-content-store"
        let key = file.lastPathComponent // Allan: need to update the key generator here
        
        let expression = AWSS3TransferUtilityUploadExpression()
        expression.progressBlock = { (task, progress) in
            print("Progress: \(progress.fractionCompleted)")
            DispatchQueue.main.async {
                progressBlock(file, Float(progress.fractionCompleted))
            }
        }

        transferUtility.uploadFile(
            file,
            bucket: bucketName,
            key: key,
            contentType: mimeTypeForPath(path: file.absoluteString),
            expression: expression,
            completionHandler: { (task, error) in
                DispatchQueue.main.async {
                    if let error = task.error {
                        print("Error uploading file: \(error.localizedDescription)")
                        completionBlock(file, false, nil, error)
                    } else {
                        print("File uploaded successfully!")
                        
                        let preSignedURLRequest = AWSS3GetPreSignedURLRequest()
                        preSignedURLRequest.bucket = bucketName
                        preSignedURLRequest.key = key
                        preSignedURLRequest.httpMethod = .GET
                        preSignedURLRequest.expires = Date(timeIntervalSinceNow: 3600) // Set the expiration time of the pre-signed URL
                        
                        AWSS3PreSignedURLBuilder.default()
                            .getPreSignedURL(preSignedURLRequest)
                            .continueWith(block: { task in
                                print("Pre-signed URL: \(task.result)")
                                if let result = task.result,
                                   let url = URL(string: result.absoluteString ?? "") {
                                    completionBlock(file, true, url, nil)
                                } else {
                                    completionBlock(file, false, nil, nil)
                                }
                                return nil
                            })
                    }
                }
            }
        )
    }
    
    private func mimeTypeForPath(path: String) -> String {
        let url = NSURL(fileURLWithPath: path)
        let pathExtension = url.pathExtension

        if let uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, pathExtension! as NSString, nil)?.takeRetainedValue() {
            if let mimetype = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType)?.takeRetainedValue() {
                return mimetype as String
            }
        }
        return "application/octet-stream"
    }
    
    
    func convertMovToMp4(inputURL: URL, outputURL: URL, completion: @escaping (Bool) -> Void) {
        let asset = AVURLAsset(url: inputURL)
        guard let exportSession = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetLowQuality) else {
            completion(false)
            return
        }
        
        exportSession.outputURL = outputURL
        exportSession.outputFileType = .mp4
        
        exportSession.exportAsynchronously {
            completion(exportSession.status == .completed)
        }
    }


}

