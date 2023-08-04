import SwiftUI
import FirebaseFirestore

enum AuthorSizes {
    case small
    case big
}

struct Author: View {
    var author: User
    
    var body: some View {
        HStack {
            AuthorImage(authorProfileImgUrl: author.profileImgUrl)
            Text("\(author.userName)").font(.footnote).italic()
        }
    }
}

struct AuthorImage: View {
    var authorProfileImgUrl: String
    var size = AuthorSizes.small
    
    var body: some View {
        AsyncLoadImage(mediaUrl: authorProfileImgUrl, targetWidth: picSize, displaySquare: true)
            .frame(width: CGFloat(picSize), height: CGFloat(picSize), alignment: .center)
            .cornerRadius(50)
    }
    
    var picSize: Int {
        return size == AuthorSizes.small ? 20 : 27
    }
}

struct PersonaHeader: View {
    var persona: Persona
    var users: [String: User]
    var body: some View {
        VStack(alignment: .leading, spacing: 40) {
            HStack(alignment: .top) {
                AsyncLoadImage(mediaUrl: persona.profileImgUrl, targetWidth: 80, displaySquare: true)
                    .frame(width: 80, height: 80)
                    .cornerRadius(20)
                VStack(alignment: .leading) {
                    HStack {
                        Text("\(persona.name)").font(.title).padding(.bottom, 2)
                        if persona.priv {
                            Image(systemName: "lock")
                                .foregroundColor(.gray)
                        }
                        if persona.anonymous {
                            Image(systemName: "eyeglasses")
                                .foregroundColor(.gray)
                        }
                    }
                    Text("\(persona.bio)").font(.body).fixedSize(horizontal: false, vertical: true)
                    HStack {
                        ForEach(persona.authors, id: \.self) {author in
                            if let user = users[author] {
                                Author(author: user)
                            }
                        }
                    }
                }.padding(.leading, 10)
            }
            Spacer()
        }
        .frame(maxHeight: 100, alignment: .topLeading)
        .padding(.top, 20)
    }
}

enum FocusDocumentMode {
    case auto
    case focus
}

struct PostEditorWrapped: View {
    var persona: Persona
    var post: Post
    var author: User?
    var search: String
    @EnvironmentObject var myUserViewModel: MyUserViewModel
    @EnvironmentObject var usersViewModel: UsersViewModel
    @State var focusDocumentMode = FocusDocumentMode.auto
    @State var viewDims = CGSize(width: 0, height: 0)
    @State var scrollHeight: CGFloat = 0
    
    var body: some View {
        if let myUser = myUserViewModel.myUser {
            GeometryReader { scrollGeo in
                ScrollView {
                    VStack {
                        HStack(alignment: .top, spacing: -7) {
                            VStack(alignment: .leading) {
                                if !post.anonymous {
                                    if let user = author {
                                        AuthorImage(authorProfileImgUrl: user.profileImgUrl, size: AuthorSizes.big)
                                            .onTapGesture {
                                                let detailView = UserDetail(user: user)
                                                let controller = DetailWindowController(rootView: detailView)
                                                controller.window?.title = user.userName
                                                controller.showWindow(nil)
                                            }
                                            .whenHovered { inside in
                                                if inside && NSCursor.current != NSCursor.arrow {
                                                    NSCursor.arrow.push()
                                                }
                                            }
                                    }
                                } else {
                                    AuthorImage(authorProfileImgUrl: persona.profileImgUrl, size: AuthorSizes.big)
                                        .onTapGesture {
                                            let detailView = PersonaHeader(persona: persona, users: usersViewModel.users)
                                            let controller = DetailWindowController(rootView: detailView)
                                            controller.window?.title = persona.name
                                            controller.showWindow(nil)
                                        }
                                        .whenHovered { inside in
                                            if inside && NSCursor.current != NSCursor.arrow {
                                                NSCursor.arrow.push()
                                            }
                                        }
                                }
                            }
                            VStack(alignment: .leading) {
                                let editingIdentity = post.anonymous ? (post.identityID ?? persona.documentID) : myUser.documentID
                                let latestRemoteSaveTimestamp = post.editDate?.seconds ?? 0 > post.intermediateEditDate?.seconds ?? 0 ? post.editDate : post.intermediateEditDate
                                let emptyTitleAndPost = post.title == "" && post.text == ""
                                RichTextEditor(rawText: emptyTitleAndPost ? "" : post.title + "\n" + post.text, search: search, documentPath: documentPath, personaID: persona.documentID, postID: post.documentID, editingIdentity: editingIdentity, focusDocumentMode: $focusDocumentMode, targetHeight: scrollHeight, latestRemoteSaveTimestamp: latestRemoteSaveTimestamp, mediaUrls: mediaUrls, mediaLocations: post.mediaLocations)
                                    .padding(.top, -3)
                                    .padding(.bottom, 10)
                                
                            }
                        }
                        .onChange(of: scrollGeo.size.height) { newHeight in
                            scrollHeight = newHeight
                        }
                        .onAppear {
                            if post.text + post.title == "" {
                                focusDocumentMode = FocusDocumentMode.focus
                            }
                        }
                        .padding(.top, 10)
                        .padding(.leading, 30)
                        .padding(.trailing, 60)
                    }
                }
                .onTapGesture {
                    focusDocumentMode = FocusDocumentMode.focus
                }
            }
        } else {
            EmptyView()
        }
    }
    
