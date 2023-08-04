package com.persona.personaalpha

import android.annotation.SuppressLint
import android.content.Context
import com.facebook.flipper.android.AndroidFlipperClient
import com.facebook.flipper.android.utils.FlipperUtils
import com.facebook.flipper.plugins.crashreporter.CrashReporterPlugin
import com.facebook.flipper.plugins.databases.DatabasesFlipperPlugin
import com.facebook.flipper.plugins.fresco.FrescoFlipperPlugin
import com.facebook.flipper.plugins.inspector.DescriptorMapping
import com.facebook.flipper.plugins.inspector.InspectorFlipperPlugin
import com.facebook.flipper.plugins.network.FlipperOkhttpInterceptor
import com.facebook.flipper.plugins.network.NetworkFlipperPlugin
import com.facebook.flipper.plugins.sharedpreferences.SharedPreferencesFlipperPlugin
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.network.NetworkingModule

class ReactNativeFlipper {

    companion object {
        @SuppressLint("VisibleForTests")
        fun initializeFlipper(context: Context?, reactInstanceManager: ReactInstanceManager) {
            if (FlipperUtils.shouldEnableFlipper(context)) {
                val client = AndroidFlipperClient.getInstance(context)
                client.addPlugin(InspectorFlipperPlugin(context, DescriptorMapping.withDefaults()))
                client.addPlugin(DatabasesFlipperPlugin(context))
                client.addPlugin(SharedPreferencesFlipperPlugin(context))
                client.addPlugin(CrashReporterPlugin.getInstance())
                val networkFlipperPlugin = NetworkFlipperPlugin()
                NetworkingModule.setCustomClientBuilder { builder ->
                    builder.addNetworkInterceptor(
                        FlipperOkhttpInterceptor(networkFlipperPlugin)
                    )
                }
                client.addPlugin(networkFlipperPlugin)
                client.start()

                val reactContext = reactInstanceManager.currentReactContext
                if (reactContext == null) {
                    reactInstanceManager.addReactInstanceEventListener(
                        object : ReactInstanceEventListener {
                            override fun onReactContextInitialized(reactContext: ReactContext) {
                                reactInstanceManager.removeReactInstanceEventListener(this)
                                reactContext.runOnNativeModulesQueueThread {
                                    client.addPlugin(
                                        FrescoFlipperPlugin()
                                    )
                                }
                            }
                        })
                } else {
                    client.addPlugin(FrescoFlipperPlugin())
                }
            }
        }
    }
}