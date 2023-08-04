import Combine
import Foundation
import SwiftUI
import FirebaseFirestore

enum FormatDocument {
    case auto
    case heading
    case bold
    case italic
    case highlight
    case list
    case blockQuote
    case link
}

class FormatDocumentViewModel: ObservableObject {
    @Published var formatDocument = FormatDocument.auto
    @Published var formattingPossible = false
    
    func insertLink() {
        formatDocument = FormatDocument.link
    }
    
    func makeLineHeading() {
        formatDocument = FormatDocument.heading
    }
    
    func makeLineList() {
        formatDocument = FormatDocument.list
    }
    
    func makeSelectionBold() {
        formatDocument = FormatDocument.bold
    }
    
    func makeSelectionItalic() {
        formatDocument = FormatDocument.italic
    }
    
    func makeSelectionHighlight() {
        formatDocument = FormatDocument.highlight
    }
    
    func makeSelectionBlockQuote() {
        formatDocument = FormatDocument.blockQuote
    }
    
    func autoFormat() {
        formatDocument = FormatDocument.auto
    }
    
    func allowFormatting() {
        formattingPossible = true
    }
    
    func disallowFormatting() {
        formattingPossible = false
    }
}

let BASE_MENTION_LINK = "com.Persona.Persona.mention"

struct CustomColors {
    static let lightGray = NSColor(red: 190 / 255, green: 190 / 255, blue: 190 / 255, alpha: 1)
    static let backgroundBlue = NSColor(red: 240 / 255, green: 247 / 255, blue: 255 / 255, alpha: 1)
    static let ultraLightGray = NSColor(red: 250 / 255, green: 250 / 255, blue: 250 / 255, alpha: 1)
}

struct CustomSwiftUIColors {
    static let lighterBackgroundBlue = Color(red: 240 / 255, green: 247 / 255, blue: 255 / 255, opacity: 0.3)
    static let lightGray = Color(red: 250 / 255, green: 250 / 255, blue: 250 / 255, opacity: 1)
    static let mediumGray = Color(red: 220 / 255, green: 220 / 255, blue: 220 / 255, opacity: 1)
}

struct RichTextAttributes {
    var defaultFont: NSFont
    
    var title: [NSAttributedString.Key: Any] {
        get {
            let style = NSMutableParagraphStyle()
            style.paragraphSpacing = 25
            style.firstLineHeadIndent = 13
            style.headIndent = 13
            style.minimumLineHeight = 30
            
            let font = AppFont.commonNSFont(size: FontSize.extraLarge, weight: FontWeight.bold)
            return [NSAttributedString.Key.paragraphStyle: style, NSAttributedString.Key.font: font]
        }
    }
    
    var body: [NSAttributedString.Key: Any] {
        get {
            let style = NSMutableParagraphStyle()
            style.lineSpacing = 2
            style.firstLineHeadIndent = 13
            style.headIndent = 13
            style.minimumLineHeight = 22
            
            return [NSAttributedString.Key.paragraphStyle: style, NSAttributedString.Key.font: defaultFont]
        }
    }
    
    var bullet: [NSAttributedString.Key: Any] {
        get {
            let style = NSMutableParagraphStyle()
            style.lineSpacing = 2
            style.headIndent = 13
            style.firstLineHeadIndent = 2.25
            style.minimumLineHeight = 22
            
            return [NSAttributedString.Key.paragraphStyle: style, NSAttributedString.Key.font: defaultFont]
        }
    }
    
    var bulletCapture: [NSAttributedString.Key: Any] {
        get {
            let style = NSMutableParagraphStyle()
            style.lineSpacing = 2
            style.headIndent = 13
            style.firstLineHeadIndent = 2.25
            style.minimumLineHeight = 22
            
            return [NSAttributedString.Key.paragraphStyle: style, NSAttributedString.Key.font: defaultFont, NSAttributedString.Key.foregroundColor: NSColor.blue]
        }
    }
    
    var blockQuote: [NSAttributedString.Key: Any] {
        get {
            let style = NSMutableParagraphStyle()
            style.lineSpacing = 2
            style.firstLineHeadIndent = 13
            style.headIndent = 28.5
            style.minimumLineHeight = 22
            
            return [.paragraphStyle: style, .foregroundColor: NSColor.darkGray, .font: AppFont.commonNSFont(size: defaultFont.pointSize, weight: FontWeight.regular)]
        }
    }
    
    var blockQuoteCapture: [NSAttributedString.Key: Any] {
        get {
            let style = NSMutableParagraphStyle()
            style.lineSpacing = 2
            style.firstLineHeadIndent = 13
            style.headIndent = 28.5
            style.minimumLineHeight = 22
            
            return [.paragraphStyle: style, .font: AppFont.commonNSFont(size: defaultFont.pointSize + 2, weight: FontWeight.regular), .foregroundColor: CustomColors.lightGray]
        }
    }
    
    var bold: [NSAttributedString.Key: Any] {
        get {
            return [.font: AppFont.commonNSFont(size: defaultFont.pointSize, weight: FontWeight.bold)]
        }
    }
    
    var boldCapture: [NSAttributedString.Key: Any] {
        get {
            return [.foregroundColor: CustomColors.lightGray]
        }
    }
    
    var italic: [NSAttributedString.Key: Any] {
        get {
            return [.font: AppFont.commonNSFont(size: defaultFont.pointSize, weight: FontWeight.italics)]
        }
    }
    
    var italicCapture: [NSAttributedString.Key: Any] {
        get {
            return [.foregroundColor: CustomColors.lightGray]
        }
    }
    
    var code: [NSAttributedString.Key: Any] {
        get {
            return [.font: NSFont(name: "Menlo Regular", size: defaultFont.pointSize - 2 ), .backgroundColor: CustomColors.backgroundBlue, .foregroundColor: NSColor.darkGray]
        }
    }
    
    var codeFirstCapture: [NSAttributedString.Key: Any] {
        get {
            return [.foregroundColor: CustomColors.lightGray, .backgroundColor: CustomColors.backgroundBlue, .kern: 3]
        }
    }
    
    var codeSecondCapture: [NSAttributedString.Key: Any] {
        get {
            return [.foregroundColor: CustomColors.lightGray, .backgroundColor: CustomColors.backgroundBlue, .tracking: 3]
        }
    }
    
    var heading: [NSAttributedString.Key: Any] {
        get {
            let style = NSMutableParagraphStyle()
            style.paragraphSpacing = 15
            style.lineSpacing = 2
            style.headIndent = 13
            style.minimumLineHeight = 24
            
            return [.paragraphStyle: style, .font: AppFont.commonNSFont(size: defaultFont.pointSize + 2, weight: FontWeight.bold)]
        }
    }
    
    var headingCapture: [NSAttributedString.Key: Any] {
        get {
            let style = NSMutableParagraphStyle()
            style.paragraphSpacing = 15
            style.lineSpacing = 2
            style.headIndent = 13
            style.minimumLineHeight = 24
            
            return [.paragraphStyle: style, .font: AppFont.commonNSFont(size: defaultFont.pointSize + 2, weight: FontWeight.regular), .foregroundColor: CustomColors.lightGray]
        }
    }
    
    var hiddenMath: [NSAttributedString.Key: Any] {
        get {
            let style = NSMutableParagraphStyle()
            style.lineSpacing = 2
            style.firstLineHeadIndent = 13
            style.headIndent = 13
            style.minimumLineHeight = 16
            
            return [.paragraphStyle: style, .font: NSFont(name: "Menlo Regular", size: defaultFont.pointSize - 6 )!, .backgroundColor: CustomColors.ultraLightGray, .foregroundColor: NSColor.gray]
        }
    }
    
    var visibleMath: [NSAttributedString.Key: Any] {
        get {
            return [.font: NSFont(name: "Menlo Regular", size: defaultFont.pointSize )!, .backgroundColor: CustomColors.ultraLightGray, .foregroundColor: NSColor.gray]
        }
    }
}

