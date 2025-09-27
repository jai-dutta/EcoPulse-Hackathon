package com.example.myapplication.ui.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.model.Alert
import com.example.myapplication.data.model.AlertType
import com.example.myapplication.data.repository.NotificationRepository
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class NotificationsViewModel : ViewModel() {
    
    private val repository = NotificationRepository()
    
    val alerts: StateFlow<List<Alert>> = repository.alerts
    val unreadCount: StateFlow<Int> = repository.unreadCount
    
    fun acknowledgeAlert(alertId: String) {
        viewModelScope.launch {
            repository.acknowledgeAlert(alertId)
        }
    }
    
    fun removeAlert(alertId: String) {
        viewModelScope.launch {
            repository.removeAlert(alertId)
        }
    }
    
    fun getAlertsByType(type: AlertType): List<Alert> {
        return repository.getAlertsByType(type)
    }
    
    fun getUnacknowledgedAlerts(): List<Alert> {
        return repository.getUnacknowledgedAlerts()
    }
    
    fun addTestAlert() {
        viewModelScope.launch {
            val testAlert = Alert(
                id = "TEST-${System.currentTimeMillis()}",
                type = AlertType.Warning,
                shortCut = "Test Alert",
                reason = "This is a test alert to demonstrate the notification system.",
                actions = listOf("Acknowledge", "Dismiss"),
                timestamp = java.time.Instant.now(),
                acknowledged = false
            )
            repository.addAlert(testAlert)
        }
    }
}