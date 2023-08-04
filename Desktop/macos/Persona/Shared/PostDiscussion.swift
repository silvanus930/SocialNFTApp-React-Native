import SwiftUI
import FirebaseFirestore

struct PostDiscussion: View {
    var persona: Persona
    var post: Post
    var search: String
    @Binding var fullscreenComments: Bool
    @EnvironmentObject var myUserViewModel: MyUserViewModel
    @EnvironmentObject var usersViewModel: UsersViewModel
    @StateObject var commentsViewModel = CommentViewModel()
    @State var newCommentText = ""
    @State var showComments = true
    @EnvironmentObject var toggleComments: ToggleComments
    @StateObject var endorsementViewModel = SinglePostEndorsementViewModel()
    @State var hoveredOver = false
    @EnvironmentObject var selectedText: SelectedText
    @State var commentDropIsTargeted = false
    @State var uploadedImgUrl: String? = nil
    @State var uploadedImgUrlLocal: URL? = nil
    
    var body: some View {
        VStack {
            VStack(alignment: .center) {
                if fullscreenComments {
                    HStack {
                        if !post.anonymous {
                            if let user = usersViewModel.users[post.authorID] {
                                AuthorImage(authorProfileImgUrl: user.profileImgUrl)
                            }
                        } else {
                            AuthorImage(authorProfileImgUrl: persona.profileImgUrl)
                        }
                        Text("\(post.title)")
                            .font(AppFont.commonFont(size: FontSize.large, weight: FontWeight.bold))
                    }
                }
                ZStack(alignment: .top) {
                    HStack {
                        Image(systemName: "bubble.left")
                            .onTapGesture {
                                fullscreenComments = !fullscreenComments
                                if !showComments {
                                    showComments = true
                                }
                            }
                        Text("\(commentsViewModel.comments.count)")
                            .font(AppFont.commonFont(size: FontSize.medium, weight: FontWeight.regular))
                        ForEach(endorsementViewModel.endorsements ?? [], id: \.emoji) { react in
                            if react.endorsers.count > 0 {
                                let iEndorsed = react.endorsers.contains(myUserViewModel.userID ?? "")
                                Text("\(react.emoji) \(react.endorsers.count)")
                                    .font(AppFont.commonFont(size: FontSize.small, weight: FontWeight.regular))
                                    .padding(.top, 6)
                                    .padding(.leading, 8)
                                    .padding(.trailing, 8)
                                    .padding(.bottom, 4)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 40)
                                            .stroke(iEndorsed ? .gray : CustomSwiftUIColors.mediumGray, lineWidth: 1)
                                        )
                                    .padding(.bottom, 2)
                                    .onTapGesture {
                                        if let userID = myUserViewModel.userID {
                                            post.toggleReact(emoji: react.emoji, userID: userID, isEndorsed: react.endorsers.contains(userID))
                                        }
                                    }
                            }
                        }
                        Spacer()
                        Image(systemName: "rectangle.bottomhalf.inset.filled")
                            .onTapGesture {
                                if !fullscreenComments {
                                    showComments = !showComments
                                }
                                fullscreenComments = false
                            }
                        Image(systemName: "rectangle.inset.filled")
                            .onTapGesture {
                                fullscreenComments = !fullscreenComments
                                showComments = fullscreenComments
                            }
                    }
                    .padding(.top, 5)
                    .padding(.bottom, 10)
                    if hoveredOver {
                        VStack() {
                            HStack(alignment: .top) {
                                if let userID = myUserViewModel.userID {
                                    ForEach(["👍", "❤️", "💯", "🤣", "🔥", "🤔"], id: \.self) { emoji in
                                        Button(emoji) {
                                            post.toggleReact(emoji: emoji, userID: userID, isEndorsed: endorsementViewModel.endorsements?.first{ $0.emoji == emoji }?.endorsers.contains(userID))
                                        }
                                    }
                                }
                            }
                        }
                        .padding(.trailing, 10)
                        .offset(x: 0, y: -12)
                    }
                }
                .whenHovered { inside in
                    hoveredOver = inside
                }
            }
            .frame(height: 50)
            if showComments {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 0) {
                        ForEach(commentsViewModel.comments, id: \.documentID) {comment in
                            let showHeader = showCommentHeader.keys.contains(comment.documentID) ? showCommentHeader[comment.documentID] ?? true : true
                            CommentDisplay(post: post, comment: comment, showHeader: showHeader)
                        }
                    }
                }
                .rotationEffect(Angle(degrees: 180))
                .scaleEffect(x: -1.0, y: 1.0, anchor: .center)
                .frame(height: commentsViewModel.comments.count < 4 ? CGFloat(80 * commentsViewModel.comments.count) : nil)
            }
            VStack(alignment: .leading) {
                if let text = selectedText.text, selectedText.replyingTo {
                    HStack {
                        Text("Replying to \(post.title)")
                            .font(AppFont.commonFont(size: FontSize.small, weight: FontWeight.bold))
                        Spacer()
                        Image(systemName: "xmark")
                            .onTapGesture {
                                selectedText.replyingTo = false
                            }
                    }
                    .padding(.bottom, 1)
                    Text("\"... \(text) ...\"")
                        .font(AppFont.commonFont(size: FontSize.small, weight: FontWeight.regular))
                }
                HStack {
                    if let myUser = myUserViewModel.myUser {
                        AuthorImage(authorProfileImgUrl: myUser.profileImgUrl, size: AuthorSizes.small)
                        if let presentUrl = uploadedImgUrlLocal {
                            ZStack(alignment: .topTrailing) {
                                Image(nsImage: NSImage(byReferencing: presentUrl))
                                    .frame(width: 50, height: 50)
                                    .cornerRadius(4)
                                Image(systemName: "x.circle.fill")
                                    .offset(x: 15, y: -5)
                                    .onTapGesture {
                                        uploadedImgUrl = nil
                                        uploadedImgUrlLocal = nil
                                    }
                            }
                        }
                        NSTextFieldEntry(text: $newCommentText, placeHolder: "Comment", font: AppFont.commonNSFont(size: FontSize.medium, weight: FontWeight.regular)) {
                            Comment.create(onPersonaID: persona.documentID, onPostID: post.documentID, userID: myUser.documentID, isThread: false, text: newCommentText, postTextQuoted: selectedText.replyingTo ? selectedText.text : nil, mediaUrl: uploadedImgUrl)
                            uploadedImgUrl = nil
                            uploadedImgUrlLocal = nil
                            newCommentText = ""
                            showComments = true
                            selectedText.replyingTo = false
                        }
                    }
                }
                .onDrop(of: ["public.file-url"], isTargeted: $commentDropIsTargeted) { items,_ in
                    guard items.count == 1, let item = items.first else { return false }
                    let progress = item.loadObject(ofClass: URL.self) { url, _ in
                        if let url = url, let nsurl = NSURL(string: url.absoluteString), let userID = myUserViewModel.userID {
                            uploadedImgUrl = uploadImage(userID: userID, url: nsurl)
                            uploadedImgUrlLocal = url
                        }
                    }
                    // todo handle progress
                    return true
                }
                .padding(.bottom, 20)
                .padding(.top, 4)
            }
        }
        .onChange(of: toggleComments.state) { _ in
            fullscreenComments = !fullscreenComments
            if !showComments {
                showComments = true
            }
        }
        .padding(.leading, 25)
        .padding(.trailing, 25)
        .onAppear {
            commentsViewModel.updateIDs(personaID: persona.documentID, postID: post.documentID)
            endorsementViewModel.fetchData(post: post)
        }
        .id(post.documentID)
    }
    
    var showCommentHeader: [String: Bool] {
        var lastComment: Comment? = nil
        var map: [String: Bool] = [:]
        var counter = 0
        let maxWithoutHeader = 10
        let maxTimestampDifferenceSeconds = 600
        for comment in commentsViewModel.comments.reversed() {
            if let lastComment = lastComment {
                let hitMaxCount = counter == maxWithoutHeader
                let hitMaxTimeDiff = (comment.timestamp?.seconds ?? 0) - (lastComment.timestamp?.seconds ?? 0) > maxTimestampDifferenceSeconds
                map[comment.documentID] = lastComment.userID != comment.userID || hitMaxCount || hitMaxTimeDiff
                if hitMaxCount || hitMaxTimeDiff {
                    counter += 1
                } else {
                    counter = 0
                }
            } else {
                map[comment.documentID] = true
            }
            lastComment = comment
        }
        return map
    }
}

