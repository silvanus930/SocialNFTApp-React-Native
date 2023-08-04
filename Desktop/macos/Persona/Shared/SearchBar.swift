import Foundation
import SwiftUI

struct NSSearchBar: NSViewRepresentable {
    @Binding var search: String
    @EnvironmentObject var focusSearch: FocusSearch
    
    func makeNSView(context: Context) -> NSSearchField {
        let searchfield = NSSearchField(frame: .zero)
        return searchfield
    }
    
    func changeSearchFieldItem(searchfield: NSSearchField, sender: AnyObject) -> NSSearchField {
        (searchfield.cell as? NSSearchFieldCell)?.placeholderString = sender.title
        return searchfield
    }
    
    func updateNSView(_ searchField: NSSearchField, context: Context) {
        searchField.stringValue = search
        searchField.delegate = context.coordinator
        if focusSearch.state == FocusDocumentMode.focus {
            DispatchQueue.main.async {
                searchField.becomeFirstResponder()
                self.focusSearch.state = FocusDocumentMode.auto
            }
        }
    }
    
    func makeCoordinator() -> Coordinator {
        return Coordinator(self)
    }
    
    class Coordinator: NSObject, NSSearchFieldDelegate {
        var parent: NSSearchBar
        
        init(_ parent: NSSearchBar) {
            self.parent = parent
        }
        
        func controlTextDidChange(_ notification: Notification) {
            guard let searchField = notification.object as? NSSearchField else {
                print("Unexpected control in update notification")
                return
            }
            self.parent.search = searchField.stringValue
        }
    }
}

struct NSTextFieldEntry: NSViewRepresentable {
    @Binding var text: String
    var placeHolder: String = ""
    var font: NSFont
    var onSubmit: () -> Void
    
    func makeNSView(context: Context) -> NSTextField {
        let textField = NSTextField(frame: .zero)
        textField.delegate = context.coordinator
        textField.placeholderString = placeHolder
        return textField
    }
    
    func updateNSView(_ textField: NSTextField, context: Context) {
        textField.stringValue = text
        textField.font = font
        textField.bezelStyle = NSTextField.BezelStyle.roundedBezel
    }
    
    func makeCoordinator() -> Coordinator {
        return Coordinator(self)
    }
    
    class Coordinator: NSObject, NSTextFieldDelegate {
        var parent: NSTextFieldEntry
        
        init(_ parent: NSTextFieldEntry) {
            self.parent = parent
        }
        
        func control(_ control: NSControl, textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
            if commandSelector == #selector(NSStandardKeyBindingResponding.insertNewline(_:)) {
                self.parent.onSubmit()
                return true
            }
            return false
        }
        
        func controlTextDidChange(_ notification: Notification) {
            guard let textField = notification.object as? NSTextField else {
                print("Unexpected control in update notification")
                return
            }
            self.parent.text = textField.stringValue
        }
    }
}
