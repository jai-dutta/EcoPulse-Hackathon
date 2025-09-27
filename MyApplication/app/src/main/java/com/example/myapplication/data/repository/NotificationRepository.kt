package com.example.myapplication.data.repository

import com.example.myapplication.data.model.Alert
import com.example.myapplication.data.model.SampleAlerts
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class NotificationRepository {
    
    private val _alerts = MutableStateFlow(SampleAlerts.alerts)
    val alerts: StateFlow<List<Alert>> = _alerts.asStateFlow()
    
    private val _unreadCount = MutableStateFlow(
        SampleAlerts.alerts.count { !it.acknowledged }
    )
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()
    
    fun acknowledgeAlert(alertId: String) {
        val currentAlerts = _alerts.value
        val updatedAlerts = currentAlerts.map { alert ->
            if (alert.id == alertId && !alert.acknowledged) {
                alert.copy(acknowledged = true)
            } else {
                alert
            }
        }
        _alerts.value = updatedAlerts
        _unreadCount.value = updatedAlerts.count { !it.acknowledged }
    }
    
    fun addAlert(alert: Alert) {
        val currentAlerts = _alerts.value
        _alerts.value = listOf(alert) + currentAlerts
        _unreadCount.value = _unreadCount.value + 1
    }
    
    fun removeAlert(alertId: String) {
        val currentAlerts = _alerts.value
        val alertToRemove = currentAlerts.find { it.id == alertId }
        val updatedAlerts = currentAlerts.filter { it.id != alertId }
        _alerts.value = updatedAlerts
        
        if (alertToRemove != null && !alertToRemove.acknowledged) {
            _unreadCount.value = maxOf(0, _unreadCount.value - 1)
        }
    }
    
    fun getAlertsByType(type: com.example.myapplication.data.model.AlertType): List<Alert> {
        return _alerts.value.filter { it.type == type }
    }
    
    fun getUnacknowledgedAlerts(): List<Alert> {
        return _alerts.value.filter { !it.acknowledged }
    }
}

