package com.updategate

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability

class UpdateGateModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext),
  ActivityEventListener,
  LifecycleEventListener {

  private val manager: AppUpdateManager = AppUpdateManagerFactory.create(reactContext)
  private var pendingPromise: Promise? = null

  private val installListener: InstallStateUpdatedListener = InstallStateUpdatedListener { state ->
    when (state.installStatus()) {
      InstallStatus.DOWNLOADED -> emit("downloaded", null)
      InstallStatus.INSTALLED -> {
        emit("installed", null)
        manager.unregisterListener(installListener)
      }
      InstallStatus.FAILED -> emit("failed", state.installErrorCode())
      else -> {}
    }
  }

  init {
    reactContext.addActivityEventListener(this)
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun checkForUpdate(promise: Promise) {
    manager.appUpdateInfo
      .addOnSuccessListener { info -> promise.resolve(buildCheckResult(info)) }
      .addOnFailureListener { err -> promise.reject(ERR_CHECK_FAILED, err) }
  }

  @ReactMethod
  fun startImmediateUpdate(promise: Promise) {
    val activity = getCurrentActivity()
      ?: return promise.reject(ERR_NO_ACTIVITY, "No current activity to attach the update flow to")

    if (pendingPromise != null) {
      return promise.reject(ERR_IN_PROGRESS, "An update flow is already in progress")
    }
    pendingPromise = promise

    manager.appUpdateInfo
      .addOnSuccessListener { info ->
        val available = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
        if (!available || !info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
          rejectPending(ERR_NO_UPDATE, "No immediate update available")
          return@addOnSuccessListener
        }
        try {
          val options = AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build()
          manager.startUpdateFlowForResult(info, activity, options, REQ_CODE)
        } catch (e: Exception) {
          rejectPending(ERR_LAUNCH_FAILED, e.message ?: "Failed to launch update flow")
        }
      }
      .addOnFailureListener { err ->
        rejectPending(ERR_CHECK_FAILED, err.message ?: "Update info lookup failed")
      }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQ_CODE) return
    when (resultCode) {
      Activity.RESULT_OK -> resolvePending(true)
      Activity.RESULT_CANCELED -> rejectPending(ERR_USER_CANCELED, "User canceled the update")
      else -> rejectPending(ERR_UPDATE_FAILED, "Update flow failed with code $resultCode")
    }
  }

  override fun onNewIntent(intent: Intent) {}

  // Re-fires the IMMEDIATE flow if a previously-launched update got interrupted —
  // prevents users from bypassing the gate by backgrounding mid-update.
  override fun onHostResume() {
    manager.appUpdateInfo.addOnSuccessListener { info ->
      if (info.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
        val activity = getCurrentActivity() ?: return@addOnSuccessListener
        try {
          val options = AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build()
          manager.startUpdateFlowForResult(info, activity, options, REQ_CODE)
        } catch (_: Exception) {}
      }
    }
  }

  override fun onHostPause() {}
  override fun onHostDestroy() {
    manager.unregisterListener(installListener)
  }

  private fun resolvePending(value: Any?) {
    pendingPromise?.resolve(value)
    pendingPromise = null
  }

  private fun rejectPending(code: String, message: String) {
    pendingPromise?.reject(code, message)
    pendingPromise = null
  }

  private fun emit(event: String, payload: Any?) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("$EVENT_PREFIX.$event", payload)
  }

  private fun buildCheckResult(info: AppUpdateInfo): WritableMap {
    val map = Arguments.createMap()
    val available = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
    map.putBoolean("updateAvailable", available)
    map.putInt("availableVersionCode", info.availableVersionCode())
    map.putInt("clientStalenessDays", info.clientVersionStalenessDays() ?: 0)
    map.putInt("updatePriority", info.updatePriority())
    map.putBoolean("immediateAllowed", info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE))
    map.putBoolean("flexibleAllowed", info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE))
    return map
  }

  companion object {
    const val NAME = "UpdateGate"
    private const val REQ_CODE = 9000
    private const val EVENT_PREFIX = "UpdateGate"

    private const val ERR_NO_ACTIVITY = "UPDATE_GATE_NO_ACTIVITY"
    private const val ERR_IN_PROGRESS = "UPDATE_GATE_IN_PROGRESS"
    private const val ERR_NO_UPDATE = "UPDATE_GATE_NO_UPDATE"
    private const val ERR_LAUNCH_FAILED = "UPDATE_GATE_LAUNCH_FAILED"
    private const val ERR_CHECK_FAILED = "UPDATE_GATE_CHECK_FAILED"
    private const val ERR_USER_CANCELED = "UPDATE_GATE_USER_CANCELED"
    private const val ERR_UPDATE_FAILED = "UPDATE_GATE_UPDATE_FAILED"
  }
}
