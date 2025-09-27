package com.example.myapplication.data.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.myapplication.MainActivity
import com.example.myapplication.R
import com.example.myapplication.data.model.Alert
import com.example.myapplication.data.model.AlertType

class MicrogridNotificationManager(private val context: Context) {
    
    companion object {
        const val CHANNEL_CRITICAL = "alerts_critical"
        const val CHANNEL_WARNING = "alerts_warning"
        const val CHANNEL_INFO = "alerts_info"
        
        const val NOTIFICATION_ID_CRITICAL = 1001
        const val NOTIFICATION_ID_WARNING = 1002
        const val NOTIFICATION_ID_INFO = 1003
    }
    
    private val notificationManager = NotificationManagerCompat.from(context)
    
    init {
        createNotificationChannels()
    }
    
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val systemNotificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // Critical alerts channel
            val criticalChannel = NotificationChannel(
                CHANNEL_CRITICAL,
                "Critical Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical microgrid alerts requiring immediate attention"
                enableVibration(true)
                enableLights(true)
            }
            
            // Warning alerts channel
            val warningChannel = NotificationChannel(
                CHANNEL_WARNING,
                "Warnings",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Warning alerts and advisories"
                enableVibration(false)
                enableLights(true)
            }
            
            // Info alerts channel
            val infoChannel = NotificationChannel(
                CHANNEL_INFO,
                "Information",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Informational updates"
                enableVibration(false)
                enableLights(false)
            }
            
            systemNotificationManager.createNotificationChannels(
                listOf(criticalChannel, warningChannel, infoChannel)
            )
        }
    }
    
    fun showNotification(alert: Alert) {
        val channelId = when (alert.type) {
            is AlertType.Error -> CHANNEL_CRITICAL
            is AlertType.Warning -> CHANNEL_WARNING
            is AlertType.Info -> CHANNEL_INFO
        }
        
        val notificationId = when (alert.type) {
            is AlertType.Error -> NOTIFICATION_ID_CRITICAL
            is AlertType.Warning -> NOTIFICATION_ID_WARNING
            is AlertType.Info -> NOTIFICATION_ID_INFO
        }
        
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("navigate_to", "notifications")
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(alert.shortCut)
            .setContentText(alert.reason)
            .setPriority(
                when (alert.type) {
                    is AlertType.Error -> NotificationCompat.PRIORITY_HIGH
                    is AlertType.Warning -> NotificationCompat.PRIORITY_DEFAULT
                    is AlertType.Info -> NotificationCompat.PRIORITY_LOW
                }
            )
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setStyle(NotificationCompat.BigTextStyle().bigText(alert.reason))
            .build()
        
        notificationManager.notify(notificationId, notification)
    }
    
    fun cancelNotification(alert: Alert) {
        val notificationId = when (alert.type) {
            is AlertType.Error -> NOTIFICATION_ID_CRITICAL
            is AlertType.Warning -> NOTIFICATION_ID_WARNING
            is AlertType.Info -> NOTIFICATION_ID_INFO
        }
        notificationManager.cancel(notificationId)
    }
    
    fun cancelAllNotifications() {
        notificationManager.cancelAll()
    }
}

