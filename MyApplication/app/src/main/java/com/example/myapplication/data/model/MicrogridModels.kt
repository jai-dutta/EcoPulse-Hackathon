package com.example.myapplication.data.model

import java.time.Instant

data class MicrogridResponse(
    val timestamp: String,
    val environment: EnvironmentData,
    val devices: List<DeviceState>,
    val batteries: List<BatteryData>,
    val grid_connections: List<GridData>,
    val diesel_strategy: String,
    val total_generation: Double,
    val total_storage_power: Double,
    val total_grid_power: Double,
    val device_count: Int
)

data class EnvironmentData(
    val temperature: Double,
    val wind_speed: Double,
    val wind_direction: Double,
    val solar_radiation: Double
)

data class DeviceState(
    val name: String,
    val power_output: Double
)

data class BatteryData(
    val name: String,
    val capacity_kwh: Double,
    val max_power_kw: Double,
    val state_of_charge: Double,
    val current_power: Double
)

data class GridData(
    val name: String,
    val import_price: Double,
    val export_price: Double,
    val current_power: Double
)

// Battery Status API Models
data class BatteryStatusResponse(
    val batteries: List<BatteryStatus>,
    val total_batteries: Int,
    val total_capacity_kwh: Double,
    val total_energy_kwh: Double,
    val total_power_kw: Double
)

data class BatteryStatus(
    val name: String,
    val capacity_kwh: Double,
    val max_power_kw: Double,
    val state_of_charge: Double,
    val soc_percent: Double,
    val current_power: Double,
    val efficiency: Double
)

// Device Status API Models
data class DeviceStatusResponse(
    val devices: List<DeviceStatus>,
    val total_devices: Int,
    val total_generation: Double
)

data class DeviceStatus(
    val name: String,
    val type: String,
    val power_output: Double
)

// Health Check API Models
data class HealthCheckResponse(
    val status: String,
    val timestamp: String,
    val devices_count: Int,
    val environment_time: String,
    val api_version: String
)

// Notification Models
sealed class AlertType {
    object Error : AlertType()
    object Warning : AlertType()
    object Info : AlertType()
}

data class Alert(
    val id: String,
    val type: AlertType,
    val shortCut: String,
    val reason: String,
    val actions: List<String>,
    val timestamp: Instant,
    val acknowledged: Boolean = false
)

// Sample alert data for testing
object SampleAlerts {
    val alerts = listOf(
        Alert(
            id = "E-01",
            type = AlertType.Error,
            shortCut = "Connection lost to server",
            reason = "No data from 10.130.27.152:8000 for 30 s.",
            actions = listOf("Retry", "Open Dashboard"),
            timestamp = Instant.now().minusSeconds(300),
            acknowledged = false
        ),
        Alert(
            id = "E-02",
            type = AlertType.Error,
            shortCut = "Grid disconnected",
            reason = "Grid breaker open or abnormal V/F (V=220V, f=50Hz).",
            actions = listOf("Switch to Island Mode", "View SOP"),
            timestamp = Instant.now().minusSeconds(180),
            acknowledged = false
        ),
        Alert(
            id = "W-01",
            type = AlertType.Warning,
            shortCut = "Severe weather alert: Typhoon",
            reason = "JMA issued severe typhoon warning for Tokyo region.",
            actions = listOf("Open Weather", "Prep Checklist"),
            timestamp = Instant.now().minusSeconds(120),
            acknowledged = false
        ),
        Alert(
            id = "W-02",
            type = AlertType.Warning,
            shortCut = "Heat wave: SOC risk",
            reason = "Forecast 35°C, PV shortfall 15%.",
            actions = listOf("Pre-charge Battery", "Schedule Load Shift"),
            timestamp = Instant.now().minusSeconds(90),
            acknowledged = true
        ),
        Alert(
            id = "I-01",
            type = AlertType.Info,
            shortCut = "Weather update: Clear",
            reason = "Clear skies expected 14:00–18:00; PV increase 20%.",
            actions = listOf("Open Weather"),
            timestamp = Instant.now().minusSeconds(60),
            acknowledged = false
        ),
        Alert(
            id = "I-02",
            type = AlertType.Info,
            shortCut = "Connection restored",
            reason = "Reconnected to 10.130.27.152:8000 at 14:30.",
            actions = listOf("Open Dashboard"),
            timestamp = Instant.now().minusSeconds(30),
            acknowledged = false
        )
    )
}
