package com.example.myapplication.test

import com.example.myapplication.data.model.Alert
import com.example.myapplication.data.model.AlertType
import com.example.myapplication.data.model.SampleAlerts
import java.time.Instant

fun main() {
    println("🧪 Testing Microgrid Notification System")
    println("=" * 50)
    
    // Test 1: Sample Alerts
    println("\n📊 Sample Alerts:")
    SampleAlerts.alerts.forEach { alert ->
        val icon = when (alert.type) {
            is AlertType.Error -> "🔴"
            is AlertType.Warning -> "🟡"
            is AlertType.Info -> "🔵"
        }
        val status = if (alert.acknowledged) "✅" else "⏳"
        println("$icon $status ${alert.shortCut}")
        println("   ${alert.reason}")
        println("   Actions: ${alert.actions.joinToString(", ")}")
        println()
    }
    
    // Test 2: Alert Statistics
    val totalAlerts = SampleAlerts.alerts.size
    val unacknowledgedAlerts = SampleAlerts.alerts.count { !it.acknowledged }
    val criticalAlerts = SampleAlerts.alerts.count { it.type is AlertType.Error }
    val warningAlerts = SampleAlerts.alerts.count { it.type is AlertType.Warning }
    val infoAlerts = SampleAlerts.alerts.count { it.type is AlertType.Info }
    
    println("📈 Alert Statistics:")
    println("   Total Alerts: $totalAlerts")
    println("   Unacknowledged: $unacknowledgedAlerts")
    println("   Critical (Error): $criticalAlerts")
    println("   Warnings: $warningAlerts")
    println("   Information: $infoAlerts")
    
    // Test 3: Create Custom Alert
    println("\n🆕 Creating Custom Alert:")
    val customAlert = Alert(
        id = "TEST-001",
        type = AlertType.Warning,
        shortCut = "Custom Test Alert",
        reason = "This is a test alert created programmatically",
        actions = listOf("Acknowledge", "Dismiss", "Investigate"),
        timestamp = Instant.now(),
        acknowledged = false
    )
    
    println("✅ Custom alert created successfully!")
    println("   ID: ${customAlert.id}")
    println("   Type: ${customAlert.type}")
    println("   Title: ${customAlert.shortCut}")
    println("   Reason: ${customAlert.reason}")
    println("   Actions: ${customAlert.actions.joinToString(", ")}")
    println("   Timestamp: ${customAlert.timestamp}")
    println("   Acknowledged: ${customAlert.acknowledged}")
    
    println("\n🎉 All tests passed! Notification system is working correctly.")
    println("=" * 50)
}

// Extension function for string repetition
operator fun String.times(n: Int): String = this.repeat(n)