func computeAttributes(oldAttributedString: String, fullAttrString: NSAttributedString? = nil, font: NSFont, enableMarkdown: Bool = true, users: [String: User], formatTitle: Bool = true, selectedRanges: [NSValue]? = nil) -> NSAttributedString {
    let richTextAttributes = RichTextAttributes(defaultFont: font)
    var mutableAttributedString: NSMutableAttributedString
    if let fullAttrString = fullAttrString {
        mutableAttributedString = NSMutableAttributedString(attributedString: fullAttrString)
        mutableAttributedString.setAttributes(richTextAttributes.body, range: NSMakeRange(0, mutableAttributedString.length))
        fullAttrString.enumerateAttribute(NSAttributedString.Key.attachment, in: NSMakeRange(0, fullAttrString.length), options: []) { (attr, range, _) in
            if let attachment = attr as? NSTextAttachment {
                mutableAttributedString.setAttributes([.attachment: attachment], range: range)
            }
        }
    } else {
        let baseAttrString = NSAttributedString(string: oldAttributedString, attributes: richTextAttributes.body)
        mutableAttributedString = NSMutableAttributedString(attributedString: baseAttrString)
    }
    
    let nsrange = NSRange(oldAttributedString.startIndex..<oldAttributedString.endIndex,
                          in: oldAttributedString)
    guard enableMarkdown else {
        return mutableAttributedString.attributedSubstring(from: nsrange)
    }
    
    var regex: NSRegularExpression
    
    let BULLET2 = "(?<firstCapture>• )(?<toModify>[^\n]*)"
    regex = try! NSRegularExpression(pattern: BULLET2, options: [])
    let matches = regex.matches(in: mutableAttributedString.string, options: [], range: nsrange)
    for match in matches {
        mutableAttributedString.addAttributes(richTextAttributes.bullet, range: match.range(withName: "toModify"))
        mutableAttributedString.addAttributes(richTextAttributes.bulletCapture, range: match.range(withName: "firstCapture"))
    }
    
    let BLOCK_QUOTE = "^(?<firstCapture>> )(?<toModify>[^\n]*)"
    regex = try! NSRegularExpression(pattern: BLOCK_QUOTE, options: [NSRegularExpression.Options.anchorsMatchLines])
    regex.enumerateMatches(in: oldAttributedString, options: [], range: nsrange) { (match, _, stop) in
        guard let match = match else { return }
        mutableAttributedString.addAttributes(richTextAttributes.blockQuote, range: match.range(withName: "toModify"))
        mutableAttributedString.addAttributes(richTextAttributes.blockQuoteCapture, range: match.range(withName: "firstCapture"))
    }
    
    let BOLD = "(?<firstCapture>\\*)(?=[^ \n])(?<toModify>[^\n\\*]*)(?<=[^ \n])(?<secondCapture>\\*)"
    regex = try! NSRegularExpression(pattern: BOLD, options: [])
    regex.enumerateMatches(in: oldAttributedString, options: [], range: nsrange) { (match, _, stop) in
        guard let match = match else { return }
        mutableAttributedString.addAttributes(richTextAttributes.bold, range: match.range(withName: "toModify"))
        mutableAttributedString.addAttributes(richTextAttributes.boldCapture, range: match.range(withName: "firstCapture"))
        mutableAttributedString.addAttributes(richTextAttributes.boldCapture, range: match.range(withName: "secondCapture"))
    }
    
    let MATH = "\\$\\$[^\\$]+\\$\\$"
    regex = try! NSRegularExpression(pattern: MATH, options: [])
    regex.enumerateMatches(in: oldAttributedString, options: [], range: nsrange) { (match, _, stop) in
        guard let match = match else { return }
        
        let cursorLocation = selectedRanges?.first?.rangeValue.location
        if let cursorLocation = cursorLocation, match.range.lowerBound < cursorLocation && cursorLocation < match.range.upperBound {
            mutableAttributedString.addAttributes(richTextAttributes.visibleMath, range: match.range)
        } else {
            mutableAttributedString.addAttributes(richTextAttributes.hiddenMath, range: match.range)
        }
    }
    
    let ITALICS = "(?<firstCapture>_)(?=[^ \n])(?<toModify>[^\n\\_]*)(?<=[^ \n])(?<secondCapture>_)"
    regex = try! NSRegularExpression(pattern: ITALICS, options: [])
    regex.enumerateMatches(in: oldAttributedString, options: [], range: nsrange) { (match, _, stop) in
        guard let match = match else { return }
        
        mutableAttributedString.addAttributes(richTextAttributes.italic, range: match.range(withName: "toModify"))
        mutableAttributedString.addAttributes(richTextAttributes.italicCapture, range: match.range(withName: "firstCapture"))
        mutableAttributedString.addAttributes(richTextAttributes.italicCapture, range: match.range(withName: "secondCapture"))
    }
    
    let CODE = "(?<![^ \n])(?<firstCapture>`)(?=[^\n])(?<toModify>[^\n`]*)(?<=[^\n])(?<secondCapture>`)(?![^ \n])"
    regex = try! NSRegularExpression(pattern: CODE, options: [])
    regex.enumerateMatches(in: oldAttributedString, options: [], range: nsrange) { (match, _, stop) in
        guard let match = match else { return }
        
        mutableAttributedString.addAttributes(richTextAttributes.code, range: match.range(withName: "toModify"))
        mutableAttributedString.addAttributes(richTextAttributes.codeFirstCapture, range: match.range(withName: "firstCapture"))
        mutableAttributedString.addAttributes(richTextAttributes.codeSecondCapture, range: match.range(withName: "secondCapture"))
    }
    
    let userNames = Set(users.values.map { user in
        user.userName
    })
    let userNameToId = Dictionary(uniqueKeysWithValues: users.values.map { ($0.userName, $0.documentID) })
    let MENTION = "@(?<possibleUserName>[a-zA-Z0-9]+)"
    regex = try! NSRegularExpression(pattern: MENTION, options: [])
    regex.enumerateMatches(in: oldAttributedString, options: [], range: nsrange) { (match, _, stop) in
        guard let match = match else { return }
        
        let possibleUserName = oldAttributedString[
            Range(match.range(withName: "possibleUserName"), in: oldAttributedString)!
        ]
        if userNames.contains(String(possibleUserName)) {
            mutableAttributedString.addAttributes([.font: font, .foregroundColor: NSColor.blue, .link: "\(BASE_MENTION_LINK)?id=\(userNameToId[String(possibleUserName)] ?? "")", .underlineColor: NSColor.clear], range: match.range)
        }
    }
    
    let MENTION_END = "@(?<possibleUserName>[a-zA-Z0-9]+)$"
    regex = try! NSRegularExpression(pattern: MENTION_END, options: [])
    regex.enumerateMatches(in: oldAttributedString, options: [], range: nsrange) { (match, _, stop) in
        guard let match = match else { return }
        
        let possibleUserName = oldAttributedString[
            Range(match.range(withName: "possibleUserName"), in: oldAttributedString)!
        ]
        if userNames.contains(String(possibleUserName)) {
            mutableAttributedString.addAttributes([.font: font, .foregroundColor: NSColor.blue, .link: "\(BASE_MENTION_LINK)?id=\(userNameToId[String(possibleUserName)] ?? "")", .underlineColor: NSColor.clear], range: match.range)
        }
    }
    
    let LINK = " (?<markdown1>\\[)(?<linkText>[^\\[\\]]*)(?<markdown2>\\])(?<markdown3>\\()(?<link>[^ ]*)(?<markdown4>\\)) "
    regex = try! NSRegularExpression(pattern: LINK, options: [])
    regex.enumerateMatches(in: oldAttributedString, options: [], range: nsrange) { (match, _, stop) in
        guard let match = match else { return }
        
        let link = oldAttributedString[
            Range(match.range(withName: "link"), in: oldAttributedString)!
        ]
        var urlString = String(link)
        if !(link.hasPrefix("http://") || link.hasPrefix("https://")) {
            urlString = String("https://" + link)
        }
        if urlString.isValidURL {
            mutableAttributedString.addAttributes([.font: NSFont(name: "Times New Roman", size: CGFloat(0.00001))], range: match.range(withName: "link"))
            mutableAttributedString.addAttributes([.foregroundColor: NSColor.blue, .link: urlString], range: match.range(withName: "linkText"))
            mutableAttributedString.addAttributes([.foregroundColor: CustomColors.lightGray], range: match.range(withName: "markdown1"))
            mutableAttributedString.addAttributes([.foregroundColor: CustomColors.lightGray], range: match.range(withName: "markdown2"))
            mutableAttributedString.addAttributes([.font: NSFont(name: "Times New Roman", size: CGFloat(0.00001))], range: match.range(withName: "markdown3"))
            mutableAttributedString.addAttributes([.font: NSFont(name: "Times New Roman", size: CGFloat(0.00001))], range: match.range(withName: "markdown4"))
        }
    }
    
    let detector = try! NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
    let linkMatches = detector.matches(in: oldAttributedString, options: [], range: NSRange(location: 0, length: oldAttributedString.utf16.count))
    for match in linkMatches {
        guard let range = Range(match.range, in: oldAttributedString) else { continue }
        let link = String(oldAttributedString[range])
        var urlString = link
        if !(link.hasPrefix("http://") || link.hasPrefix("https://")) {
            urlString = String("https://" + link)
        }
        mutableAttributedString.addAttributes([.foregroundColor: NSColor.blue, .link: urlString], range: match.range)
    }
    
    let HEADING = "^(?<firstCapture># )(?<toModify>[^\n]*)"
    regex = try! NSRegularExpression(pattern: HEADING, options: [NSRegularExpression.Options.anchorsMatchLines])
    regex.enumerateMatches(in: oldAttributedString, options: [], range: nsrange) { (match, _, stop) in
        guard let match = match else { return }
        mutableAttributedString.addAttributes(richTextAttributes.heading, range: match.range(withName: "toModify"))
        mutableAttributedString.addAttributes(richTextAttributes.headingCapture, range: match.range(withName: "firstCapture"))
    }
    
    if formatTitle {
        let TITLE = "(^[^\n]*\n|^[^\n]*$)"
        regex = try! NSRegularExpression(pattern: TITLE, options: [])
        regex.enumerateMatches(in: oldAttributedString, options: [], range: nsrange) { (match, _, stop) in
            guard let match = match else { return }
            mutableAttributedString.addAttributes(richTextAttributes.title, range: match.range)
        }
    }
    
    return mutableAttributedString.attributedSubstring(from: nsrange)
}

class EditorText: ObservableObject {
    @Published var attributedString: NSAttributedString = NSAttributedString(string: "")
    @Published private(set) var latestLocalSaveTime: FirebaseFirestore.Timestamp?
    private var cancellable: AnyCancellable?
    private var firstSave = true
    
    func cancelSaveThrottle() {
        cancellable?.cancel()
    }
    
    static func clean(_ attrString: NSAttributedString) -> String {
        return attrString.string.replacingOccurrences(of: "\u{fffc}", with: "", options: NSString.CompareOptions.literal, range:nil)
    }
    