    private var mediaUrls: [Media] {
        var mediaUrls: [Media] = []
        if post.mediaUrl != "" && post.mediaType == Post.MediaType.PHOTO {
            mediaUrls = [Media(url: post.mediaUrl, targetWidth: 300)]
        }
        for uri in post.galleryUris {
            mediaUrls.append(Media(url: uri.uri, targetWidth: 300))
        }
        return mediaUrls
    }
    
    private var documentPath: String {
        "personas/\(persona.documentID)/posts/\(post.documentID)"
    }
}

struct PostEditor: View {
    var persona: Persona
    var postID: String
    var post: Post? = nil
    var search: String
    @EnvironmentObject var myUserViewModel: MyUserViewModel
    @EnvironmentObject var usersViewModel: UsersViewModel
    @StateObject var singlePostViewModel = SinglePostViewModel()
    
    var body: some View {
        VStack {
            if let post = post {
                let author = usersViewModel.users[post.authorID]
                PostEditorWrapped(persona: persona, post: post, author: author, search: search)
            }
            if let post = singlePostViewModel.post {
                let author = usersViewModel.users[post.authorID]
                PostEditorWrapped(persona: persona, post: post, author: author, search: search)
            }
        }
        .id(postID)
        .onAppear {
            if post == nil {
                singlePostViewModel.fetchData(personaID: persona.documentID, postID: postID)
            }
        }
    }
}

struct React {
    let emoji: String
    let endorsers: [String]
}

extension String {
    func split(usingRegex pattern: String) -> [String] {
        let regex = try! NSRegularExpression(pattern: pattern)
        let matches = regex.matches(in: self, range: NSRange(0..<utf16.count))
        let ranges = [startIndex..<startIndex] + matches.map{Range($0.range, in: self)!} + [endIndex..<endIndex]
        return (0...matches.count).map {String(self[ranges[$0].upperBound..<ranges[$0+1].lowerBound])}
    }
}