struct ThreadPreview: View {
    @Binding var showReplyDialog: Bool
    var post: Post
    var comment: Comment
    @State var threadHoveredOver = false
    @EnvironmentObject var usersViewModel: UsersViewModel
    @EnvironmentObject var myUserViewModel: MyUserViewModel
    @State var identityIDProfileImgUrl: String? = nil
    @State var identityIDName: String? = nil
    @StateObject var threadViewModel = ThreadViewModel()
    @State var newCommentText = ""
    @State var commentDropIsTargeted = false
    @State var uploadedImgUrl: String? = nil
    @State var uploadedImgUrlLocal: URL? = nil
    
    var body: some View {
        if comment.latestThreadComment.userID != "" || showReplyDialog {
            HStack(alignment: .top, spacing: 0) {
                Rectangle()
                    .fill(Color.gray)
                    .frame(width: 20, height: 1, alignment: .center)
                    .padding(.top, 20)
                VStack {
                    VStack {
                        if showReplyDialog {
                            LazyVStack(alignment: .leading, spacing: 0) {
                                ForEach(threadViewModel.comments, id: \.documentID) {threadComment in
                                    CommentDisplay(post: post, comment: threadComment, showHeader: true)
                                }
                            }
                            .rotationEffect(Angle(degrees: 180)).scaleEffect(x: -1.0, y: 1.0, anchor: .center)
                            HStack {
                                if let myUser = myUserViewModel.myUser {
                                    AuthorImage(authorProfileImgUrl: myUser.profileImgUrl, size: AuthorSizes.small)
                                    if let presentUrl = uploadedImgUrlLocal {
                                        ZStack(alignment: .topTrailing) {
                                            Image(nsImage: NSImage(byReferencing: presentUrl))
                                                .frame(width: 50, height: 50)
                                                .cornerRadius(4)
                                            Image(systemName: "x.circle.fill")
                                                .offset(x: 15, y: -5)
                                                .onTapGesture {
                                                    uploadedImgUrl = nil
                                                    uploadedImgUrlLocal = nil
                                                }
                                        }
                                    }
                                    NSTextFieldEntry(text: $newCommentText, placeHolder: "Reply", font: AppFont.commonNSFont(size: FontSize.medium, weight: FontWeight.regular)) {
                                        comment.createThreadComment(userID: myUser.documentID, text: newCommentText, mediaUrl: uploadedImgUrl)
                                        uploadedImgUrl = nil
                                        uploadedImgUrlLocal = nil
                                        newCommentText = ""
                                    }
                                }
                            }
                            .onDrop(of: ["public.file-url"], isTargeted: $commentDropIsTargeted) { items,_ in
                                guard items.count == 1, let item = items.first else { return false }
                                let progress = item.loadObject(ofClass: URL.self) { url, _ in
                                    if let url = url, let nsurl = NSURL(string: url.absoluteString), let userID = myUserViewModel.userID {
                                        uploadedImgUrl = uploadImage(userID: userID, url: nsurl)
                                        uploadedImgUrlLocal = url
                                    }
                                }
                                // todo handle progress
                                return true
                            }
                            .padding(.bottom, 3)
                            .padding(.top, 2)
                        } else {
                            if let author = usersViewModel.users[comment.latestThreadComment.userID], let authorProfileImgUrl = author.profileImgUrl {
                                HStack {
                                    AuthorImage(authorProfileImgUrl: comment.anonymous ? anonymousProfileImgUrl : authorProfileImgUrl, size: AuthorSizes.small)
                                    Text(comment.latestThreadComment.anonymous || comment.latestThreadComment.identityID != nil ? identityIDName ?? "Untitled" : author.userName)
                                        .font(AppFont.commonFont(size: FontSize.small, weight: FontWeight.bold))
                                    if let timestamp = comment.timestamp {
                                        Text(timestampToDateString(timestamp: timestamp))
                                            .font(AppFont.commonFont(size: FontSize.tiny, weight: FontWeight.thin))
                                    }
                                    Spacer()
                                }
                                .padding(.top, 2)
                            } else {
                                HStack { Spacer() }
                            }
                            HStack {
                                Text(comment.latestThreadComment.text)
                                    .font(AppFont.commonFont(size: FontSize.medium, weight: FontWeight.regular))
                                    .lineSpacing(5)
                                    .foregroundColor(.gray)
                                Spacer()
                            }
                        }
                    }
                    .padding(.leading, 12)
                    .padding(.trailing, 12)
                    .padding(.top, 8)
                    .padding(.bottom, 8)
                    .background(threadHoveredOver ? CustomSwiftUIColors.lightGray : .clear)
                    .cornerRadius(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.gray, lineWidth: 1)
                        )
                    if comment.numThreadComments > 1 && threadViewModel.comments.isEmpty {
                        HStack {
                            Text("\(comment.numThreadComments) replies")
                                .font(AppFont.commonFont(size: FontSize.medium, weight: FontWeight.regular))
                                .lineSpacing(5)
                                .foregroundColor(.gray)
                                .padding(.leading, 15)
                            Spacer()
                        }
                    }
                }
                .padding(.top, 3)
            }
            .padding(.leading, 12)
            .padding(.trailing, 2)
            .opacity(0.8)
            .rotationEffect(Angle(degrees: 180)).scaleEffect(x: -1.0, y: 1.0, anchor: .center)
            .whenHovered { inside in
                threadHoveredOver = inside
            }
            .onAppear {
                if comment.latestThreadComment.anonymous || comment.latestThreadComment.identityID != nil {
                    if let id = comment.identityID {
                        Firestore.firestore().collection("personas").document(id).getDocument { documentSnapshot, error in
                            guard let document = documentSnapshot else {
                                print("Document not found")
                                return
                            }
                            let profileImgUrl = document.get("profileImgUrl") as? String ?? personaDefaultProfileUrl
                            let name = document.get("name") as? String ?? "Untitled"
                            self.identityIDProfileImgUrl = profileImgUrl
                            self.identityIDName = name
                        }
                    }
                }
            }
            .onChange(of: comment.latestThreadComment.identityID) { [comment] identityID in
                if comment.latestThreadComment.anonymous || identityID != nil {
                    if let id = identityID {
                        Firestore.firestore().collection("personas").document(id).getDocument { documentSnapshot, error in
                            guard let document = documentSnapshot else {
                                print("Document not found")
                                return
                            }
                            let profileImgUrl = document.get("profileImgUrl") as? String ?? personaDefaultProfileUrl
                            let name = document.get("name") as? String ?? "Untitled"
                            self.identityIDProfileImgUrl = profileImgUrl
                            self.identityIDName = name
                        }
                    }
                }
            }
            .onTapGesture {
                if threadViewModel.rootComment == nil {
                    showReplyDialog = true
                } else {
                    showReplyDialog = false
                }
            }
            .onChange(of: comment.latestThreadComment.userID != "") { latestThreadCommentExists in
                if threadViewModel.rootComment == nil && latestThreadCommentExists {
                    threadViewModel.registerThreadListener(onComment: comment)
                }
            }
            .onChange(of: showReplyDialog) { showThread in
                if showThread {
                    threadViewModel.registerThreadListener(onComment: comment)
                } else {
                    threadViewModel.reset()
                }
            }
        }
    }
    
    var anonymousProfileImgUrl: String {
        if let identityIDProfileImgUrl = identityIDProfileImgUrl {
            return identityIDProfileImgUrl
        } else {
            return personaDefaultProfileUrl
        }
    }
}