    func setSaveThrottle(documentPath: String, initialText: String, personaID: String, postID: String, editingIdentity: String) {
        cancellable?.cancel()
        cancellable = $attributedString
            .throttle(for: .seconds(1), scheduler: DispatchQueue.main, latest: true)
            .sink(receiveValue: { [firstSave, weak self] newAttrString in
                // strip out occureences of obj replacement character
                let strippedString = EditorText.clean(newAttrString)
                if strippedString != initialText {
                    print("DEBUG - will save", documentPath)
                    let split = splitRawText(rawText: strippedString)
                    let saveTime = FirebaseFirestore.Timestamp.init()
                    self?.latestLocalSaveTime = saveTime
                    let editingIdentity = [
                        "postEditTimestamps": [
                            "\(postID)": [
                                "identityID": editingIdentity,
                                "timestamp": saveTime,
                            ]
                        ]
                    ]
                    let batch = Firestore.firestore().batch()
                    var updateData: [String: Any]
                    if firstSave {
                        print("DEBUG - first save")
                        updateData = [
                            "title": split.title,
                            "text": split.body,
                            "editDate": saveTime
                        ]
                        self?.firstSave = false
                    } else {
                        updateData = [
                            "title": split.title,
                            "text": split.body,
                            "intermediateEditDate": saveTime
                        ]
                    }
                    batch.updateData(updateData, forDocument: Firestore.firestore().document(documentPath))
                    batch.setData(editingIdentity, forDocument: Firestore.firestore().collection("personas").document(personaID).collection("live").document("editing"), merge: true)
                    batch.commit()
                }
            })
    }
}

struct RichTextEditor: View {
    var rawText: String
    var font: NSFont = AppFont.commonNSFont(size: FontSize.large, weight: FontWeight.regular)
    var search: String = ""
    let documentPath: String
    let enableMarkdown: Bool = true
    let personaID: String
    let postID: String
    let editingIdentity: String
    @Binding var focusDocumentMode: FocusDocumentMode
    var allowFormatting = true
    var targetHeight: CGFloat? = nil
    var latestRemoteSaveTimestamp: FirebaseFirestore.Timestamp?
    var mediaUrls: [Media]
    var mediaLocations: [String: Int]
    
    var body: some View {
        UniqueRichTextEditor(rawText: rawText, font: font, search: search, documentPath: documentPath, enableMarkdown: enableMarkdown, personaID: personaID, postID: postID, editingIdentity: editingIdentity, focusDocumentMode: $focusDocumentMode, allowFormatting: allowFormatting, targetHeight: targetHeight, latestRemoteSaveTimestamp: latestRemoteSaveTimestamp, mediaUrls: mediaUrls, mediaLocations: mediaLocations).id(documentPath)
    }
}

struct MentionOverlay: View {
    var completionOffset: CGRect?
    var partialCompletionWord: String?
    @Binding var userSelectorIndex: Int
    @EnvironmentObject var usersViewModel: UsersViewModel
    
    var body: some View {
        HStack {
            if let completionOffset = completionOffset {
                if let partialCompletionWord = partialCompletionWord {
                    let usersToComplete = usersViewModel.users.values.filter { $0.userName.starts(with: partialCompletionWord)
                    }
                    let longestUserNameCount = CGFloat(usersToComplete.map {
                        $0.userName.count
                    }.max() ?? 0)
                    let cellWidth = longestUserNameCount * 7.5 + 25
                    if usersToComplete.count > 0 {
                        let shortList = Array(usersToComplete[..<min(usersToComplete.count, 10)])
                        MentionList(userSelectorIndex: $userSelectorIndex, completionOffset: completionOffset, usersToComplete: shortList, cellWidth: cellWidth)
                    }
                }
            }
        }
    }
}

struct MentionList: View {
    @Binding var userSelectorIndex: Int
    var completionOffset: CGRect
    var usersToComplete: [User]
    var cellWidth: CGFloat
    let rowHeight = CGFloat(23)
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0)  {
            ZStack {
                Color(NSColor.highlightColor)
                    .padding(-6)
                    .frame(width: cellWidth + 20, height: rowHeight * CGFloat(usersToComplete.count) + 10)
                    .cornerRadius(10)
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(usersToComplete, id: \.id) { user in
                        ZStack {
                            let isSelected = user.documentID == usersToComplete[selectorIndex].documentID
                            if isSelected {
                                Color.blue
                                    .cornerRadius(6)
                            }
                            let userSize = 15
                            HStack {
                                AsyncLoadImage(mediaUrl: user.profileImgUrl, targetWidth: userSize, displaySquare: true)
                                    .frame(width: CGFloat(userSize), height: CGFloat(userSize))
                                    .cornerRadius(50)
                                Text("\(user.userName)")
                                    .foregroundColor(isSelected ? .white : .black)
                                    .padding(.leading, -3)
                                Spacer()
                            }
                            .frame(width: cellWidth)
                            .padding(.top, 3)
                            .padding(.bottom, 3)
                            .padding(.trailing, 5)
                            .padding(.leading, 5)
                            .cornerRadius(6)
                        }
                        .frame(width: cellWidth)
                    }
                    .frame(height: rowHeight)
                }
            }
            .padding(5)
            .cornerRadius(10)
            .shadow(radius: 5)
            .position(x: positionX, y: positionY)
        }
    }
    
    var selectorIndex: Int {
        if userSelectorIndex >= usersToComplete.count {
            let newSelect = usersToComplete.count - 1
            DispatchQueue.main.async {
                userSelectorIndex = newSelect
            }
            return newSelect
        } else if userSelectorIndex < 0 {
            DispatchQueue.main.async {
                userSelectorIndex = 0
            }
            return 0
        } else {
            return userSelectorIndex
        }
    }
    
    var positionX: CGFloat {
        completionOffset.origin.x + cellWidth / 2
    }
    
    var positionY: CGFloat {
        completionOffset.origin.y + CGFloat(min(usersToComplete.count, 10)) * rowHeight / 2 + 28
    }
}

struct Link {
    var title: String
    var link: String
    var insertionPoint: Int
    
    var stringForm: NSAttributedString {
        get {
            NSAttributedString(string: " [\(title)](\(link)) ")
        }
    }
}

struct InsertLinkOverlay: View {
    @Binding var insertLink: Link?
    @Binding var dialogPosition: LinkDialogPosition?
    @State var title = ""
    @State var link = ""
    
    var body: some View {
        HStack(alignment: .top) {
            Color.clear
                .frame(width: 0, height: 0)
                .popover(isPresented: .constant(dialogPosition != nil)) {
                    VStack(alignment: .center) {
                        VStack(alignment: .leading, spacing: 0)  {
                            Text("Title")
                                .font(AppFont.commonFont(size: FontSize.medium, weight: FontWeight.regular))
                            NSTextFieldEntry(text: $title, font: AppFont.commonNSFont(size: FontSize.medium, weight: FontWeight.regular), onSubmit: doInsertLink)
                                .padding(.bottom, 8)
                            Text("link")
                                .font(AppFont.commonFont(size: FontSize.medium, weight: FontWeight.regular))
                            NSTextFieldEntry(text: $link, font: AppFont.commonNSFont(size: FontSize.medium, weight: FontWeight.regular), onSubmit: doInsertLink)
                        }
                        .padding(.leading, 8)
                        .padding(.trailing, 8)
                        .padding(5)
                        .padding(.bottom, 7)
                        .frame(width: 200, height: 108)
                    }
                }
                .allowsHitTesting(false)
                .position(x: dialogPosition?.point.x ?? 0, y: dialogPosition?.point.y ?? 0)
        }
        .onChange(of: dialogPosition != nil) { shown in
            title = ""
            link = ""
        }
    }
    
    func doInsertLink() {
        if let cursor = dialogPosition?.cursor, title != "", link != "" {
            insertLink = Link(title: title, link: link, insertionPoint: cursor)
        }
        dialogPosition = nil
    }
}

struct TextSplit {
    let title: String
    let body: String
}

func splitRawText(rawText: String) -> TextSplit {
    let splitIndex = rawText.firstIndex(of: "\n")
    guard let splitIndex = splitIndex else { return TextSplit(title: "", body: "") }
    let title = String(rawText[..<splitIndex])
    var body = ""
    if title.count < rawText.count + 1 {
        let nextIndex = rawText.index(splitIndex, offsetBy: 1)
        body = String(rawText[nextIndex...])
    }
    return TextSplit(title: title, body: body)
}

struct LinkDialogPosition {
    let point: CGPoint
    let cursor: Int
}

struct UniqueRichTextEditor: View {
    var rawText: String
    @State var textViewHeight: CGFloat = CGFloat(50)
    var font: NSFont = AppFont.commonNSFont(size: FontSize.large, weight: FontWeight.regular)
    @State var editorText: EditorText = EditorText()
    var search: String = ""
    let documentPath: String
    let enableMarkdown: Bool
    let personaID: String
    let postID: String
    let editingIdentity: String
    @EnvironmentObject var usersViewModel: UsersViewModel
    @State var completionOffset: CGRect?
    @State var partialCompletionWord: String?
    @Binding var focusDocumentMode: FocusDocumentMode
    let allowFormatting: Bool
    @EnvironmentObject var formatDocumentViewModel: FormatDocumentViewModel
    var targetHeight: CGFloat?
    @State var contentHeight: CGFloat = 0
    @State var userSelectorIndex: Int = 0
    @State var linkDialogPosition: LinkDialogPosition? = nil
    var latestRemoteSaveTimestamp: FirebaseFirestore.Timestamp?
    @State var insertLink: Link? = nil
    var mediaUrls: [Media]
    var mediaLocations: [String: Int]
    @State var texImages = [String: NSImage]()
    @State var mathStrings = [String]()
    