struct PostPreview: View {
    var persona: Persona
    var post: Post
    var author: User?
    var showPublishDate: Bool
    @EnvironmentObject private var usersViewModel: UsersViewModel
    
    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading) {
                if !post.anonymous {
                    if let user = author {
                        AuthorImage(authorProfileImgUrl: user.profileImgUrl)
                    }
                } else {
                    AuthorImage(authorProfileImgUrl: persona.profileImgUrl)
                }
            }
            .padding(.trailing, 7)
            VStack(alignment: .leading) {
                HStack {
                    let emptyTitle = post.title == ""
                    Text(emptyTitle ? "A blank canvas" : post.title)
                        .font(AppFont.commonFont(size: FontSize.large, weight: FontWeight.bold))
                        .foregroundColor(emptyTitle ? .gray : .black)
                        .padding(.bottom, 1)
                        .padding(.top, 4.5)
                }
                if (post.mediaUrl != "" && post.mediaType == Post.MediaType.PHOTO) || post.galleryUris.count > 0, let url = post.mediaUrl != "" ? post.mediaUrl : post.galleryUris.first?.uri {
                    HStack {
                        AsyncLoadImage(mediaUrl: url, targetWidth: 100, displaySquare: true)
                            .cornerRadius(7)
                    }
                }
                let text = abbreviatedText == "" ? "What will this become?" : abbreviatedText
                Text(text.trimmingCharacters(in: .newlines))
                    .font(AppFont.commonFont(size: FontSize.small, weight: FontWeight.regular))
                    .foregroundColor(.gray)
                    .lineSpacing(3)
                    .padding(.bottom, 3)
                HStack {
                    Spacer()
                    if showPublishDate {
                        if let timestamp = post.publishDate {
                            Text(timestampToDateString(timestamp: timestamp))
                                .font(AppFont.commonFont(size: FontSize.tiny, weight: FontWeight.thin))
                        }
                        if let timestamp = post.editDate {
                            Text("[edit " + timestampToDateString(timestamp: timestamp) + "]")
                                .font(AppFont.commonFont(size: FontSize.tiny, weight: FontWeight.thin))
                        }
                    } else {
                        if let timestamp = post.editDate {
                            Text(timestampToDateString(timestamp: timestamp))
                                .font(AppFont.commonFont(size: FontSize.tiny, weight: FontWeight.thin))
                        }
                        if let timestamp = post.publishDate {
                            Text("[pub " + timestampToDateString(timestamp: timestamp) + "]")
                                .font(AppFont.commonFont(size: FontSize.tiny, weight: FontWeight.thin))
                        }
                    }
                    if !post.published {
                        Text("unpublished")
                            .font(AppFont.commonFont(size: FontSize.tiny, weight: FontWeight.thin))
                            .foregroundColor(.red)
                    }
                }
                .padding(.bottom, 2)
            }
            Spacer()
        }
        .padding(.leading, 20).padding(.trailing, 20).padding(.top, 15).padding(.bottom, 15)
    }
    
    private var abbreviatedText: String {
        return post.text.prefix(220) + (post.text.count > 220 ? " ..." : "")
    }
}

struct OpenInNewWindow: View {
    @EnvironmentObject private var usersViewModel: UsersViewModel
    @EnvironmentObject private var myUserViewModel: MyUserViewModel
    @EnvironmentObject private var formatDocumentViewModel: FormatDocumentViewModel
    @EnvironmentObject private var respondingPost: RespondingPost
    
    var persona: Persona
    var post: Post
    var author: User
    
    var body: some View {
        Button {
            let detailView = PostEditor(persona: persona, postID: post.documentID, search: "")
                .environmentObject(myUserViewModel)
                .environmentObject(usersViewModel)
                .environmentObject(formatDocumentViewModel)
                .environmentObject(respondingPost)
            let controller = DetailWindowController(rootView: detailView, width: 500, height: 600)
            controller.window?.backgroundColor = NSColor.white
            controller.window?.titleVisibility = .hidden
            controller.window?.titlebarAppearsTransparent = true
            controller.showWindow(nil)
        } label: {
            Text("Open In New Window")
        }
    }
}

struct PostPreviewHovered: View {
    var persona: Persona
    var post: Post
    @Binding var focusedPostID: String?
    var search: String
    var showPublishDate: Bool
    @EnvironmentObject private var usersViewModel: UsersViewModel
    @EnvironmentObject private var myUserViewModel: MyUserViewModel
    @EnvironmentObject private var formatDocumentViewModel: FormatDocumentViewModel
    @EnvironmentObject private var respondingPost: RespondingPost
    @State var hoveredOver = false
    
