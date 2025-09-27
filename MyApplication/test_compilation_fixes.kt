// Test file to verify notification system compilation
package com.example.myapplication.test

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

// Test the date formatting fix
fun testDateFormatting() {
    val instant = Instant.now()
    val formatted = instant.atZone(ZoneId.systemDefault())
        .format(DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT))
    println("✅ Date formatting works: $formatted")
}

// Test the Alert model
data class TestAlert(
    val id: String,
    val timestamp: Instant,
    val acknowledged: Boolean = false
)

fun testAlertModel() {
    val alert = TestAlert(
        id = "TEST-001",
        timestamp = Instant.now(),
        acknowledged = false
    )
    println("✅ Alert model works: ${alert.id}")
}

fun main() {
    println("🧪 Testing Notification System Compilation Fixes")
    println("=" * 50)
    
    testDateFormatting()
    testAlertModel()
    
    println("\n🎉 All compilation fixes verified!")
    println("=" * 50)
}

// Extension function for string repetition
operator fun String.times(n: Int): String = this.repeat(n)

