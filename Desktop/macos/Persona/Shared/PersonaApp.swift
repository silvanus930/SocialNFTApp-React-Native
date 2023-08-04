import SwiftUI
import Firebase

struct PostEditorGroup {
    let postID: String
    let persona: Persona
}

class RespondingPost: ObservableObject {
    @Published var selected: PostEditorGroup?
}

class FocusSearch: ObservableObject {
    @Published var state = FocusDocumentMode.auto
}

class ToggleComments: ObservableObject {
    @Published var state = false
}

class SelectedText: ObservableObject {
    @Published var text: String? = nil
    @Published var replyingTo = false
}

@main
struct PersonaApp: App {
    @StateObject var usersViewModel = UsersViewModel()
    @StateObject var myUserViewModel = MyUserViewModel()
    @StateObject var formatDocumentViewModel = FormatDocumentViewModel()
    @StateObject var respondingPost = RespondingPost()
    @StateObject var windowActive = WindowActive()
    @State var focusSearch = FocusSearch()
    @State var toggleComments = ToggleComments()
    @StateObject var selectedText = SelectedText()
    
    init() {
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear() {
                    self.usersViewModel.fetchData()
                }
                .environmentObject(usersViewModel)
                .environmentObject(myUserViewModel)
                .environmentObject(formatDocumentViewModel)
                .environmentObject(respondingPost)
                .environmentObject(windowActive)
                .environmentObject(focusSearch)
                .environmentObject(toggleComments)
                .environmentObject(selectedText)
        }
        .windowStyle(HiddenTitleBarWindowStyle())
        .commands {
            CommandGroup(after: CommandGroupPlacement.appVisibility) {
                Divider()
                Button("Sign Out", action: myUserViewModel.signOut)
            }
            CommandGroup(after: CommandGroupPlacement.newItem) {
                Divider()
                Button("Search") {
                    focusSearch.state = FocusDocumentMode.focus
                }
                .keyboardShortcut("f")
                .disabled(!windowActive.status)
            }
            CommandGroup(after: CommandGroupPlacement.textEditing) {
                Divider()
                Button("Toggle comments") {
                    toggleComments.state = !toggleComments.state
                }
                .keyboardShortcut("d")
                .disabled(!windowActive.status)
            }
            CommandMenu("Format") {
                Button("Heading", action: formatDocumentViewModel.makeLineHeading)
                    .keyboardShortcut(KeyEquivalent(RichTextCommands.heading.key), modifiers: RichTextCommands.heading.eventModifiers)
                    .disabled(!formatDocumentViewModel.formattingPossible)
                Divider()
                Group {
                    Button("Bold", action: formatDocumentViewModel.makeSelectionBold)
                        .keyboardShortcut(KeyEquivalent(RichTextCommands.bold.key), modifiers: RichTextCommands.bold.eventModifiers)
                        .disabled(!formatDocumentViewModel.formattingPossible)
                    Button("Italic", action: formatDocumentViewModel.makeSelectionItalic)
                        .keyboardShortcut(KeyEquivalent(RichTextCommands.italic.key), modifiers: RichTextCommands.italic.eventModifiers)
                        .disabled(!formatDocumentViewModel.formattingPossible)
                }
                Divider()
                Button("Verbatim", action: formatDocumentViewModel.makeSelectionHighlight)
                    .keyboardShortcut(KeyEquivalent(RichTextCommands.highlight.key), modifiers: RichTextCommands.highlight.eventModifiers)
                    .disabled(!formatDocumentViewModel.formattingPossible)
                Divider()
                Group {
                    Button("List", action: formatDocumentViewModel.makeLineList)
                        .keyboardShortcut(KeyEquivalent(RichTextCommands.list.key), modifiers: RichTextCommands.list.eventModifiers)
                        .disabled(!formatDocumentViewModel.formattingPossible)
                    Button("Block Quote", action: formatDocumentViewModel.makeSelectionBlockQuote)
                        .keyboardShortcut(KeyEquivalent(RichTextCommands.blockQuote.key), modifiers: RichTextCommands.blockQuote.eventModifiers)
                        .disabled(!formatDocumentViewModel.formattingPossible)
                }
                Divider()
                Group {
                    Button("Insert Link", action: formatDocumentViewModel.insertLink)
                        .keyboardShortcut(KeyEquivalent(RichTextCommands.link.key), modifiers: RichTextCommands.link.eventModifiers)
                        .disabled(!formatDocumentViewModel.formattingPossible)
                }
            }
            CommandMenu("Persona") {
                Button("Create New Post") {
                    if let userID = myUserViewModel.myUser?.documentID, let selected = respondingPost.selected {
                        let activePersona = selected.persona
                        let identityID = activePersona.anonymous ? activePersona.documentID : nil
                        let ref = Post.createNew(onPersonaID: activePersona.documentID, authorID: userID, identityID: identityID)
                        respondingPost.selected = PostEditorGroup(postID: ref.documentID, persona: activePersona)
                    }
                }
                .disabled(!windowActive.status)
            }
            CommandMenu("Canvas") {
                Button("Open in new window") {
                    if let data = respondingPost.selected {
                        let detailView = PostEditor(persona: data.persona, postID: data.postID, search: "")
                            .environmentObject(myUserViewModel)
                            .environmentObject(usersViewModel)
                            .environmentObject(formatDocumentViewModel)
                            .environmentObject(respondingPost)
                        let controller = DetailWindowController(rootView: detailView, width: 500, height: 600)
                        controller.window?.backgroundColor = NSColor.white
                        controller.window?.titleVisibility = .hidden
                        controller.window?.titlebarAppearsTransparent = true
                        controller.showWindow(nil)
                    }
                }
                .disabled(!windowActive.status)
                Divider()
                Button("Reply inline") {
                    selectedText.replyingTo = !selectedText.replyingTo
                }
                .keyboardShortcut("r")
                .disabled(!windowActive.status || selectedText.text == nil)
            }
        }
    }
}
