import SwiftUI

struct FontSize {
    static let tiny = CGFloat(10)
    static let small = CGFloat(11)
    static let medium = CGFloat(13)
    static let large = CGFloat(15)
    static let extraLarge = CGFloat(22)
}

enum FontWeight {
    case regular
    case bold
    case italics
    case thin
}

struct AppFont {
    static func commonNSFont(size: CGFloat, weight: FontWeight) -> NSFont {
        switch weight {
        case FontWeight.regular:
            return NSFont(name: "AvenirNextLTPro-Regular", size: size)!
        case FontWeight.bold:
            return NSFont(name: "AvenirNextLTPro-Demi", size: size)!
        case FontWeight.italics:
            return NSFont(name: "AvenirNextLTPro-It", size: size)!
        case FontWeight.thin:
            return NSFont(name: "AvenirNextLTPro-UltLt", size: size)!
        }
    }
    static func commonFont(size: CGFloat, weight: FontWeight) -> Font {
        switch weight {
        case FontWeight.regular:
            return Font.custom("AvenirNextLTPro-Regular", size: size)
        case FontWeight.bold:
            return Font.custom("AvenirNextLTPro-Demi", size: size)
        case FontWeight.italics:
            return Font.custom("AvenirNextLTPro-It", size: size)
        case FontWeight.thin:
            return Font.custom("AvenirNextLTPro-UltLt", size: size)
        }
    }
}

struct PersonaItem: View {
    var persona: Persona
    var personaCache: PersonaCache?
    let isSelected: Bool

    var body: some View {
        HStack {
            AsyncLoadImage(mediaUrl: persona.profileImgUrl, targetWidth: 30, displaySquare: true)
                .frame(width: 30, height: 30, alignment: .center)
                .cornerRadius(50)
            Text(persona.name)
                .font(AppFont.commonFont(size: FontSize.small, weight: FontWeight.regular))
                .foregroundColor(isSelected ? .white : .primary)
            if let timestamp = personaCache?.latestTouchedDate {
                Text(timestampToDateString(timestamp: timestamp))
                    .font(AppFont.commonFont(size: FontSize.tiny, weight: FontWeight.thin))
                    .foregroundColor(isSelected ? .white : .primary)
            }
            Spacer()
        }
        .frame(height: 40)
        .padding(.leading, 15)
    }
}

struct Landing: View {
    @StateObject private var personaViewModel = PersonaViewModel()
    @StateObject private var personaCacheViewModel = PersonaCacheViewModel()
    @EnvironmentObject private var usersViewModel: UsersViewModel
    @State private var selectedPersona: Persona?
    @State private var search: String = ""
    @EnvironmentObject private var myUserViewModel: MyUserViewModel

    var body: some View {
        if let myUserID = myUserViewModel.userID {
            HSplitView {
                VStack {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 0) {
                            ForEach(personaList, id: \.documentID) { persona in
                                let isSelected = selectedPersona?.documentID == persona.documentID
                                ZStack {
                                    if isSelected {
                                        Color.blue
                                            .cornerRadius(8)
                                            .padding(.leading, 10)
                                            .padding(.trailing, 10)
                                    }
                                    PersonaItem(persona: persona, personaCache: personaCacheViewModel.personas[persona.documentID],
                                                isSelected: isSelected)
                                        .padding(3)
                                        .padding(.leading, 10)
                                        .padding(.trailing, 10)
                                        .contentShape(Rectangle())
                                        .onTapGesture {
                                            if self.selectedPersona?.documentID == persona.documentID {
                                                let detailView = PersonaHeader(persona: persona, users: usersViewModel.users)
                                                let controller = DetailWindowController(rootView: detailView)
                                                controller.window?.title = persona.name
                                                controller.showWindow(nil)
                                            } else {
                                                self.selectedPersona = persona
                                            }
                                        }
                                        .contextMenu {
                                            Button("New post", action: {
                                                if (self.selectedPersona?.documentID != persona.documentID) {
                                                    self.selectedPersona = persona
                                                }
                                                if let userID = myUserViewModel.myUser?.documentID {
                                                    let identityID = persona.anonymous ? persona.documentID : nil
                                                    let ref = Post.createNew(onPersonaID: persona.documentID, authorID: userID, identityID: identityID)
                                                }
                                            })
                                        }
                                }
                            }
                        }
                    }
                }
                .padding(.top, 18)
                .frame(minWidth: 150, idealWidth: 200, maxWidth: 200)
                if let persona = selectedPersona {
                    PersonaEditor(persona: persona, search: $search)
                } else {
                    Spacer()
                }
            }
            .onAppear() {
                self.personaViewModel.fetchData(userID: myUserID)
                self.personaCacheViewModel.fetchData(userID: myUserID)
            }
            .onChange(of: personaCacheViewModel.personas.count) {newValue in
                if self.personaCacheViewModel.personas.count > 0 && selectedPersona == nil {
                    let sortedCache = Array(self.personaCacheViewModel.personas.values).sorted { (cacheA, cacheB) in
                        cacheA.latestTouchedDate?.seconds ?? 0 > cacheB.latestTouchedDate?.seconds ?? 0
                    }
                    self.selectedPersona = self.personaViewModel.personas.first {persona in
                        persona.documentID == sortedCache[0].documentID
                    }
                }
            }
        }
    }

    var personaList: [Persona] {
        return personaViewModel.personas.sorted { (personaA, personaB) in personaCacheViewModel.personas[personaA.documentID]?.latestTouchedDate?.seconds ?? 0 > personaCacheViewModel.personas[personaB.documentID]?.latestTouchedDate?.seconds ?? 0
        }
        .filter {persona in
            if search.isEmpty {
                return true
            } else {
                return persona.name.localizedCaseInsensitiveContains(search) ||
                persona.documentID == String(selectedPersona?.documentID ?? "")
            }
        }
    }
}
