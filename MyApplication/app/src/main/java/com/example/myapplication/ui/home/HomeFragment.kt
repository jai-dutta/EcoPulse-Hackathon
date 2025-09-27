package com.example.myapplication.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.NavOptions
import androidx.navigation.fragment.findNavController
import com.example.myapplication.databinding.FragmentHomeBinding

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val homeViewModel = ViewModelProvider(this).get(HomeViewModel::class.java)

        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        val root: View = binding.root

        // Set up click listeners for quick action cards
        setupQuickActions()

        return root
    }

    private fun setupQuickActions() {
        // Dashboard card click - navigate to dashboard
        binding.cardDashboard.setOnClickListener {
            // Create NavOptions to clear the back stack
            val navOptions = NavOptions.Builder()
                .setPopUpTo(com.example.myapplication.R.id.navigation_home, true)
                .build()
            
            // Navigate to dashboard tab with proper stack management
            findNavController().navigate(com.example.myapplication.R.id.navigation_dashboard, null, navOptions)
        }

        // Health Check card click - show health check bottom sheet
        binding.cardSettings.setOnClickListener {
            // Show health check bottom sheet
            showHealthCheckBottomSheet()
        }
    }

    private fun showHealthCheckBottomSheet() {
        val bottomSheet = com.example.myapplication.ui.dashboard.HealthCheckBottomSheetFragment.newInstance()
        bottomSheet.show(parentFragmentManager, "HealthCheckBottomSheet")
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}