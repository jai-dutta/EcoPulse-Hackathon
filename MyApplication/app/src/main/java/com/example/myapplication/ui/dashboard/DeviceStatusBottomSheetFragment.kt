package com.example.myapplication.ui.dashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.myapplication.R
import com.example.myapplication.data.api.ApiClient
import com.example.myapplication.data.model.DeviceStatus
import com.example.myapplication.data.model.DeviceStatusResponse
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import kotlinx.coroutines.launch

class DeviceStatusBottomSheetFragment : BottomSheetDialogFragment() {

    private lateinit var loadingLayout: LinearLayout
    private lateinit var contentScrollView: View
    private lateinit var errorLayout: LinearLayout
    private lateinit var deviceTypesLayout: LinearLayout
    private lateinit var deviceDetailsLayout: LinearLayout

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.bottom_sheet_device_status, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupViews(view)
        setupClickListeners(view)
        loadDeviceStatus()
    }

    private fun setupViews(view: View) {
        loadingLayout = view.findViewById(R.id.layout_loading)
        contentScrollView = view.findViewById(R.id.scroll_content)
        errorLayout = view.findViewById(R.id.layout_error)
        deviceTypesLayout = view.findViewById(R.id.layout_device_types)
        deviceDetailsLayout = view.findViewById(R.id.layout_device_details)
    }

    private fun setupClickListeners(view: View) {
        view.findViewById<View>(R.id.iv_close).setOnClickListener {
            dismiss()
        }
        
        view.findViewById<View>(R.id.btn_retry).setOnClickListener {
            loadDeviceStatus()
        }
    }

    private fun loadDeviceStatus() {
        showLoadingState()
        
        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.getDeviceStatus()
                showDeviceData(response)
            } catch (e: Exception) {
                showErrorState("Failed to load device status: ${e.message}")
            }
        }
    }

    private fun showLoadingState() {
        loadingLayout.visibility = View.VISIBLE
        contentScrollView.visibility = View.GONE
        errorLayout.visibility = View.GONE
    }

    private fun showErrorState(message: String) {
        loadingLayout.visibility = View.GONE
        contentScrollView.visibility = View.GONE
        errorLayout.visibility = View.VISIBLE
        
        view?.findViewById<TextView>(R.id.tv_error_message)?.text = message
    }

    private fun showDeviceData(data: DeviceStatusResponse) {
        loadingLayout.visibility = View.GONE
        contentScrollView.visibility = View.VISIBLE
        errorLayout.visibility = View.GONE

        // Update summary cards
        view?.findViewById<TextView>(R.id.tv_total_devices)?.text = data.total_devices.toString()
        view?.findViewById<TextView>(R.id.tv_total_generation)?.text = formatPower(data.total_generation)

        // Clear existing layouts
        deviceTypesLayout.removeAllViews()
        deviceDetailsLayout.removeAllViews()

        // Group devices by type
        val devicesByType = data.devices.groupBy { it.type }
        
        // Create device type breakdown cards
        devicesByType.forEach { (type, devices) ->
            val typeCard = createDeviceTypeCard(type, devices)
            deviceTypesLayout.addView(typeCard)
        }

        // Add individual device details
        data.devices.forEach { device ->
            val deviceCard = createDeviceCard(device)
            deviceDetailsLayout.addView(deviceCard)
        }
    }

    private fun createDeviceTypeCard(type: String, devices: List<DeviceStatus>): View {
        val inflater = LayoutInflater.from(context)
        val cardView = inflater.inflate(R.layout.device_type_card, deviceTypesLayout, false)

        // Set device type icon and name
        val icon = getDeviceTypeIcon(type)
        cardView.findViewById<TextView>(R.id.tv_type_icon).text = icon
        cardView.findViewById<TextView>(R.id.tv_type_name).text = type
        cardView.findViewById<TextView>(R.id.tv_type_count).text = "${devices.size} devices"
        
        // Calculate total power for this type
        val totalPower = devices.sumOf { it.power_output }
        cardView.findViewById<TextView>(R.id.tv_type_power).text = formatPower(totalPower)

        return cardView
    }

    private fun createDeviceCard(device: DeviceStatus): View {
        val inflater = LayoutInflater.from(context)
        val cardView = inflater.inflate(R.layout.device_detail_card, deviceDetailsLayout, false)

        // Set device icon, name, and type
        val icon = getDeviceTypeIcon(device.type)
        cardView.findViewById<TextView>(R.id.tv_device_icon).text = icon
        cardView.findViewById<TextView>(R.id.tv_device_name).text = device.name
        cardView.findViewById<TextView>(R.id.tv_device_type).text = device.type

        // Set power output
        cardView.findViewById<TextView>(R.id.tv_power_output).text = formatPower(device.power_output)

        // Set power status (assuming max power is 1000kW for visualization)
        val maxPower = 1000.0
        val powerPercentage = ((device.power_output / maxPower) * 100).toInt().coerceIn(0, 100)
        
        val progressBar = cardView.findViewById<ProgressBar>(R.id.progress_power)
        progressBar.progress = powerPercentage
        cardView.findViewById<TextView>(R.id.tv_power_percentage).text = "$powerPercentage%"

        // Set progress bar color based on power level
        val progressColor = when {
            powerPercentage > 80 -> R.color.success_color
            powerPercentage > 50 -> R.color.solar_card
            powerPercentage > 20 -> R.color.error_color
            else -> R.color.error_color
        }
        progressBar.progressTintList = resources.getColorStateList(progressColor, null)

        return cardView
    }

    private fun getDeviceTypeIcon(type: String): String {
        return when (type.lowercase()) {
            "solarpanel", "solar" -> "☀️"
            "windturbine", "wind" -> "💨"
            "dieselgenerator", "diesel" -> "⛽"
            "battery", "storage" -> "🔋"
            "inverter" -> "⚡"
            "grid" -> "🔌"
            else -> "🔧"
        }
    }

    private fun formatPower(power: Double): String {
        return String.format("%.1f kW", power)
    }

    companion object {
        fun newInstance(): DeviceStatusBottomSheetFragment {
            return DeviceStatusBottomSheetFragment()
        }
    }
}