    var body: some View {
        // todo - should happen via RH click
        VStack(spacing: 0) {
            PostPreview(persona: persona, post: post, author: usersViewModel.users[post.authorID], showPublishDate: showPublishDate)
                .id(post.documentID)
                .contentShape(Rectangle())
            Divider()
        }
        .onTapGesture() {
            if self.focusedPostID == post.documentID {
                let detailView = PostEditor(persona: persona, postID: post.documentID, search: search)
                    .environmentObject(myUserViewModel)
                    .environmentObject(usersViewModel)
                    .environmentObject(formatDocumentViewModel)
                    .environmentObject(respondingPost)
                let controller = DetailWindowController(rootView: detailView, width: 500, height: 600)
                controller.window?.backgroundColor = NSColor.white
                controller.window?.titleVisibility = .hidden
                controller.window?.titlebarAppearsTransparent = true
                controller.showWindow(nil)
            } else {
                self.focusedPostID = post.documentID
            }
        }
        .whenHovered { inside in
            hoveredOver = inside
        }
        .background(hoveredOver ? CustomSwiftUIColors.lighterBackgroundBlue : .clear)
        .contextMenu {
            if let author = usersViewModel.users[post.authorID] {
                OpenInNewWindow(persona: persona, post: post, author: author)
            }
            Divider()
            if post.published {
                Button {
                    post.setDraft()
                } label: {
                    Text("Set as draft")
                }
            } else {
                Button {
                    post.publish()
                } label: {
                    Text("Publish")
                }
            }
            Divider()
            Button {
                post.delete()
            } label: {
                Text("Delete")
            }
        }
        .frame(minWidth: 150)
        .background(focusedPostID == post.documentID ? Color(red: 240 / 255, green: 247 / 255, blue: 255 / 255) : .clear)
    }
}

struct Posts: View {
    var persona: Persona
    @EnvironmentObject private var usersViewModel: UsersViewModel
    @EnvironmentObject private var myUserViewModel: MyUserViewModel
    @EnvironmentObject private var formatDocumentViewModel: FormatDocumentViewModel
    @EnvironmentObject private var respondingPost: RespondingPost
    var posts: [Post] = []
    @Binding var focusedPostID: String?
    var search: String
    var showPublishDate: Bool
    
    var body: some View {
        ScrollViewReader { scrollProxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(filteredPosts, id: \.documentID) {post in
                        PostPreviewHovered(persona: persona, post: post, focusedPostID: $focusedPostID, search: search, showPublishDate: showPublishDate)
                    }
                }
            }
            .whenHovered { inside in
                if inside && NSCursor.current != NSCursor.arrow {
                    NSCursor.arrow.push()
                }
            }
            .padding(.top, -30)
            .onChange(of: persona.documentID) {_ in
                if let focusedPostID = focusedPostID {
                    scrollProxy.scrollTo(focusedPostID)
                }
                self.focusedPostID = nil
            }
            .onChange(of: search) { _ in
                if let focusedPostID = focusedPostID {
                    scrollProxy.scrollTo(focusedPostID)
                }
            }
            .onChange(of: filteredPosts.map { $0.documentID }) {newDocumentIDs in
                if !newDocumentIDs.contains(where: { $0 == focusedPostID}) {
                    if newDocumentIDs.count > 0 {
                        let firstPostID = newDocumentIDs[0]
                        self.focusedPostID = firstPostID
                    } else {
                        self.focusedPostID = nil
                    }
                }
            }
            .onChange(of: focusedPostID) { newPostID in
                if let newPostID = newPostID {
                    respondingPost.selected = PostEditorGroup(postID: newPostID, persona: persona)
                }
            }
            .onChange(of: respondingPost.selected?.postID) { [focusedPostID] possibleNewPostID in
                if possibleNewPostID != focusedPostID {
                    self.focusedPostID = possibleNewPostID
                }
            }
            .frame(minWidth: 150, idealWidth: 250, maxWidth: 300)
        }
    }
    
    
    var filteredPosts: [Post] {
        posts.filter {post in
            if search.isEmpty {
                return true
            } else {
                return post.title.localizedCaseInsensitiveContains(search) ||
                post.text.localizedCaseInsensitiveContains(search) || post.documentID == focusedPostID
            }
        }
        .sorted {(postA, postB) in
            if showPublishDate {
                if postA.publishDate?.seconds != nil, postB.publishDate == nil {
                    return true
                }
                if postB.publishDate?.seconds != nil, postA.publishDate == nil {
                    return true
                }
                if let publishA = postA.publishDate?.seconds, let publishB = postB.publishDate?.seconds {
                    return publishA > publishB
                }
                return true
            } else {
                if postA.editDate?.seconds != nil, postB.editDate == nil {
                    return false
                }
                if postB.editDate?.seconds != nil, postA.editDate == nil {
                    return true
                }
                if let editA = postA.editDate?.seconds, let editB = postB.editDate?.seconds {
                    return editA > editB
                }
                return true
            }
        }
    }
}

