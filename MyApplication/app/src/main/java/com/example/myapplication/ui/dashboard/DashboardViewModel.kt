package com.example.myapplication.ui.dashboard

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.myapplication.data.api.ApiClient
import com.example.myapplication.data.model.MicrogridResponse
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class DashboardViewModel : ViewModel() {

    private val _microgridData = MutableLiveData<MicrogridResponse>()
    val microgridData: LiveData<MicrogridResponse> = _microgridData

    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    private val _errorMessage = MutableLiveData<String>()
    val errorMessage: LiveData<String> = _errorMessage

    private val _connectionStatus = MutableLiveData<Boolean>()
    val connectionStatus: LiveData<Boolean> = _connectionStatus

    private var updateJob: Job? = null
    private var isAutoUpdateEnabled = true
    private var connectionFailureCount = 0
    private var lastSuccessfulConnection = System.currentTimeMillis()

    init {
        loadMicrogridData(showLoading = true) // Show loading only on first load
        startAutoUpdate()
    }

    private fun startAutoUpdate() {
        updateJob = viewModelScope.launch {
            while (isAutoUpdateEnabled) {
                delay(1000) // Update every 1 second
                if (isAutoUpdateEnabled) {
                    loadMicrogridData()
                }
            }
        }
    }

    fun stopAutoUpdate() {
        isAutoUpdateEnabled = false
        updateJob?.cancel()
    }

    fun resumeAutoUpdate() {
        if (!isAutoUpdateEnabled) {
            isAutoUpdateEnabled = true
            startAutoUpdate()
        }
    }

    fun loadMicrogridData(showLoading: Boolean = false) {
        viewModelScope.launch {
            try {
                if (showLoading) {
                    _isLoading.value = true
                }
                
                val response = ApiClient.apiService.getMicrogridData()
                
                if (response.isSuccessful) {
                    response.body()?.let { data ->
                        _microgridData.value = data
                        // Only update connection status if it's been disconnected for a while
                        updateConnectionStatus(true)
                        _errorMessage.value = null
                    }
                } else {
                    handleConnectionFailure("Failed to load data: ${response.code()}")
                }
            } catch (e: Exception) {
                handleConnectionFailure("Connection error: ${e.message}")
            } finally {
                if (showLoading) {
                    _isLoading.value = false
                }
            }
        }
    }

    private fun updateConnectionStatus(isConnected: Boolean) {
        if (isConnected) {
            connectionFailureCount = 0
            lastSuccessfulConnection = System.currentTimeMillis()
            _connectionStatus.value = true
        } else {
            connectionFailureCount++
            // Only show disconnected after 3 consecutive failures
            if (connectionFailureCount >= 3) {
                _connectionStatus.value = false
            }
        }
    }

    private fun handleConnectionFailure(errorMessage: String) {
        updateConnectionStatus(false)
        _errorMessage.value = errorMessage
    }

    fun formatTimestamp(timestamp: String): String {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val outputFormat = SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault())
            val date = inputFormat.parse(timestamp)
            outputFormat.format(date ?: Date())
        } catch (e: Exception) {
            timestamp
        }
    }

    fun formatTemperature(temperature: Double): String {
        return String.format("%.1f°C", temperature)
    }

    fun formatSolarRadiation(solarRadiation: Double): String {
        return String.format("%.1f W/m²", solarRadiation)
    }

    fun formatWindSpeed(windSpeed: Double): String {
        return String.format("%.1f m/s", windSpeed)
    }

    fun formatWindDirection(windDirection: Double): String {
        return String.format("%.0f°", windDirection)
    }

    fun formatBatterySOC(soc: Double): String {
        return String.format("%.1f kWh", soc)
    }

    fun formatPower(power: Double): String {
        return String.format("%.1f kW", power)
    }

    fun formatDeviceCount(count: Int): String {
        return "$count devices"
    }
}