import Cocoa
import SwiftUI
import FirebaseFirestore
import FirebaseFunctions
import WebKit

func recursiveMarkDelete(ref: DocumentReference) {
    let deleteFn = Functions.functions().httpsCallable("recursiveMarkDelete")
    let data = ["docPath": "/" + ref.path]
    deleteFn.call(data, completion: {_,_ in })
}

class DetailWindowController<RootView : View>: NSWindowController {
    convenience init(rootView: RootView, width: CGFloat = 400, height: CGFloat = 300) {
        let hostingController = NSHostingController(rootView: rootView.frame(minWidth: width, minHeight: height))
        let window = NSWindow(contentViewController: hostingController)
        window.setContentSize(NSSize(width: width, height: height))
        self.init(window: window)
    }
}

extension View {
    func whenHovered(_ mouseIsInside: @escaping (Bool) -> Void) -> some View {
        modifier(MouseInsideModifier(mouseIsInside))
    }
}

struct MouseInsideModifier: ViewModifier {
    let mouseIsInside: (Bool) -> Void
    
    init(_ mouseIsInside: @escaping (Bool) -> Void) {
        self.mouseIsInside = mouseIsInside
    }
    
    func body(content: Content) -> some View {
        content.background(
            GeometryReader { proxy in
                Representable(mouseIsInside: mouseIsInside, frame: proxy.frame(in: .global))
            }
        )
    }
    
    private struct Representable: NSViewRepresentable {
        let mouseIsInside: (Bool) -> Void
        let frame: NSRect
        
        func makeCoordinator() -> Coordinator {
            let coordinator = Coordinator()
            coordinator.mouseIsInside = mouseIsInside
            return coordinator
        }
        
        class Coordinator: NSResponder {
            var mouseIsInside: ((Bool) -> Void)?
            
            override func mouseEntered(with event: NSEvent) {
                mouseIsInside?(true)
            }
            
            override func mouseExited(with event: NSEvent) {
                mouseIsInside?(false)
            }
        }
        
        func makeNSView(context: Context) -> NSView {
            let view = NSView(frame: frame)
            
            let options: NSTrackingArea.Options = [
                .mouseEnteredAndExited,
                .inVisibleRect,
                .activeInKeyWindow
            ]
            
            let trackingArea = NSTrackingArea(rect: frame, options: options, owner: context.coordinator, userInfo: nil)
            
            view.addTrackingArea(trackingArea)
            
            return view
        }
        
        func updateNSView(_ nsView: NSView, context: Context) {}
        
        static func dismantleNSView(_ nsView: NSView, coordinator: Coordinator) {
            nsView.trackingAreas.forEach { nsView.removeTrackingArea($0) }
        }
    }
}

extension View {
    func trackingMouse(onMove: @escaping (NSPoint) -> Void) -> some View {
        TrackinAreaView(onMove: onMove) { self }
    }
}

struct TrackinAreaView<Content>: View where Content : View {
    let onMove: (NSPoint) -> Void
    let content: () -> Content
    
    init(onMove: @escaping (NSPoint) -> Void, @ViewBuilder content: @escaping () -> Content) {
        self.onMove = onMove
        self.content = content
    }
    
    var body: some View {
        TrackingAreaRepresentable(onMove: onMove, content: self.content())
    }
}

struct TrackingAreaRepresentable<Content>: NSViewRepresentable where Content: View {
    let onMove: (NSPoint) -> Void
    let content: Content
    
    func makeNSView(context: Context) -> NSHostingView<Content> {
        return TrackingNSHostingView(onMove: onMove, rootView: self.content)
    }
    
    func updateNSView(_ nsView: NSHostingView<Content>, context: Context) {
    }
}

class TrackingNSHostingView<Content>: NSHostingView<Content> where Content : View {
    let onMove: (NSPoint) -> Void
    
    init(onMove: @escaping (NSPoint) -> Void, rootView: Content) {
        self.onMove = onMove
        
        super.init(rootView: rootView)
        
        setupTrackingArea()
    }
    
    required init(rootView: Content) {
        fatalError("init(rootView:) has not been implemented")
    }
    
    @objc required dynamic init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func setupTrackingArea() {
        let options: NSTrackingArea.Options = [.mouseMoved, .activeAlways, .inVisibleRect]
        self.addTrackingArea(NSTrackingArea.init(rect: .zero, options: options, owner: self, userInfo: nil))
    }
        
    override func mouseMoved(with event: NSEvent) {
        self.onMove(self.convert(event.locationInWindow, from: nil))
    }
}

struct LatexMathImageGenerator: NSViewRepresentable {
    let mathString: String
    @Binding var renderedImages: [String: NSImage]

    func makeNSView(context: Context) -> WKWebView {
        let nsView = WKWebView()
        nsView.navigationDelegate = context.coordinator
        let htmlContent = """
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width">
              <title>MathJax example</title>
              <script>MathJax = {
                    tex:{
                            inlineMath: [['$', '$'], ['\\(', '\\)']],
                            tags: 'ams'
                        },
                    svg:{
                            fontCache: 'global'
                        }
                    };
              </script>
              <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
              <script id="MathJax-script" async
                      src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">
              </script>
            </head>
            <body style="background-color:transparent;">
            <p>
            \(mathString)
            </p>
            </body>
            </html>
            """
        nsView.loadHTMLString(htmlContent, baseURL: nil)
        return nsView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {
        // passthrough
    }
    
    func makeCoordinator() -> Coordinator {
        return Coordinator(self)
    }
    
    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: LatexMathImageGenerator
        
        init(_ parent: LatexMathImageGenerator) {
            self.parent = parent
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            webView.takeSnapshot(with: nil) { image, error in
                image?.setName("math:\(self.parent.mathString)")
                self.parent.renderedImages["math:\(self.parent.mathString)"] = image
            }
        }
    }
}
