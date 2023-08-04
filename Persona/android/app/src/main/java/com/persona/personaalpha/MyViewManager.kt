package com.persona.personaalpha

import android.view.Choreographer
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.persona.personaalpha.ui.ChatFragment

class MyViewManager(private val reactContext: ReactApplicationContext) :
    ViewGroupManager<FrameLayout>() {
    private val reactClass = "MyViewManager"
    private val commandCreate = 1
    private var propWidth = 0
    private var propHeight = 0


    override fun getName(): String {
        return reactClass
    }

    override fun createViewInstance(reactContext: ThemedReactContext): FrameLayout {
        return FrameLayout(reactContext)
    }

    override fun getCommandsMap(): Map<String, Int>? {
        return MapBuilder.of("create", commandCreate)
    }

    override fun receiveCommand(
        root: FrameLayout,
        commandId: String,
        args: ReadableArray?
    ) {
        super.receiveCommand(root, commandId, args)
        val reactNativeViewId = args?.getInt(0)
        when (commandId.toInt()) {
            commandCreate -> createFragment(root, reactNativeViewId ?: 0)
            else -> {}
        }
    }

    @ReactPropGroup(names = ["width", "height"], customType = "Style")
    fun setStyle(view: FrameLayout, index: Int, value: Int) {
        if (index == 0) {
            propWidth = value
        }
        if (index == 1) {
            propHeight = value
        }
    }

    private fun createFragment(root: FrameLayout, reactNativeViewId: Int) {
        val parentView = root.findViewById<View>(reactNativeViewId) as ViewGroup
        setupLayout(parentView)
        val myFragment = ChatFragment()
        val activity = reactContext.currentActivity as FragmentActivity
        activity.supportFragmentManager
            .beginTransaction()
            .replace(reactNativeViewId, myFragment, reactNativeViewId.toString())
            .commit()
    }

    private fun setupLayout(view: View) {
        Choreographer.getInstance().postFrameCallback(object : Choreographer.FrameCallback {
            override fun doFrame(frameTimeNanos: Long) {
                manuallyLayoutChildren(view)
                view.viewTreeObserver.dispatchOnGlobalLayout()
                Choreographer.getInstance().postFrameCallback(this)
            }
        })
    }

    fun manuallyLayoutChildren(view: View) {
        // propWidth and propHeight coming from react-native props
        val width = propWidth
        val height = propHeight
        view.measure(
            View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY)
        )
        view.layout(0, 0, width, height)
    }
}