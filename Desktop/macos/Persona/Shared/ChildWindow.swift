import SwiftUI

extension CGRect {
    fileprivate func point(anchor: UnitPoint) -> CGPoint {
        var point = self.origin
        point.x += self.size.width * anchor.x
        point.y += self.size.height * (1 - anchor.y)
        return point
    }
}

public struct BorderlessWindow<Content>: NSViewRepresentable where Content: View {
    @Binding private var isVisible: Bool
    private let anchor: UnitPoint
    private let windowAnchor: UnitPoint
    private let windowOffset: CGPoint
    private let content: () -> Content
    
    public init(isVisible: Binding<Bool>,
                anchor: UnitPoint = .center,
                windowAnchor: UnitPoint = .center,
                windowOffset: CGPoint = .zero,
                @ViewBuilder content: @escaping () -> Content) {
        self._isVisible = isVisible
        self.anchor = anchor
        self.windowAnchor = windowAnchor
        self.windowOffset = windowOffset
        self.content = content
    }
    
    public func makeNSView(context: Context) -> NSView {
        NSView(frame: .zero)
    }
    
    public func updateNSView(_ view: NSView,
                             context: Context) {
        context.coordinator.hostingViewController.rootView = AnyView(self.content())

        let window = context.coordinator.window

        // Ensure that the visiblity has changed
        let isVisible = self.isVisible
        if isVisible != window.isVisible {
            if isVisible {
                if let parentWindow = view.window {
                    parentWindow.addChildWindow(window, ordered: .above)
                }
                window.makeKeyAndOrderFront(nil)

                window.alphaValue = 1.0
            } else {
                NSAnimationContext.runAnimationGroup { context in
                    context.duration = 0.1
                    context.timingFunction = CAMediaTimingFunction(name: CAMediaTimingFunctionName.easeIn)
                    window.animator().alphaValue = 0.0
                } completionHandler: {
                    if let parentWindow = view.window {
                        parentWindow.removeChildWindow(window)
                    }
                    window.orderOut(nil)
                }
            }
        }

        // set position of the window
        var viewFrame = view.convert(view.bounds, to: nil)
        viewFrame = view.window?.convertToScreen(viewFrame) ?? viewFrame
        let viewPoint = viewFrame.point(anchor: self.anchor)

        var windowFrame = window.frame
        let windowPoint = windowFrame.point(anchor: self.windowAnchor)

        var shift: CGPoint = viewPoint
        let windowOffset = self.windowOffset
        shift.x += windowOffset.x
        shift.y -= windowOffset.y
        shift.x -= windowPoint.x
        shift.y -= windowPoint.y

        if !shift.equalTo(.zero) {
            windowFrame.origin.x += shift.x
            windowFrame.origin.y += shift.y
            window.setFrame(windowFrame, display: false)
        }
    }
    
    public func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    fileprivate class Window: NSWindow {
        override var canBecomeKey: Bool {
            return true
        }
        
        override var canBecomeMain: Bool {
            return false
        }
    }
    
    public class Coordinator: NSObject, NSWindowDelegate {
        private var parent: BorderlessWindow
        
        fileprivate let window: Window
        fileprivate let hostingViewController: NSHostingController<AnyView>
        
        fileprivate init(_ parent: BorderlessWindow) {
            self.parent = parent
            
            let window = Window()
            window.isOpaque = false
            window.styleMask = .borderless
            window.backgroundColor = .clear
            window.hidesOnDeactivate = true
            window.isExcludedFromWindowsMenu = true
            window.isReleasedWhenClosed = false
            window.becomeKey()
            self.window = window
            
            let hostingViewController = NSHostingController(rootView: AnyView(EmptyView()))
            window.contentViewController = hostingViewController
            self.hostingViewController = hostingViewController
        }
        
        public func windowDidResignMain(_ notification: Notification) {
        }
        
        public func windowDidResignKey(_ notification: Notification) {
            self.parent.isVisible = false
        }
    }
}