    var body: some View {
        ZStack{
            ForEach(mathStrings, id: \.self) { mathString in
                LatexMathImageGenerator(mathString: mathString, renderedImages: $texImages)
                    .frame(height: 70)
            }
            .offset(x: 10000, y: 0)
            NativeTextView(attributedString: $editorText.attributedString, textViewHeight: $textViewHeight, font: font, search: search, enableMarkdown: enableMarkdown, users: usersViewModel.users, completionOffset: $completionOffset, partialCompletionWord: $partialCompletionWord, focusDocumentMode: $focusDocumentMode, allowFormatting: allowFormatting, userSelectorIndex: $userSelectorIndex, linkDialogPosition: $linkDialogPosition, postID: postID, personaID: personaID, insertLink: $insertLink, mediaUrls: mediaUrls, mediaLocations: mediaLocations, texImages: texImages, mathStrings: $mathStrings)
                .frame(height: textFrameHeight + 100)
                .zIndex(0)
            InsertLinkOverlay(insertLink: $insertLink, dialogPosition: $linkDialogPosition)
                .zIndex(1)
            MentionOverlay(completionOffset: completionOffset, partialCompletionWord: partialCompletionWord, userSelectorIndex: $userSelectorIndex)
                .zIndex(1)
        }
        .onAppear() {
            self.editorText.attributedString = computeAttributes(oldAttributedString: rawText, font: font, enableMarkdown: enableMarkdown, users: usersViewModel.users)
            self.editorText.setSaveThrottle(documentPath: documentPath, initialText: rawText, personaID: personaID, postID: postID, editingIdentity: editingIdentity)
        }
        .onChange(of: ["rawText": rawText, "seconds": unwrappedLatestSaveTimestampSeconds]) { newData in
            // only overwrite text if its coming from a date later than the last local save
            let newRawText = newData["rawText"] ?? ""
            // HACK - some strange incomprenhesible compiler error resulted in the next line work-around
            let newTimestampSeconds = Int64(newData["seconds"] ?? "0")
            if newTimestampSeconds ?? 0 > self.editorText.latestLocalSaveTime?.seconds ?? 0 {
                print("DEBUG - OVERWRITING")
                self.editorText.cancelSaveThrottle()
                self.editorText.attributedString = computeAttributes(oldAttributedString: newRawText, font: font, enableMarkdown: enableMarkdown, users: usersViewModel.users)
                self.editorText.setSaveThrottle(documentPath: documentPath, initialText: rawText, personaID: personaID, postID: postID, editingIdentity: editingIdentity)
            }
        }
        .onDisappear() {
            let cleanEditorText = EditorText.clean(editorText.attributedString)
            let cleanRawText = EditorText.clean(NSAttributedString(string: rawText))
            if cleanRawText != cleanEditorText {
                print("DEBUG - will save", documentPath)
                let split = splitRawText(rawText: cleanEditorText)
                Firestore.firestore().document(documentPath).updateData([
                    "title": split.title,
                    "text": split.body,
                    "editDate": FirebaseFirestore.Timestamp.init()
                ])
            }
            formatDocumentViewModel.disallowFormatting()
        }
    }
    
    private var unwrappedLatestSaveTimestampSeconds: String {
        // HACK - not sure why this is required here - filed a bug with apple
        if let latestRemoteSaveTimestamp = latestRemoteSaveTimestamp {
            return String(latestRemoteSaveTimestamp.seconds)
        } else {
            return String(0)
        }
    }
    
    private var textFrameHeight: CGFloat {
        if let targetHeight = targetHeight {
            return textViewHeight > targetHeight ? textViewHeight : targetHeight
        } else {
            return textViewHeight
        }
    }
}

extension String {
    var isValidURL: Bool {
        let detector = try! NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        if let match = detector.firstMatch(in: self, options: [], range: NSRange(location: 0, length: self.utf16.count)) {
            return match.range.length == self.utf16.count
        } else {
            return false
        }
    }
}

@objc public protocol MarkdownResponder {
    @objc func insertLink(_ sender: Any?)
    @objc func escape(_ sender: Any?)
    @objc func makeSelectionHeading(_ sender: Any?)
    @objc func makeSelectionBold(_ sender: Any?)
    @objc func makeSelectionBlockQuote(_ sender: Any?)
    @objc func makeSelectionItalic(_ sender: Any?)
    @objc func makeSelectionHighlight(_ sender: Any?)
    @objc func makeSelectionList(_ sender: Any?)
    @objc func becameFirstResponder(_ sender: Any?)
    @objc func resignedFirstResponder(_ sender: Any?)
    @objc func moveMentionSelectorUp(_ sender: Any?)
    @objc func moveMentionSelectorDown(_ sender: Any?)
}

struct RichTextCommands {
    struct link {
        static let key: Character = "i"
        static let eventModifiers: EventModifiers = [.command, .shift]
        static let NSEventModifiers: NSEvent.ModifierFlags = [.command, .shift]
    }
    struct heading {
        static let key: Character = "1"
        static let eventModifiers: EventModifiers = .command
        static let NSEventModifiers: NSEvent.ModifierFlags = .command
    }
    struct bold {
        static let key: Character = "b"
        static let eventModifiers: EventModifiers = .command
        static let NSEventModifiers: NSEvent.ModifierFlags = .command
    }
    struct italic {
        static let key: Character = "i"
        static let eventModifiers: EventModifiers = .command
        static let NSEventModifiers: NSEvent.ModifierFlags = .command
    }
    struct highlight {
        static let key: Character = "v"
        static let eventModifiers: EventModifiers = [.command, .shift]
        static let NSEventModifiers: NSEvent.ModifierFlags = [.command, .shift]
    }
    struct list {
        static let key: Character = "l"
        static let eventModifiers = EventModifiers.command
        static let NSEventModifiers: NSEvent.ModifierFlags = .command
    }
    struct blockQuote {
        static let key: Character = "b"
        static let eventModifiers: EventModifiers = [.command, .shift]
        static let NSEventModifiers: NSEvent.ModifierFlags = [.command, .shift]
    }
}

struct NSKeyCodes {
    static let DownArrow: UInt16 = 125
    static let UpArrow: UInt16 = 126
    static let Escape: UInt16 = 53
}

class CustomNSTextView: NSTextView {
    var isFirstResponder = false
    var isInMentionDialog = false
    var acceptingLink = true
    var images: [String: InlineImage] = [:]
    var postID: String? = nil
    var personaID: String? = nil
    var userID: String? = nil
    var targetImageWidth: CGFloat? = nil
    
    override func performDragOperation(_ sender: NSDraggingInfo) -> Bool {
        guard let targetImageWidth = targetImageWidth else { return false }
        let pasteBoard = sender.draggingPasteboard
        if let types = pasteBoard.types, types.contains(.fileURL) {
            let url = NSURL(from: pasteBoard)
            let image = NSImage(pasteboard: pasteBoard)
            let dropPoint = convert(sender.draggingLocation, to: nil)
            let location = characterIndexForInsertion(at: dropPoint)
            
            guard let image = image else { return false }
            guard let url = url, let personaID = personaID, let postID = postID, let userID = userID else { return false }
            let publicPath = addImageToPost(userID: userID, onPersonaID: personaID, onPostID: postID, url: url, width: image.size.width, height: image.size.height)
            guard let publicPath = publicPath else { return false }
            image.setName(publicPath)
            images[publicPath] = InlineImage(image: image, position: location, localCopy: true)
            let attachment = NSTextAttachment()
            let scaledHeight = targetImageWidth * image.size.height / image.size.width
            image.size = NSSize(width: targetImageWidth, height: scaledHeight)
            attachment.image = image
            let imageString = NSMutableAttributedString()
            imageString.append(NSAttributedString(attachment: attachment))
            insertText(imageString, replacementRange: NSMakeRange(location, 0))
            let newData = [
                "mediaLocations": [
                    "\(publicPath)": location
                ],
            ] as [String : Any]
            Firestore.firestore().collection("personas").document(personaID).collection("posts").document(postID).setData(newData, merge: true)
            cleanUpAfterDragOperation()
            return true
        } else { return false }
    }
    
