package com.example.myapplication.ui.dashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.example.myapplication.databinding.FragmentDashboardBinding

class DashboardFragment : Fragment() {

    private var _binding: FragmentDashboardBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val dashboardViewModel = ViewModelProvider(this).get(DashboardViewModel::class.java)

        _binding = FragmentDashboardBinding.inflate(inflater, container, false)
        val root: View = binding.root

        // Observe microgrid data
        dashboardViewModel.microgridData.observe(viewLifecycleOwner) { data ->
            updateUI(data, dashboardViewModel)
        }

        // Observe connection status
        dashboardViewModel.connectionStatus.observe(viewLifecycleOwner) { isConnected ->
            updateConnectionStatus(isConnected)
        }

        // Observe loading state
        dashboardViewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.btnRefresh.isEnabled = !isLoading
            binding.btnRefresh.text = if (isLoading) "⏳ Loading..." else "🔄 Refresh Data"
        }

        // Observe error messages
        dashboardViewModel.errorMessage.observe(viewLifecycleOwner) { error ->
            if (error != null) {
                binding.tvConnectionStatus.text = "🔴 $error"
                binding.tvConnectionStatus.setTextColor(resources.getColor(com.example.myapplication.R.color.error_color, null))
            }
        }

        // Set up refresh button
        binding.btnRefresh.setOnClickListener {
            dashboardViewModel.loadMicrogridData(showLoading = true)
        }

        // Set up battery card click listeners
        setupBatteryCardClickListeners()
        
        // Set up device card click listener
        setupDeviceCardClickListeners()

        return root
    }

    private fun setupBatteryCardClickListeners() {
        // Add click listeners to battery cards
        binding.cardBatterySoc.setOnClickListener {
            showBatteryStatusBottomSheet()
        }
        
        binding.cardBatteryPower.setOnClickListener {
            showBatteryStatusBottomSheet()
        }
    }

    private fun setupDeviceCardClickListeners() {
        // Add click listener to device count card
        binding.cardDeviceCount.setOnClickListener {
            showDeviceStatusBottomSheet()
        }
    }

    private fun showBatteryStatusBottomSheet() {
        val bottomSheet = BatteryStatusBottomSheetFragment.newInstance()
        bottomSheet.show(parentFragmentManager, "BatteryStatusBottomSheet")
    }

    private fun showDeviceStatusBottomSheet() {
        val bottomSheet = DeviceStatusBottomSheetFragment.newInstance()
        bottomSheet.show(parentFragmentManager, "DeviceStatusBottomSheet")
    }

    private fun updateUI(data: com.example.myapplication.data.model.MicrogridResponse, viewModel: DashboardViewModel) {
        // Update header
        binding.tvCurrentTime.text = viewModel.formatTimestamp(data.timestamp)
        
        // Update environmental data
        binding.tvTemperature.text = viewModel.formatTemperature(data.environment.temperature)
        binding.tvSolarRadiation.text = viewModel.formatSolarRadiation(data.environment.solar_radiation)
        binding.tvWindSpeed.text = viewModel.formatWindSpeed(data.environment.wind_speed)
        binding.tvWindDirection.text = viewModel.formatWindDirection(data.environment.wind_direction)
        
        // Update battery data (handle empty batteries array)
        val firstBattery = data.batteries.firstOrNull()
        if (firstBattery != null) {
            binding.tvBatterySoc.text = viewModel.formatBatterySOC(firstBattery.state_of_charge)
            binding.tvBatteryPower.text = viewModel.formatPower(firstBattery.current_power)
        } else {
            binding.tvBatterySoc.text = "No batteries"
            binding.tvBatteryPower.text = "0.0 kW"
        }
        
        // Update grid and generation (handle empty grid_connections array)
        val firstGrid = data.grid_connections.firstOrNull()
        if (firstGrid != null) {
            binding.tvGridPower.text = viewModel.formatPower(firstGrid.current_power)
        } else {
            binding.tvGridPower.text = "0.0 kW"
        }
        binding.tvTotalGeneration.text = viewModel.formatPower(data.total_generation)
        
        // Update device count with more informative message
        if (data.device_count > 0) {
            binding.tvDeviceCount.text = viewModel.formatDeviceCount(data.device_count)
        } else {
            binding.tvDeviceCount.text = "No devices configured"
        }
    }

    private fun updateConnectionStatus(isConnected: Boolean) {
        if (isConnected) {
            binding.tvConnectionStatus.text = "🟢 Connected"
            binding.tvConnectionStatus.setTextColor(resources.getColor(com.example.myapplication.R.color.success_color, null))
        } else {
            binding.tvConnectionStatus.text = "🔴 Disconnected"
            binding.tvConnectionStatus.setTextColor(resources.getColor(com.example.myapplication.R.color.error_color, null))
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}