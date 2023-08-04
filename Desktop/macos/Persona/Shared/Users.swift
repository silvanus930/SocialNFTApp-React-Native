import SwiftUI

struct UserDetail: View {
    var user: User
    var size = 50
    
    var body: some View {
        HStack {
            AsyncLoadImage(mediaUrl: user.profileImgUrl, targetWidth: size, displaySquare: true)
                .frame(width: CGFloat(size), height: CGFloat(size), alignment: .center)
                .cornerRadius(50)
            Text("\(user.userName)").font(.footnote).italic()
        }
    }
}

