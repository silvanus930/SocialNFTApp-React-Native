import Foundation

let S3_BUCKET = "persona-content-store"
let CLOUDFRONT_URL = "https://d2snxo2mobtpb6.cloudfront.net"

struct ResizeWidthOnly: Codable {
    var fit: String
    var width: Int
}

struct EditsWidthOnly: Codable {
    var resize: ResizeWidthOnly
}

struct RequestWidthOnly: Codable {
    var bucket: String = S3_BUCKET
    var key: String
    var edits: EditsWidthOnly
    var rotate: String? = nil
}

struct Resize: Codable {
    var fit: String
    var width: Int
    var height: Int
}

struct Edits: Codable {
    var resize: Resize
}

struct Request: Codable {
    var bucket: String = S3_BUCKET
    var key: String
    var edits: Edits
    var rotate: String? = nil
}

enum DefaultImageType {
    case persona
    case user
    case other
}

let personaDefaultProfileUrl = "https://persona-content-store.s3.us-east-2.amazonaws.com/defaultPersona.jpeg"
let userDefaultProfileUrl = "https://persona-content-store.s3.us-east-2.amazonaws.com/defaultUser.jpeg"

func getResizedImageUrl(targetWidth: Int, targetHeight: Int? = nil, fit: String = "cover", origUrl: String, defaultImageType: DefaultImageType = DefaultImageType.persona) -> String {
    let MIN_DIMENSION = 50
    
    var urlParts = origUrl.components(separatedBy: "/")
    
    if urlParts.count == 1 {
        switch defaultImageType {
        case .persona:
            urlParts = personaDefaultProfileUrl.components(separatedBy: "/")
        case .user:
            urlParts = userDefaultProfileUrl.components(separatedBy: "/")
        case .other:
            return origUrl
        }
    }
    
    let key = urlParts.removeLast()
    
    if key.hasSuffix("gif") {
        return origUrl
    }
    
    if key != "" {
        
        guard var height = targetHeight else {
            let newWidth = targetWidth < MIN_DIMENSION ? MIN_DIMENSION * 2 : targetWidth * 3
            let resize = ResizeWidthOnly(fit: fit, width: newWidth)
            let edits = EditsWidthOnly(resize: resize)
            let request = RequestWidthOnly(key: key, edits: edits)
            
            let encoder = JSONEncoder()
            encoder.outputFormatting = .prettyPrinted
            
            do {
                let encodedRequest = try encoder.encode(request)
                let encodedUrlString = String(encodedRequest
                    .base64EncodedString()
                    .addingPercentEncoding(withAllowedCharacters: .urlHostAllowed) ?? "")
                return "\(CLOUDFRONT_URL)/\(encodedUrlString)"
            } catch {
                return origUrl
            }
        }
        
        var width = targetWidth
        
        if width < MIN_DIMENSION || height < MIN_DIMENSION {
            let aspectRatio = width / height;
            if aspectRatio <= 1 {
                width = MIN_DIMENSION;
                height = width * 2 / aspectRatio;
            } else {
                height = MIN_DIMENSION;
                width = height * 2 * aspectRatio;
            }
        }
        
        let resize = Resize(fit: fit, width: width, height: height)
        let edits = Edits(resize: resize)
        let request = Request(key: key, edits: edits)
        
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        
        do {
            let encodedRequest = try encoder.encode(request)
            return "\(CLOUDFRONT_URL)/\(encodedRequest.base64EncodedString())"
        } catch {
            return origUrl
        }
    } else {
        return origUrl;
    }
}