struct CommentDisplay: View {
    var post: Post
    var comment: Comment
    var showHeader: Bool
    @EnvironmentObject var usersViewModel: UsersViewModel
    @EnvironmentObject var myUserViewModel: MyUserViewModel
    @State var hoveredOver = false
    @State var identityIDProfileImgUrl: String? = nil
    @State var identityIDName: String? = nil
    @State var showReplyDialog = false
    
    var body: some View {
        VStack {
            ThreadPreview(showReplyDialog: $showReplyDialog, post: post, comment: comment)
            ZStack(alignment: .bottomTrailing) {
                VStack(alignment: .leading, spacing: 3) {
                    if let author = usersViewModel.users[comment.userID], let authorProfileImgUrl = author.profileImgUrl, showHeader {
                        HStack {
                            AuthorImage(authorProfileImgUrl: comment.anonymous ? anonymousProfileImgUrl : authorProfileImgUrl, size: AuthorSizes.small)
                            Text(comment.anonymous || comment.identityID != nil ? identityIDName ?? "Untitled" : author.userName)
                                .font(AppFont.commonFont(size: FontSize.medium, weight: FontWeight.bold))
                            if let timestamp = comment.timestamp {
                                Text(timestampToDateString(timestamp: timestamp))
                                    .font(AppFont.commonFont(size: FontSize.tiny, weight: FontWeight.thin))
                            }
                            Spacer()
                            if comment.seen.keys.filter { $0 != myUserViewModel.userID } .count > 1 {
                                Text("\(comment.seen.keys.filter { $0 != myUserViewModel.userID } .count)")
                                    .font(AppFont.commonFont(size: FontSize.tiny, weight: FontWeight.thin))
                                    .foregroundColor(.gray)
                                    .offset(x: 5, y: 1)
                            }
                            Image(systemName: "eye")
                                .font(.system(size: 10))
                                .foregroundColor(CustomSwiftUIColors.mediumGray)
                        }
                        .padding(.top, 4)
                    } else {
                        HStack { Spacer() }
                    }
                    if let postTextQuoted = comment.postTextQuoted {
                        VStack(alignment: .leading) {
                            Text("Replying to \(post.title)")
                                .font(AppFont.commonFont(size: FontSize.medium, weight: FontWeight.bold))
                                .padding(.bottom, 2)
                                .foregroundColor(.gray)
                            Text("... \(postTextQuoted) ...")
                                .font(AppFont.commonFont(size: FontSize.medium, weight: FontWeight.italics))
                                .lineSpacing(3)
                                .foregroundColor(.gray)
                        }
                        .padding(.leading, 12)
                        .padding(.trailing, 12)
                        .padding(.top, 8)
                        .padding(.bottom, 8)
                        .background(CustomSwiftUIColors.lightGray)
                        .cornerRadius(10)
                        .padding(.top, 5)
                        .padding(.bottom, 5)
                    }
                    Text(comment.text)
                        .font(AppFont.commonFont(size: FontSize.large, weight: FontWeight.regular))
                        .lineSpacing(5)
                        .foregroundColor(.gray)
                        .padding(.top, 4)
                        .padding(.bottom, 4)
                    if comment.mediaUrl != "" {
                        HStack {
                            AsyncLoadImage(mediaUrl: comment.mediaUrl, targetWidth: 250)
                                .cornerRadius(7)
                        }
                    }
                    HStack {
                        ForEach(comment.endorsements.map { React(emoji: $0.key, endorsers: $0.value) }.sorted { a, b in a.emoji > b.emoji }, id: \.emoji) { react in
                            if react.endorsers.count > 0 {
                                let iEndorsed = react.endorsers.contains(myUserViewModel.userID ?? "")
                                Text("\(react.emoji) \(react.endorsers.count)")
                                    .font(AppFont.commonFont(size: FontSize.small, weight: FontWeight.regular))
                                    .padding(.top, 6)
                                    .padding(.leading, 8)
                                    .padding(.trailing, 8)
                                    .padding(.bottom, 4)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 40)
                                            .stroke(iEndorsed ? .gray : CustomSwiftUIColors.mediumGray, lineWidth: 1)
                                        )
                                    .padding(.bottom, 3)
                                    .onTapGesture {
                                        if let userID = myUserViewModel.userID {
                                            comment.toggleReact(emoji: react.emoji, userID: userID)
                                        }
                                    }
                            }
                        }
                    }
                }
                .padding(.leading, 10)
                .padding(.trailing, 10)
                .padding(.bottom, 0)
                .background(hoveredOver ? CustomSwiftUIColors.lighterBackgroundBlue : .clear)
                .cornerRadius(10)
                .padding(.top, showHeader ? 10 : 0)
                .whenHovered { inside in
                    hoveredOver = inside
                }
                .contextMenu {
                    if !comment.isThread {
                        Button {
                            showReplyDialog = !showReplyDialog
                        } label: {
                            Text(showReplyDialog ? "Hide replies" : "Reply")
                        }
                        Divider()
                    }
                    Button {
                        comment.delete()
                    } label: {
                        Text("Delete")
                    }
                }
                .rotationEffect(Angle(degrees: 180)).scaleEffect(x: -1.0, y: 1.0, anchor: .center)
                .onAppear {
                    if comment.anonymous || comment.identityID != nil {
                        if let id = comment.identityID {
                            Firestore.firestore().collection("personas").document(id).getDocument { documentSnapshot, error in
                                guard let document = documentSnapshot else {
                                    print("Document not found")
                                    return
                                }
                                let profileImgUrl = document.get("profileImgUrl") as? String ?? personaDefaultProfileUrl
                                let name = document.get("name") as? String ?? "Untitled"
                                self.identityIDProfileImgUrl = profileImgUrl
                                self.identityIDName = name
                            }
                        }
                    }
                }
                .onChange(of: comment.identityID) { [comment] identityID in
                    if comment.anonymous || identityID != nil {
                        if let id = identityID {
                            Firestore.firestore().collection("personas").document(id).getDocument { documentSnapshot, error in
                                guard let document = documentSnapshot else {
                                    print("Document not found")
                                    return
                                }
                                let profileImgUrl = document.get("profileImgUrl") as? String ?? personaDefaultProfileUrl
                                let name = document.get("name") as? String ?? "Untitled"
                                self.identityIDProfileImgUrl = profileImgUrl
                                self.identityIDName = name
                            }
                        }
                    }
                }
                if hoveredOver {
                    VStack() {
                        HStack(alignment: .top) {
                            Spacer()
                            if let userID = myUserViewModel.userID {
                                ForEach(["👍", "❤️", "💯", "🤣", "🔥", "🤔"], id: \.self) { emoji in
                                    Button(emoji) {
                                        comment.toggleReact(emoji: emoji, userID: userID)
                                    }
                                }
                            }
                        }
                    }
                    .rotationEffect(Angle(degrees: 180)).scaleEffect(x: -1.0, y: 1.0, anchor: .center)
                    .offset(x: 0, y: showHeader ? 0 : 14)
                    .padding(.trailing, 10)
                }
            }
            .onAppear {
                if let userID = myUserViewModel.userID, !comment.hasSeenUser(userID: userID) {
                    comment.addSeenUser(userID: userID)
                }
            }
        }
    }
    
    var anonymousProfileImgUrl: String {
        if let identityIDProfileImgUrl = identityIDProfileImgUrl {
            return identityIDProfileImgUrl
        } else {
            return personaDefaultProfileUrl
        }
    }
}

