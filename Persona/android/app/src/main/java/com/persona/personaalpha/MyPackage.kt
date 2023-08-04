package com.persona.personaalpha

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import java.util.*

class MyPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> =
        Collections.emptyList()

    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<MyViewManager> =
        Collections.singletonList(
            MyViewManager(
                reactContext
            )
        )
}