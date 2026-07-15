package com.infro.app

import android.app.Application
import android.util.Log

/**
 * Application class with global exception handler to prevent silent crashes.
 */
class InfroApp : Application() {
    override fun onCreate() {
        super.onCreate()

        // Global uncaught exception handler — logs errors instead of silently crashing
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e("InfroApp", "Uncaught exception on ${thread.name}", throwable)
            defaultHandler?.uncaughtException(thread, throwable)
        }
    }
}