struct NewPostButton: View {
    @State private var overBtn = false
    var activePersona: Persona
    @Binding var focusedPostID: String?
    @EnvironmentObject var myUserViewModel: MyUserViewModel
    
    let lightGray = Color(red: 237 / 255, green: 237 / 255, blue: 237 / 255)
    
    var body: some View {
        ZStack(alignment: .center) {
            RoundedRectangle(cornerRadius: 5)
                .fill(overBtn ? lightGray : .clear)
                .frame(width: 28, height: 22)
            Image(systemName: "plus")
                .font(.system(size: 14))
        }
        .whenHovered { inside in
            overBtn = inside
        }
        .onTapGesture {
            if let userID = myUserViewModel.myUser?.documentID {
                let identityID = activePersona.anonymous ? activePersona.documentID : nil
                let ref = Post.createNew(onPersonaID: activePersona.documentID, authorID: userID, identityID: identityID)
                focusedPostID = ref.documentID
            }
        }
        .padding(.leading, -3)
    }
}

struct PostOrderingButton: View {
    @State private var overBtn = false
    @Binding var showPublishDate: Bool
    
    let lightGray = Color(red: 237 / 255, green: 237 / 255, blue: 237 / 255)
    
    var body: some View {
        ZStack(alignment: .center) {
            RoundedRectangle(cornerRadius: 5)
                .fill(overBtn ? lightGray : .clear)
                .frame(width: 28, height: 22)
            Image(systemName: showPublishDate ? "square.and.arrow.up" : "square.and.arrow.down")
                .font(.system(size: 14))
                .padding(.top, showPublishDate ? -1 : 0)
        }
        .whenHovered { inside in
            overBtn = inside
        }
        .onTapGesture {
            self.showPublishDate = !showPublishDate
        }
        .padding(.leading, 6)
    }
}

struct PersonaEditor: View {
    var persona: Persona
    @EnvironmentObject private var usersViewModel: UsersViewModel
    @StateObject private var postsViewModel = PostViewModel()
    @State var focusedPostID: String?
    @Binding var search: String
    @State var previewWidth: CGFloat? = nil
    @State var showPublishDate = false
    @State var fullscreenComments = false
    
    var body: some View {
        ZStack {
            Color.white
                .padding(.top, -38)
            HSplitView() {
                VStack(alignment: .leading)  {
                    HStack(alignment: .center) {
                        NSSearchBar(search: $search)
                        PostOrderingButton(showPublishDate: $showPublishDate)
                        NewPostButton(activePersona: persona, focusedPostID: $focusedPostID)
                    }
                    .padding(.top, -15)
                    .padding(.leading, 20)
                    .padding(.trailing, 15)
                    .padding(.bottom, 25)
                    Divider()
                        .padding(.top, -22)
                    Posts(persona: persona, posts: postsViewModel.posts, focusedPostID: $focusedPostID, search: search, showPublishDate: showPublishDate)
                        .padding(.top, 1)
                }
                .frame(maxWidth: 300)
                if let post = selectedPost {
                    VStack() {
                        PostEditor(persona: persona, postID: post.documentID, post: post, search: search)
                            .id(post.documentID)
                            .frame(minWidth: 400, idealWidth: 700, maxHeight: fullscreenComments ? 0 : nil)
                        PostDiscussion(persona: persona, post: post, search: search, fullscreenComments: $fullscreenComments)
                    }
                } else {
                    Spacer().frame(minWidth: 400, idealWidth: 700)
                }
            }
            .onAppear() {
                self.postsViewModel.updatePersonaID(documentID: persona.documentID)
            }
            .onChange(of: persona.documentID) {newDocumentID in
                self.postsViewModel.updatePersonaID(documentID: newDocumentID)
            }
        }
    }
    
    var selectedPost: Post? {
        postsViewModel.posts.first(where: { $0.documentID == focusedPostID })
    }
}
