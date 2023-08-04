import SwiftUI
import FirebaseAuth

struct LogIn: View {
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var failedAuth = false
    @EnvironmentObject private var myUserViewModel: MyUserViewModel
    
    var body: some View {
        HStack {
            Spacer()
            VStack(alignment: .trailing) {
                TextField("Email", text: $email)
                    .disableAutocorrection(true)
                    .frame(maxWidth: 200)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .font(AppFont.commonFont(size: FontSize.medium, weight: FontWeight.regular))
                SecureField("Password", text: $password)
                    .frame(maxWidth: 200)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .font(AppFont.commonFont(size: FontSize.medium, weight: FontWeight.regular))
                    .textContentType(.password)
                    .id("password")
                Button(action: logIn) {
                    Text("Log In")
                        .font(AppFont.commonFont(size: FontSize.medium, weight: FontWeight.regular))
                }
                .padding(.trailing, 1)
                .padding(.top, 3)
                Spacer()
                Text("Persona")
                    .font(Font.custom("Palatino", size: 20))
                    .padding(.bottom, 15)
            }
            .padding(.trailing, 17)
            .padding(.top, -10)
        }
        .background(
            Image("landing")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .scaledToFill()
                .clipped()
                .padding(.leading, -80)
        )
        .alert(isPresented: $failedAuth) {
            Alert(title: Text("Login failed"), message: Text("Incorrect username or password"), dismissButton: .default(Text("OK")))
        }
    }
    
    func logIn() {
        Auth.auth().signIn(withEmail: email, password: password) { authResult, error in
            if authResult?.user == nil {
                failedAuth = true
            }
        }
    }
}

struct ContentView: View {
    @EnvironmentObject private var myUserViewModel: MyUserViewModel
    @EnvironmentObject var windowActive : WindowActive
    
    var body: some View {
        if myUserViewModel.myUser != nil {
            ZStack {
                HostingWindowFinder { window in
                    if let window = window {
                        self.windowActive.add(window: window)
                    }
                }
                .frame(width: 0, height: 0)
                Landing()
                    .frame(minWidth: 700, idealWidth: 900, minHeight: 600, idealHeight: 800)
            }
        } else {
            LogIn()
                .frame(minWidth: 1200, idealWidth: 1500, minHeight: 400, idealHeight: 600)
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
