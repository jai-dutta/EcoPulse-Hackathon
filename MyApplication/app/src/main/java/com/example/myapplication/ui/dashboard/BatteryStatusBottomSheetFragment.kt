package com.example.myapplication.ui.dashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.example.myapplication.R
import com.example.myapplication.data.api.ApiClient
import com.example.myapplication.data.model.BatteryStatus
import com.example.myapplication.data.model.BatteryStatusResponse
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import kotlinx.coroutines.launch

class BatteryStatusBottomSheetFragment : BottomSheetDialogFragment() {

    private lateinit var loadingLayout: LinearLayout
    private lateinit var contentScrollView: View
    private lateinit var errorLayout: LinearLayout
    private lateinit var batteryDetailsLayout: LinearLayout

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.bottom_sheet_battery_status, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupViews(view)
        setupClickListeners(view)
        loadBatteryStatus()
    }

    private fun setupViews(view: View) {
        loadingLayout = view.findViewById(R.id.layout_loading)
        contentScrollView = view.findViewById(R.id.scroll_content)
        errorLayout = view.findViewById(R.id.layout_error)
        batteryDetailsLayout = view.findViewById(R.id.layout_battery_details)
    }

    private fun setupClickListeners(view: View) {
        view.findViewById<View>(R.id.iv_close).setOnClickListener {
            dismiss()
        }
        
        view.findViewById<View>(R.id.btn_retry).setOnClickListener {
            loadBatteryStatus()
        }
    }

    private fun loadBatteryStatus() {
        showLoadingState()
        
        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.getBatteryStatus()
                showBatteryData(response)
            } catch (e: Exception) {
                showErrorState("Failed to load battery status: ${e.message}")
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

    private fun showBatteryData(data: BatteryStatusResponse) {
        loadingLayout.visibility = View.GONE
        contentScrollView.visibility = View.VISIBLE
        errorLayout.visibility = View.GONE

        // Update summary cards
        view?.findViewById<TextView>(R.id.tv_total_batteries)?.text = data.total_batteries.toString()
        view?.findViewById<TextView>(R.id.tv_total_power)?.text = formatPower(data.total_power_kw)
        view?.findViewById<TextView>(R.id.tv_total_capacity)?.text = formatCapacity(data.total_capacity_kwh)
        view?.findViewById<TextView>(R.id.tv_total_energy)?.text = formatCapacity(data.total_energy_kwh)

        // Clear existing battery details
        batteryDetailsLayout.removeAllViews()

        // Add individual battery details
        data.batteries.forEach { battery ->
            val batteryCard = createBatteryCard(battery)
            batteryDetailsLayout.addView(batteryCard)
        }
    }

    private fun createBatteryCard(battery: BatteryStatus): View {
        val inflater = LayoutInflater.from(context)
        val cardView = inflater.inflate(R.layout.battery_detail_card, batteryDetailsLayout, false)

        // Set battery name
        cardView.findViewById<TextView>(R.id.tv_battery_name).text = battery.name

        // Set capacity and SOC
        cardView.findViewById<TextView>(R.id.tv_capacity).text = formatCapacity(battery.capacity_kwh)
        cardView.findViewById<TextView>(R.id.tv_soc_percent).text = "${battery.soc_percent.toInt()}%"
        cardView.findViewById<TextView>(R.id.tv_soc_kwh).text = formatCapacity(battery.state_of_charge)

        // Set power and efficiency
        cardView.findViewById<TextView>(R.id.tv_current_power).text = formatPower(battery.current_power)
        cardView.findViewById<TextView>(R.id.tv_max_power).text = formatPower(battery.max_power_kw)
        cardView.findViewById<TextView>(R.id.tv_efficiency).text = "${(battery.efficiency * 100).toInt()}%"

        // Set status color based on SOC
        val statusColor = when {
            battery.soc_percent > 80 -> R.color.success_color
            battery.soc_percent > 20 -> R.color.solar_card
            else -> R.color.error_color
        }
        cardView.findViewById<TextView>(R.id.tv_status).setTextColor(resources.getColor(statusColor, null))
        cardView.findViewById<TextView>(R.id.tv_status).text = when {
            battery.soc_percent > 80 -> "🟢 High"
            battery.soc_percent > 20 -> "🟡 Medium"
            else -> "🔴 Low"
        }

        return cardView
    }

    private fun formatPower(power: Double): String {
        return String.format("%.1f kW", power)
    }

    private fun formatCapacity(capacity: Double): String {
        return String.format("%.0f kWh", capacity)
    }

    companion object {
        fun newInstance(): BatteryStatusBottomSheetFragment {
            return BatteryStatusBottomSheetFragment()
        }
    }
}

