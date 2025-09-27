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
import com.example.myapplication.data.model.HealthCheckResponse
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class HealthCheckBottomSheetFragment : BottomSheetDialogFragment() {

    private lateinit var loadingLayout: LinearLayout
    private lateinit var contentScrollView: View
    private lateinit var errorLayout: LinearLayout

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.bottom_sheet_health_check, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupViews(view)
        setupClickListeners(view)
        loadHealthCheck()
    }

    private fun setupViews(view: View) {
        loadingLayout = view.findViewById(R.id.layout_loading)
        contentScrollView = view.findViewById(R.id.scroll_content)
        errorLayout = view.findViewById(R.id.layout_error)
    }

    private fun setupClickListeners(view: View) {
        view.findViewById<View>(R.id.iv_close).setOnClickListener {
            dismiss()
        }
        
        view.findViewById<View>(R.id.btn_retry).setOnClickListener {
            loadHealthCheck()
        }
        
        view.findViewById<View>(R.id.btn_refresh_health).setOnClickListener {
            loadHealthCheck()
        }
    }

    private fun loadHealthCheck() {
        showLoadingState()
        
        lifecycleScope.launch {
            try {
                val response = ApiClient.apiService.getHealthCheck()
                showHealthData(response)
            } catch (e: Exception) {
                showErrorState("Failed to load health check: ${e.message}")
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

    private fun showHealthData(data: HealthCheckResponse) {
        loadingLayout.visibility = View.GONE
        contentScrollView.visibility = View.VISIBLE
        errorLayout.visibility = View.GONE

        // Update status display
        updateStatusDisplay(data.status)
        
        // Update system information
        view?.findViewById<TextView>(R.id.tv_devices_count)?.text = data.devices_count.toString()
        view?.findViewById<TextView>(R.id.tv_api_version)?.text = data.api_version
        
        // Update timestamps
        view?.findViewById<TextView>(R.id.tv_health_timestamp)?.text = formatTimestamp(data.timestamp)
        view?.findViewById<TextView>(R.id.tv_environment_timestamp)?.text = formatTimestamp(data.environment_time)
    }

    private fun updateStatusDisplay(status: String) {
        val statusIcon = view?.findViewById<TextView>(R.id.tv_status_icon)
        val statusText = view?.findViewById<TextView>(R.id.tv_status_text)
        val statusDescription = view?.findViewById<TextView>(R.id.tv_status_description)
        
        when (status.lowercase()) {
            "healthy" -> {
                statusIcon?.text = "🟢"
                statusText?.text = "Healthy"
                statusDescription?.text = "All systems operational"
                statusText?.setTextColor(resources.getColor(R.color.success_color, null))
            }
            "warning" -> {
                statusIcon?.text = "🟡"
                statusText?.text = "Warning"
                statusDescription?.text = "Some systems need attention"
                statusText?.setTextColor(resources.getColor(R.color.solar_card, null))
            }
            "critical", "error" -> {
                statusIcon?.text = "🔴"
                statusText?.text = "Critical"
                statusDescription?.text = "System issues detected"
                statusText?.setTextColor(resources.getColor(R.color.error_color, null))
            }
            else -> {
                statusIcon?.text = "⚪"
                statusText?.text = "Unknown"
                statusDescription?.text = "Status unclear"
                statusText?.setTextColor(resources.getColor(R.color.text_secondary, null))
            }
        }
    }

    private fun formatTimestamp(timestamp: String): String {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val outputFormat = SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault())
            val date = inputFormat.parse(timestamp)
            outputFormat.format(date ?: Date())
        } catch (e: Exception) {
            timestamp
        }
    }

    companion object {
        fun newInstance(): HealthCheckBottomSheetFragment {
            return HealthCheckBottomSheetFragment()
        }
    }
}

