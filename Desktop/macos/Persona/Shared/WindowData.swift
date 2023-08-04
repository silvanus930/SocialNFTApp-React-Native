import SwiftUI

class WindowActive : NSObject, ObservableObject {
    @Published var status: Bool = false
    
    func add(window: NSWindow) {
        window.delegate = self
        status = true
    }
}

extension WindowActive: NSWindowDelegate {
    func windowDidBecomeKey(_ notification: Notification) {
        if (notification.object as? NSWindow) != nil {
            status = true
        }
    }
    func windowDidResignKey(_ notification: Notification) {
        if (notification.object as? NSWindow) != nil {
            status = false
        }
    }
}

struct HostingWindowFinder: NSViewRepresentable {
    var callback: (NSWindow?) -> ()
    
    func makeNSView(context: Self.Context) -> NSView {
        let view = NSView(frame: NSRect(x: 0, y: 0, width: 0, height: 0))
        DispatchQueue.main.async { [weak view] in
            self.callback(view?.window)
        }
        return view
    }
    
    func updateNSView(_ nsView: NSView, context: Context) {}
}