    override func becomeFirstResponder() -> Bool {
        if !isFirstResponder {
            isFirstResponder = true
            doCommand(by: #selector(MarkdownResponder.becameFirstResponder(_:)))
        }
        return super.becomeFirstResponder()
    }
    
    override func resignFirstResponder() -> Bool {
        if isFirstResponder {
            isFirstResponder = false
            doCommand(by: #selector(MarkdownResponder.resignedFirstResponder(_:)))
        }
        return super.resignFirstResponder()
    }
    
    override func mouseDown(with event: NSEvent) {
        super.mouseDown(with: event)
    }
    
    override func keyDown(with event: NSEvent) {
        if event.keyCode == NSKeyCodes.Escape {
            doCommand(by: #selector(MarkdownResponder.escape(_:)))
        } else if isInMentionDialog {
            switch event.keyCode {
            case NSKeyCodes.DownArrow:
                doCommand(by: #selector(MarkdownResponder.moveMentionSelectorDown(_:)))
            case NSKeyCodes.UpArrow:
                doCommand(by: #selector(MarkdownResponder.moveMentionSelectorUp(_:)))
            default :
                super.keyDown(with: event)
            }
        } else if event.modifierFlags == RichTextCommands.link.NSEventModifiers && event.charactersIgnoringModifiers?.first == RichTextCommands.link.key {
            doCommand(by: #selector(MarkdownResponder.insertLink(_:)))
        } else if event.modifierFlags == RichTextCommands.heading.NSEventModifiers && event.charactersIgnoringModifiers?.first == RichTextCommands.heading.key {
            doCommand(by: #selector(MarkdownResponder.makeSelectionHeading(_:)))
        } else if event.modifierFlags == RichTextCommands.bold.NSEventModifiers && event.charactersIgnoringModifiers?.first == RichTextCommands.bold.key {
            doCommand(by: #selector(MarkdownResponder.makeSelectionBold(_:)))
        } else if event.modifierFlags == RichTextCommands.italic.NSEventModifiers && event.charactersIgnoringModifiers?.first == RichTextCommands.italic.key {
            doCommand(by: #selector(MarkdownResponder.makeSelectionItalic(_:)))
        } else if event.modifierFlags == RichTextCommands.highlight.NSEventModifiers && event.charactersIgnoringModifiers?.first == RichTextCommands.highlight.key {
            doCommand(by: #selector(MarkdownResponder.makeSelectionHighlight(_:)))
        } else if event.modifierFlags == RichTextCommands.list.NSEventModifiers && event.charactersIgnoringModifiers?.first == RichTextCommands.list.key {
            doCommand(by: #selector(MarkdownResponder.makeSelectionList(_:)))
        } else if event.modifierFlags == RichTextCommands.blockQuote.NSEventModifiers && event.charactersIgnoringModifiers?.first == RichTextCommands.blockQuote.key {
            doCommand(by: #selector(MarkdownResponder.makeSelectionBlockQuote(_:)))
        } else {
            super.keyDown(with: event)
        }
    }
}

extension StringProtocol {
    subscript(offset: Int) -> Character {
        self[index(startIndex, offsetBy: offset)]
    }
}

let emptyAttributedString = NSAttributedString(string: "")

struct Media {
    let type: Post.MediaType = Post.MediaType.PHOTO
    let url: String
    let targetWidth: Int
}

struct InlineImage {
    let image: NSImage
    var position: Int? = nil
    var attachmentID: Int? = nil
    var localCopy = false
    var shown = false
}

func replaceAttributedString(onTextView: CustomNSTextView, newTextPart: NSAttributedString, font: NSFont, enableMarkdown: Bool, users: [String: User]) -> CGFloat {
    let newAttrString = computeAttributes(oldAttributedString: newTextPart.string, fullAttrString: newTextPart, font: font, enableMarkdown: enableMarkdown, users: users, selectedRanges: onTextView.selectedRanges)
    if newTextPart.string == "" {
        // empty string so set cursor to title attributes
        let richTextAttributes = RichTextAttributes(defaultFont: font)
        onTextView.typingAttributes = richTextAttributes.title
    }
    onTextView.textStorage?.setAttributedString(newAttrString)
    onTextView.sizeToFit()
    let newSize = onTextView.layoutManager?.usedRect(for: onTextView.textContainer!)
    return newSize?.height ?? CGFloat(0)
}

struct NativeTextView: NSViewRepresentable {
    @Binding var attributedString: NSAttributedString
    @Binding var textViewHeight: CGFloat
    var editable = true
    var font: NSFont
    var search: String = ""
    let enableMarkdown: Bool
    var users: [String: User]
    @Binding var completionOffset: CGRect?
    @Binding var partialCompletionWord: String?
    @Binding var focusDocumentMode: FocusDocumentMode
    var allowFormatting: Bool
    @EnvironmentObject var formatDocumentViewModel: FormatDocumentViewModel
    @Binding var userSelectorIndex: Int
    @Binding var linkDialogPosition: LinkDialogPosition?
    var postID: String
    let personaID: String
    @Binding var insertLink: Link?
    var mediaUrls: [Media]
    var mediaLocations: [String: Int]
    let targetImageWidth = 300
    @State var mediaReceived: Int = 0
    @EnvironmentObject var myUserViewModel: MyUserViewModel
    @EnvironmentObject var selectedText: SelectedText
    var texImages: [String: NSImage]
    @Binding var mathStrings: [String]
    
    func _considerAddMathImages(onTextView: CustomNSTextView) {
        let replacementString = onTextView.attributedString()
        var imagesPresent = Set<String>()
        let nsrange = NSMakeRange(0, replacementString.length)
        replacementString.enumerateAttribute(.attachment, in: nsrange, options: .longestEffectiveRangeNotRequired) {(attr, range, stop) in
            if let attachment = attr as? NSTextAttachment, let name = attachment.image?.name() {
                imagesPresent.insert(name)
            }
        }
        
        let finalString = replacementString.string
        let MATH = "\\$\\$[^\\$]+\\$\\$"
        let regex = try! NSRegularExpression(pattern: MATH, options: [])
        regex.enumerateMatches(in: finalString, options: [], range: nsrange) { (match, _, stop) in
            guard let match = match else { return }
            let lower = finalString.index(finalString.startIndex, offsetBy: match.range.lowerBound)
            let upper = finalString.index(finalString.startIndex, offsetBy: match.range.upperBound)
            let name = "math:\(String(finalString[lower..<upper]))"
            if imagesPresent.contains(name) { return }
            let attachment = NSTextAttachment()
            guard let image = NSImage(named: name) ?? texImages[name] else { return }
            attachment.image = image
            let imageString = NSMutableAttributedString()
            imageString.append(NSAttributedString(attachment: attachment))
            DispatchQueue.main.async {
                onTextView.insertText(imageString, replacementRange: NSMakeRange(match.range.upperBound, 0))
            }
        }
    }
    
    func _considerStringUpdate(onTextView: CustomNSTextView) {
        let replacementString = NSMutableAttributedString(attributedString: computeAttributes(oldAttributedString: self.attributedString.string, fullAttrString: self.attributedString, font: font, enableMarkdown: enableMarkdown, users: users, selectedRanges: onTextView.selectedRanges))
        let zeroTextPosition = replacementString.string.firstIndex(of: "\n")?.utf16Offset(in: replacementString.string)
        var imagesPresent = Set<String>()
        let nsrange = NSMakeRange(0, replacementString.length)
        replacementString.enumerateAttribute(.attachment, in: nsrange, options: .longestEffectiveRangeNotRequired) {(attr, range, stop) in
            if let attachment = attr as? NSTextAttachment, let name = attachment.image?.name() {
                imagesPresent.insert(name)
            }
        }
        for image in onTextView.images.values {
            if imagesPresent.contains(image.image.name() ?? "") {
                continue
            }
            let attachment = NSTextAttachment()
            attachment.image = image.image
            let imageString = NSMutableAttributedString()
            let insertionPostion = image.position == nil ? zeroTextPosition ?? 0 : image.position ?? 0
            imageString.append(NSAttributedString(attachment: attachment))
            guard insertionPostion < replacementString.length else { continue }
            replacementString.insert(imageString, at: insertionPostion)
        }
        
        if replacementString.hashValue != onTextView.attributedString().hashValue {
            DispatchQueue.main.async {
                let newHeight = replaceAttributedString(onTextView: onTextView, newTextPart: replacementString, font: font, enableMarkdown: enableMarkdown, users: users)
                self.attributedString = onTextView.attributedString()
                self.textViewHeight = newHeight
            }
        }
    }
    
    func makeNSView(context: NSViewRepresentableContext<NativeTextView>) -> CustomNSTextView {
        let textView = CustomNSTextView(frame: NSRect(x: 0, y: 0, width: 300, height: 10))
        textView.postID = postID
        textView.personaID = personaID
        textView.userID = myUserViewModel.userID
        textView.delegate = context.coordinator
        textView.drawsBackground = false
        textView.font = font
        textView.isEditable = editable
        textView.isSelectable = true
        textView.allowsUndo = true
        textView.isContinuousSpellCheckingEnabled = true
        textView.insertionPointColor = NSColor.blue
        textView.targetImageWidth = CGFloat(targetImageWidth)
        let richTextAttributes = RichTextAttributes(defaultFont: font)
        textView.typingAttributes = richTextAttributes.title
        if mediaUrls.count > 0 {
            for mediaUrl in mediaUrls {
                getNSImage(mediaUrl: mediaUrl.url, targetWidth: targetImageWidth) { image in
                    let location = mediaLocations[mediaUrl.url]
                    textView.images[mediaUrl.url] = InlineImage(image: image, position: location)
                    _considerStringUpdate(onTextView: textView)
                }
            }
        }
        return textView
    }
    
    func updateNSView(_ nsView: CustomNSTextView, context: NSViewRepresentableContext<NativeTextView>) {
        var commandCharacterToSend: String?
        var modifierFlags: NSEvent.ModifierFlags?
        if allowFormatting {
            switch formatDocumentViewModel.formatDocument {
            case FormatDocument.heading:
                commandCharacterToSend = String(RichTextCommands.heading.key)
                modifierFlags = RichTextCommands.heading.NSEventModifiers
            case FormatDocument.bold:
                commandCharacterToSend = String(RichTextCommands.bold.key)
                modifierFlags = RichTextCommands.bold.NSEventModifiers
            case FormatDocument.italic:
                commandCharacterToSend = String(RichTextCommands.italic.key)
                modifierFlags = RichTextCommands.italic.NSEventModifiers
            case FormatDocument.highlight:
                commandCharacterToSend = String(RichTextCommands.highlight.key)
                modifierFlags = RichTextCommands.highlight.NSEventModifiers
            case FormatDocument.list:
                commandCharacterToSend = String(RichTextCommands.list.key)
                modifierFlags = RichTextCommands.list.NSEventModifiers
            case FormatDocument.blockQuote:
                commandCharacterToSend = String(RichTextCommands.blockQuote.key)
                modifierFlags = RichTextCommands.blockQuote.NSEventModifiers
            case FormatDocument.link:
                commandCharacterToSend = String(RichTextCommands.link.key)
                modifierFlags = RichTextCommands.link.NSEventModifiers
            default:
                break
            }
        }
        nsView.isInMentionDialog = partialCompletionWord != nil
        
        if let commandCharacterToSend = commandCharacterToSend, let modifierFlags = modifierFlags {
            let newEvent = NSEvent.keyEvent(with: NSEvent.EventType.keyDown, location: NSPoint(x: 150, y: 200), modifierFlags: modifierFlags, timestamp: TimeInterval.init(), windowNumber: 1, context: nil, characters: commandCharacterToSend, charactersIgnoringModifiers: commandCharacterToSend, isARepeat: false, keyCode: 66)
            if let newEvent = newEvent {
                DispatchQueue.main.async {
                    nsView.keyDown(with: newEvent)
                }
            }
            formatDocumentViewModel.autoFormat()
        }
        
        if focusDocumentMode == FocusDocumentMode.focus {
            DispatchQueue.main.async {
                nsView.window?.makeFirstResponder(nsView)
                nsView.selectedRanges = [NSValue(range: NSMakeRange(attributedString.string.count, 0))]
                focusDocumentMode = FocusDocumentMode.auto
            }
        }
        
        if let link = insertLink, nsView.acceptingLink {
            nsView.acceptingLink = false
            DispatchQueue.main.async {
                nsView.insertText(link.stringForm, replacementRange: NSMakeRange(link.insertionPoint, 0))
                insertLink = nil
                nsView.acceptingLink = true
                nsView.selectedRanges = [NSValue(range: NSMakeRange(link.insertionPoint + link.stringForm.length, 0))]
            }
        }
        
        _considerStringUpdate(onTextView: nsView)
        _considerAddMathImages(onTextView: nsView)
        
        do {
            let regex = try NSRegularExpression(pattern: search, options: [])
            let nsrange = NSRange(attributedString.string.startIndex..<attributedString.string.endIndex, in: attributedString.string)
            regex.enumerateMatches(in: attributedString.string, options: [], range: nsrange) { (match, _, stop) in
                guard let match = match else { return }
                
                nsView.showFindIndicator(for: match.range)
            }
        } catch {
            return
        }
    }
    
    func makeCoordinator() -> NativeTextView.Coordinator {
        return Coordinator(parent: self)
    }
    
    class Coordinator: NSObject, NSTextViewDelegate {
        var selectedRanges: [NSValue] = []
        let parent: NativeTextView
        
        init(parent: NativeTextView) {
            self.parent = parent
        }
        
        func _setRange(textView: NSTextView, selectedRange: NSValue) {
            self.selectedRanges = textView.selectedRanges
            self.selectedRanges[0] = selectedRange
            if self.selectedRanges.count > 0 {
                textView.selectedRanges = self.selectedRanges
            }
        }
        
        func _updateAttributedString(textView: CustomNSTextView) {
            let string = textView.attributedString().string
            let newAttrString = computeAttributes(oldAttributedString: string, fullAttrString: textView.attributedString(), font: self.parent.font, enableMarkdown: self.parent.enableMarkdown, users: self.parent.users, selectedRanges: textView.selectedRanges)
            let nsrange = NSMakeRange(0, textView.attributedString().length)
            var foundImages = Set<String>()
            newAttrString.enumerateAttribute(.attachment, in: nsrange, options: .longestEffectiveRangeNotRequired) {(attr, range, stop) in
                if let attachment = attr as? NSTextAttachment, let name = attachment.image?.name() {
                    let oldPosition = textView.images[name]?.position
                    let newPosition = range.location
                    foundImages.insert(name)
                    if oldPosition != newPosition {
                        let newData = [
                            "mediaLocations": [
                                "\(name)": newPosition
                            ],
                        ] as [String : Any]
                        Firestore.firestore().collection("personas").document(self.parent.personaID).collection("posts").document(self.parent.postID).setData(newData, merge: true)
                    }
                    textView.images[name]?.position = newPosition
                    if textView.images[name]?.shown == false {
                        textView.images[name]?.shown = true
                    }
                }
            }
            var newAttributes: [([NSAttributedString.Key: Any], NSRange)] = []
            if newAttrString.string.count > 0 {
                // needs to at least have an obj replacement char to remove an image
                for mediaUrl in self.parent.mediaUrls {
                    if !foundImages.contains(mediaUrl.url) {
                        let newData = [
                            "mediaUrl": "",
                            "mediaLocations": [
                                "\(mediaUrl.url)": FirebaseFirestore.FieldValue.delete()
                            ],
                        ] as [String : Any]
                        let db = Firestore.firestore()
                        let sfReference = db.collection("personas").document(self.parent.personaID).collection("posts").document(self.parent.postID)
                        db.runTransaction({(transaction, errorPointer) -> Any? in
                            let sfDocument: DocumentSnapshot
                            do {
                                try sfDocument = transaction.getDocument(sfReference)
                            } catch let fetchError as NSError {
                                errorPointer?.pointee = fetchError
                                return nil
                            }
                            transaction.setData(newData, forDocument: sfReference, merge: true)
                            for uri in sfDocument.get("galleryUris") as? [NSDictionary] ?? [] {
                                if uri["uri"] as? String ?? "" == mediaUrl.url {
                                    let data = [
                                        "galleryUris": FirebaseFirestore.FieldValue.arrayRemove([uri])
                                    ]
                                    transaction.setData(data, forDocument: sfReference, merge: true)
                                    break
                                }
                            }
                            
                            return nil
                        }) {_,_ in}
                        textView.images.removeValue(forKey: mediaUrl.url)
                    }
                }
                for image in textView.images.values {
                    guard image.localCopy else { continue }
                    if let name = image.image.name(), !foundImages.contains(name), image.shown {
                        textView.images.removeValue(forKey: name)
                    }
                }
                newAttrString.enumerateAttributes(in: nsrange, options: .longestEffectiveRangeNotRequired) {(attrs, range, stop) in
                    newAttributes.append((attrs, range))
                }
                textView.textStorage?.beginEditing()
                for (attrs, range) in newAttributes {
                    textView.textStorage?.setAttributes(attrs, range: range)
                }
                textView.textStorage?.endEditing()
            }
            textView.sizeToFit()
            let newSize = textView.layoutManager?.usedRect(for: textView.textContainer!)
            
            let finalString = textView.attributedString().string
            var maths = [String]()
            let MATH = "\\$\\$[^\\$]+\\$\\$"
            let regex = try! NSRegularExpression(pattern: MATH, options: [])
            regex.enumerateMatches(in: finalString, options: [], range: nsrange) { (match, _, stop) in
                guard let match = match else { return }
                let lower = finalString.index(finalString.startIndex, offsetBy: match.range.lowerBound)
                let upper = finalString.index(finalString.startIndex, offsetBy: match.range.upperBound)
                let segment = String(finalString[lower..<upper])
                maths.append(segment)
            }
            
            textView.attributedString().enumerateAttribute(.attachment, in: nsrange, options: .longestEffectiveRangeNotRequired) {(attr, range, stop) in
                if let attachment = attr as? NSTextAttachment, let name = attachment.image?.name() {
                    if name.starts(with: "math:") && !maths.map({ "math:\($0)" }) .contains(name) {
                        textView.textStorage?.deleteCharacters(in: range)
                    }
                }
            }
            
            DispatchQueue.main.async {
                self.parent.mathStrings = maths
                self.parent.attributedString = textView.attributedString()
                self.parent.textViewHeight = newSize?.height ?? CGFloat(0)
            }
        }
        
        func _applyModifierChar(modifierChar: String, textView: NSTextView) {
            if let selection = textView.selectedRanges.first?.rangeValue {
                let oldString = textView.attributedString().string
                
                var removeLowerModifier = false
                if selection.lowerBound > 0 {
                    removeLowerModifier = String(oldString[selection.lowerBound - 1]) == modifierChar
                }
                var removeUpperModifier = false
                if selection.upperBound < oldString.count {
                    removeUpperModifier = String(oldString[selection.upperBound]) == modifierChar
                }
                var selectionContainsModifier = false
                if oldString.count > 0 && selection.lowerBound < oldString.count && selection.upperBound - 1 < oldString.count && selection.upperBound > 0 {
                    selectionContainsModifier = String(oldString[selection.lowerBound]) == modifierChar && String(oldString[selection.upperBound - 1]) == modifierChar && selection.lowerBound < selection.upperBound - 1
                }
                removeLowerModifier = (removeLowerModifier && removeUpperModifier) || selectionContainsModifier
                removeUpperModifier = (removeLowerModifier && removeUpperModifier) || selectionContainsModifier
                if removeLowerModifier {
                    textView.insertText(emptyAttributedString, replacementRange: NSRange(location: selectionContainsModifier ? selection.lowerBound : selection.lowerBound - 1, length: 1))
                } else {
                    textView.insertText(NSAttributedString(string: modifierChar), replacementRange: NSMakeRange(selection.lowerBound, 0))
                }
                if removeUpperModifier {
                    let location = selectionContainsModifier ? selection.upperBound - 2 : selection.upperBound - 1
                    if location >= 0 {
                        textView.insertText(emptyAttributedString, replacementRange: NSRange(location: location, length: 1))
                    }
                } else {
                    textView.insertText(NSAttributedString(string: modifierChar), replacementRange: NSMakeRange(selection.upperBound + 1, 0))
                }
                var newRange: NSRange
                if selectionContainsModifier {
                    newRange = NSRange(location: selection.lowerBound, length: selection.upperBound - selection.lowerBound - 2)
                } else {
                    newRange = NSRange(location: selection.lowerBound + (removeLowerModifier ? -1 : 1), length: selection.upperBound - selection.lowerBound)
                }
                let selectedRange = NSValue(range: newRange)
                _setRange(textView: textView, selectedRange: selectedRange)
            }
        }
        
        func _applyModifierLine(modifierString: String, textView: NSTextView) {
            if let selection = textView.selectedRanges.first?.rangeValue {
                let oldString = textView.attributedString().string
                let LINE = "\n(?<lineToBeHeading>[^\n]*)$"
                let regex = try! NSRegularExpression(pattern: LINE, options: [])
                let endIndex = String.Index(utf16Offset: selection.lowerBound, in: oldString)
                if selection.lowerBound - 1 >= 0 {
                    let index = String.Index(utf16Offset: selection.lowerBound - 1, in: oldString)
                    if oldString.indices.contains(index) {
                        let char = oldString[index]
                        if char == "\n" {
                            let beginningPart = String(oldString[..<endIndex])
                            let endingPart = String(oldString[endIndex...])
                            if endingPart.starts(with: modifierString) {
                                textView.insertText(emptyAttributedString, replacementRange: NSRange(location: beginningPart.utf16.count, length: 2))
                            } else {
                                textView.insertText(NSAttributedString(string: modifierString), replacementRange: NSMakeRange(beginningPart.utf16.count, 0))
                            }
                            return
                        }
                    }
                }
                let nsrange = NSRange(oldString.startIndex..<endIndex, in: oldString)
                if let match = regex.firstMatch(in: oldString, options: [], range: nsrange) {
                    var splitIndex: String.Index
                    let lineHeadingMatch = match.range(withName: "lineToBeHeading")
                    if lineHeadingMatch.length > 0 {
                        splitIndex = String.Index(utf16Offset: lineHeadingMatch.lowerBound, in: oldString)
                    } else {
                        splitIndex = endIndex
                    }
                    let beginningPart = String(oldString[..<splitIndex])
                    let endingPart = String(oldString[splitIndex...])
                    if endingPart.starts(with: modifierString) {
                        textView.insertText(emptyAttributedString, replacementRange: NSRange(location: beginningPart.utf16.count, length: 2))
                    } else {
                        textView.insertText(NSAttributedString(string: modifierString), replacementRange: NSMakeRange(beginningPart.utf16.count, 0))
                    }
                } else {
                    if oldString.starts(with: modifierString) {
                        textView.insertText(emptyAttributedString, replacementRange: NSMakeRange(0, 2))
                    } else {
                        textView.insertText(NSAttributedString(string: modifierString), replacementRange: NSMakeRange(0, 0))
                    }
                }
            }
        }
        
        func textView(_ textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
            print("---> doCommandBy", commandSelector)
            let heading = #selector(MarkdownResponder.makeSelectionHeading(_:))
            let bold = #selector(MarkdownResponder.makeSelectionBold(_:))
            let italic = #selector(MarkdownResponder.makeSelectionItalic(_:))
            let highlight = #selector(MarkdownResponder.makeSelectionHighlight(_:))
            let list = #selector(MarkdownResponder.makeSelectionList(_:))
            let becameResponder = #selector(MarkdownResponder.becameFirstResponder(_:))
            let resignedResponder = #selector(MarkdownResponder.resignedFirstResponder(_:))
            let blockQuote = #selector(MarkdownResponder.makeSelectionBlockQuote(_:))
            let escape = #selector(MarkdownResponder.escape(_:))
            let insertLink = #selector(MarkdownResponder.insertLink(_:))
            
            let moveMentionSelectorUp = #selector(MarkdownResponder.moveMentionSelectorUp(_:))
            let moveMentionSelectorDown = #selector(MarkdownResponder.moveMentionSelectorDown(_:))
            
            let insertBacktab = #selector(NSStandardKeyBindingResponding.insertBacktab(_:))
            
            switch commandSelector {
            case insertBacktab:
                guard let insertionPoint = textView.selectedRanges.first?.rangeValue.location else { return false }
                guard insertionPoint > 0 else { return false }
                return _unindentBullent(textView: textView, insertionPoint: insertionPoint)
            case insertLink:
                guard let insertionPoint = textView.selectedRanges.first?.rangeValue.location else { return false }
                guard insertionPoint > 0 else { return false }
                let charRange = NSRange(location: insertionPoint, length: 0)
                guard let glyphRange = textView.layoutManager?.glyphRange(forCharacterRange: charRange, actualCharacterRange: nil) else { return false }
                guard let textContainer = textView.textContainer else { return false }
                if let boundingRect = textView.layoutManager?.boundingRect(forGlyphRange: glyphRange, in: textContainer) {
                    let point = CGPoint(x: boundingRect.minX, y: boundingRect.minY)
                    self.parent.linkDialogPosition = LinkDialogPosition(point: point, cursor: insertionPoint)
                    return true
                }
                return false
            case escape:
                if self.parent.partialCompletionWord == nil {
                    DispatchQueue.main.async {
                        textView.window?.makeFirstResponder(nil)
                    }
                } else {
                    self.parent.partialCompletionWord = nil
                    self.parent.completionOffset = nil
                }
                return true
            case heading:
                self._applyModifierLine(modifierString: "# ", textView: textView)
                return true
            case list:
                self._applyModifierLine(modifierString: "• ", textView: textView)
                return true
            case bold:
                self._applyModifierChar(modifierChar: "*", textView: textView)
                return true
            case italic:
                self._applyModifierChar(modifierChar: "_", textView: textView)
                return true
            case highlight:
                self._applyModifierChar(modifierChar: "`", textView: textView)
                return true
            case blockQuote:
                self._applyModifierLine(modifierString: "> ", textView: textView)
                return true
            case becameResponder:
                if self.parent.allowFormatting {
                    self.parent.formatDocumentViewModel.allowFormatting()
                }
                return true
            case moveMentionSelectorUp:
                if self.parent.userSelectorIndex > 0 {
                    self.parent.userSelectorIndex -= 1
                }
                return true
            case moveMentionSelectorDown:
                self.parent.userSelectorIndex += 1
                return true
            case resignedResponder:
                if self.parent.allowFormatting {
                    self.parent.formatDocumentViewModel.disallowFormatting()
                }
                return true
            default:
                break
            }
            return false
        }
        
        func _considerMentionAutoComplete(newString: String, textView: NSTextView, affectedRanges: [NSValue]) -> Bool {
            guard self.parent.partialCompletionWord != nil && (newString == "\n" || newString == "\t") else { return false }
            self.parent.partialCompletionWord = nil
            self.parent.completionOffset = nil
            let oldStr = textView.attributedString().string
            guard let insertionPoint = affectedRanges.first?.rangeValue.location else { return false }
            let splitIndex = String.Index(utf16Offset: insertionPoint, in: oldStr)
            let stringPrefix = oldStr[..<splitIndex]
            let (partialCompletionWord, _) = _getPartialWordSuggestion(textView: textView, insertionPointOverride: insertionPoint)
            guard let partialCompletionWord = partialCompletionWord else { return false }
            let usersToComplete = Array(self.parent.users.values.filter { $0.userName.starts(with: partialCompletionWord) })
            let selector = self.parent.userSelectorIndex as Int
            guard selector < usersToComplete.count else { return false }
            let user = usersToComplete[selector]
            let userNameToFill = user.userName
            let userPartToComplete = userNameToFill[String.Index(utf16Offset: partialCompletionWord.count, in: userNameToFill)...]
            textView.insertText(NSAttributedString(string: String(userPartToComplete) + " "), replacementRange: NSMakeRange(stringPrefix.count, 0))
            return true
        }
        
        func _unindentBullent(textView: NSTextView, insertionPoint: Int) -> Bool {
            let oldStr = textView.attributedString().string
            let splitIndex = String.Index(utf16Offset: insertionPoint, in: oldStr)
            let stringPrefix = String(oldStr[..<splitIndex])
            let nsrange = NSRange(stringPrefix.startIndex..<stringPrefix.endIndex, in: stringPrefix)
            let EXISTING_BULLET_WITH_TAB = "\t+(• {0,1}){0,1}$"
            let regex = try! NSRegularExpression(pattern: EXISTING_BULLET_WITH_TAB, options: [])
            if let match = regex.firstMatch(in: stringPrefix, options: [], range: nsrange) {
                textView.insertText(emptyAttributedString, replacementRange: NSRange(location: match.range.lowerBound, length: 1))
                return true
            }
            return false
        }
        
        func _indentBullet(newString: String, textView: NSTextView, affectedRanges: [NSValue]) -> Bool {
            guard newString == "\t" else { return false }
            let oldStr = textView.attributedString().string
            guard let selection = affectedRanges.first?.rangeValue else { return false }
            let insertionPoint = selection.location
            let splitIndex = String.Index(utf16Offset: insertionPoint, in: oldStr)
            let stringPrefix = String(oldStr[..<splitIndex])
            let nsrange = NSRange(stringPrefix.startIndex..<stringPrefix.endIndex, in: stringPrefix)
            let EXISTING_BULLET = "\t*• {0,1}$"
            let regex = try! NSRegularExpression(pattern: EXISTING_BULLET, options: [])
            if let match = regex.firstMatch(in: stringPrefix, options: [], range: nsrange) {
                textView.insertText("\t", replacementRange: NSRange(location: match.range.lowerBound, length: 0))
                return true
            }
            return false
        }
        
        func _autoFillNextBullet(newString: String, textView: NSTextView, affectedRanges: [NSValue]) -> Bool {
            guard newString == "\n" else { return false }
            let oldStr = textView.attributedString().string
            guard let selection = affectedRanges.first?.rangeValue else { return false }
            let insertionPoint = selection.location
            let splitIndex = String.Index(utf16Offset: insertionPoint, in: oldStr)
            let stringPrefix = String(oldStr[..<splitIndex])
            let stringSuffix = String(oldStr[splitIndex...])
            let nsrange = NSRange(stringPrefix.startIndex..<stringPrefix.endIndex, in: stringPrefix)
            let BULLET_WILL_ADD = "• [^\n]+$"
            var regex = try! NSRegularExpression(pattern: BULLET_WILL_ADD, options: [])
            if regex.firstMatch(in: stringPrefix, options: [], range: nsrange) != nil {
                if stringPrefix.last != "\n" {
                    textView.insertText(NSAttributedString(string: "\n• "), replacementRange: NSMakeRange(stringPrefix.utf16.count, 0))
                    return true
                }
            }
            if stringPrefix.last == "\n" {
                return false
            }
            let BULLET_MAY_REMOVE = "• $"
            regex = try! NSRegularExpression(pattern: BULLET_MAY_REMOVE, options: [])
            if regex.firstMatch(in: stringPrefix, options: [], range: nsrange) != nil {
                if stringSuffix.starts(with: "\n") || stringSuffix.count == 0 {
                    textView.insertText(emptyAttributedString, replacementRange: NSRange(location: stringPrefix.utf16.count - 2, length: 2))
                } else {
                    textView.insertText(NSAttributedString(string: "\n• "), replacementRange: NSMakeRange(stringPrefix.utf16.count, 0))
                }
                return true
            }
            return false
        }
        
        func textView(_ textView: NSTextView, shouldChangeTextInRanges affectedRanges: [NSValue], replacementStrings: [String]?) -> Bool {
            guard let string = replacementStrings?.first else { return true }
            let didComplete = _considerMentionAutoComplete(newString: string, textView: textView, affectedRanges: affectedRanges)
            if didComplete {
                return false
            }
            let didAddBullet = _autoFillNextBullet(newString: string, textView: textView, affectedRanges: affectedRanges)
            if didAddBullet {
                return false
            }
            let didIndentBullet = _indentBullet(newString: string, textView: textView, affectedRanges: affectedRanges)
            if didIndentBullet {
                return false
            }
            
            return true
        }
        
        func textView(_ textView: NSTextView, clickedOnLink link: Any, at charIndex: Int) -> Bool {
            let linkText = link as? String ?? ""
            if linkText.starts(with: BASE_MENTION_LINK) {
                let MENTION = "\\?id=(?<userID>.*)$"
                let nsrange = NSRange(linkText.startIndex..<linkText.endIndex, in: linkText)
                let regex = try! NSRegularExpression(pattern: MENTION, options: [])
                if let match = regex.firstMatch(in: linkText, options: [], range: nsrange) {
                    let lowerBound = String.Index(utf16Offset: match.range(withName: "userID").lowerBound, in: linkText)
                    let userID = String(linkText[lowerBound...])
                    if let user = self.parent.users[userID] {
                        let detailView = UserDetail(user: user)
                        let controller = DetailWindowController(rootView: detailView)
                        controller.window?.title = user.userName
                        controller.showWindow(nil)
                    }
                }
            } else {
                guard let urlString = link as? String, let url = URL(string: urlString) else {
                    return true
                }
                NSWorkspace.shared.open(url)
            }
            return true
        }
        
        func _getPartialWordSuggestion(textView: NSTextView, insertionPointOverride: Int? = nil) -> (String?, CGRect?) {
            var insertionPoint: Int
            if insertionPointOverride != nil {
                insertionPoint = insertionPointOverride!
            } else {
                let possibleInsertionPoint = textView.selectedRanges.first?.rangeValue.location
                guard possibleInsertionPoint != nil  else { return (nil, nil) }
                insertionPoint = possibleInsertionPoint!
            }
            guard insertionPoint > 0 else { return (nil, nil) }
            let charRange = NSRange(String.Index(utf16Offset: insertionPoint-1, in: textView.string)..<String.Index(utf16Offset: insertionPoint, in: textView.string), in: textView.string)
            guard let glyphRange = textView.layoutManager?.glyphRange(forCharacterRange: charRange, actualCharacterRange: nil) else { return (nil, nil) }
            guard let textContainer = textView.textContainer else { return (nil, nil) }
            let boundingRect = textView.layoutManager?.boundingRect(forGlyphRange: glyphRange, in: textContainer)
            let text = textView.string as String
            let insertionIndex = String.Index(utf16Offset: insertionPoint, in: text)
            let nsrange = NSRange(text.startIndex..<insertionIndex, in: text)
            let MENTION_END = "@(?<possibleUserName>[a-zA-Z0-9]+)$"
            let regex = try! NSRegularExpression(pattern: MENTION_END, options: [])
            var lastChar: Character
            if insertionPoint > text.count {
                return (nil, nil)
            } else {
                lastChar = text[text.index(text.startIndex, offsetBy: insertionPoint - 1)]
            }
            if lastChar == "\n" {
                return (nil, nil)
            }
            if let match = regex.firstMatch(in: text, options: [], range: nsrange) {
                if let range = Range(match.range(withName: "possibleUserName"), in: text) {
                    let possibleUserName = text[range]
                    return (String(possibleUserName), boundingRect)
                } else {
                    return (nil, nil)
                }
            } else {
                return (nil, nil)
            }
        }
        
        func _replaceBullet(textView: CustomNSTextView) {
            let string = textView.attributedString().string
            let BULLET = "^(?<firstCapture>- ).*$"
            let regex = try! NSRegularExpression(pattern: BULLET, options: NSRegularExpression.Options.anchorsMatchLines)
            let richTextAttributes = RichTextAttributes(defaultFont: self.parent.font)
            let nsrange = NSMakeRange(0, textView.attributedString().length)
            regex.enumerateMatches(in: string, options: [], range: nsrange) { (match, _, stop) in
                guard let match = match else { return }
                
                textView.insertText(NSAttributedString(string: "• ", attributes: richTextAttributes.bullet) , replacementRange: match.range(withName: "firstCapture"))
            }
        }
        
        func textDidChange(_ notification: Notification) {
            guard let textView = notification.object as? CustomNSTextView else {
                return
            }
            let (partialCompletionWord, completionOffset) = self._getPartialWordSuggestion(textView: textView)
            self.parent.partialCompletionWord = partialCompletionWord
            self.parent.completionOffset = completionOffset
            textView.isInMentionDialog = partialCompletionWord != nil
            
            _updateAttributedString(textView: textView)
            _fixTypingAttributes(textView: textView)
            _replaceBullet(textView: textView)
        }
        
        func _fixTypingAttributes(textView: NSTextView) {
            // this is broken whenever there's a newline sandwich?
            if let insertionPoint = textView.selectedRanges.first?.rangeValue.location, insertionPoint > 0 {
                let string = textView.string
                let richTextAttributes = RichTextAttributes(defaultFont: self.parent.font)
                let beforeIndex = string.index(string.startIndex, offsetBy: insertionPoint - 1, limitedBy: string.endIndex)
                guard let beforeIndex = beforeIndex else {
                    return
                }
                guard insertionPoint < string.count else {
                    if string.indices.contains(beforeIndex), string[beforeIndex] == "\n" {
                        textView.typingAttributes = richTextAttributes.body
                    }
                    return
                }
                let insertionIndex = string.index(string.startIndex, offsetBy: insertionPoint)
                if string[beforeIndex] == "\n" && string[insertionIndex] == "\n" {
                    textView.typingAttributes = richTextAttributes.body
                }
            }
        }
        
        func textViewDidChangeSelection(_ notification: Notification) {
            guard let textView = notification.object as? CustomNSTextView else {
                return
            }
            let firstSelection = textView.selectedRanges.first
            if let firstSelection = firstSelection, firstSelection.rangeValue.length > 0 {
                let string = textView.attributedString().string
                let lowerIndex = string.index(string.startIndex, offsetBy: firstSelection.rangeValue.location, limitedBy: string.endIndex)
                let upperIndex = string.index(string.startIndex, offsetBy: firstSelection.rangeValue.upperBound, limitedBy: string.endIndex)
                if let lowerIndex = lowerIndex, let upperIndex = upperIndex {
                    self.parent.selectedText.text = String(string[lowerIndex..<upperIndex])
                } else {
                    self.parent.selectedText.text = nil
                }
            } else if self.parent.selectedText.text != nil {
                self.parent.selectedText.text = nil
            }
            _fixTypingAttributes(textView: textView)
            let (partialCompletionWord, _) = self._getPartialWordSuggestion(textView: textView)
            if firstSelection?.rangeValue.location ?? 0 < textView.string.count && partialCompletionWord == nil {
                DispatchQueue.main.async {
                    self.parent.partialCompletionWord = nil
                    self.parent.completionOffset = nil
                }
            }
        }
    }
}
