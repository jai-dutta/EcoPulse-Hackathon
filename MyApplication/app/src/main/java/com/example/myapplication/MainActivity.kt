package com.example.myapplication

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import android.widget.PopupWindow
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.findNavController
import androidx.navigation.ui.AppBarConfiguration
import androidx.navigation.ui.setupActionBarWithNavController
import androidx.navigation.ui.setupWithNavController
import com.example.myapplication.data.repository.NotificationRepository
import com.example.myapplication.databinding.ActivityMainBinding
import com.example.myapplication.databinding.UserPopupBinding
import com.google.android.material.badge.BadgeDrawable
import com.google.android.material.bottomnavigation.BottomNavigationView
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var userPopup: PopupWindow? = null
    private lateinit var notificationRepository: NotificationRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize notification repository
        notificationRepository = NotificationRepository()

        val navView: BottomNavigationView = binding.navView

        val navController = findNavController(R.id.nav_host_fragment_activity_main)
        // Passing each menu ID as a set of Ids because each
        // menu should be considered as top level destinations.
        val appBarConfiguration = AppBarConfiguration(
            setOf(
                R.id.navigation_home, R.id.navigation_dashboard, R.id.navigation_notifications
            )
        )
        setupActionBarWithNavController(navController, appBarConfiguration)
        navView.setupWithNavController(navController)

        // Set up notification badge
        setupNotificationBadge(navView)

        // Set up hamburger menu button - do this after navigation setup
        setupHamburgerMenu()
        
        // Ensure hamburger menu persists during navigation
        navController.addOnDestinationChangedListener { _, _, _ ->
            setupHamburgerMenu()
        }

        // Handle navigation intent
        handleNavigationIntent()
    }

    private fun setupHamburgerMenu() {
        // Ensure action bar exists and enable the hamburger menu
        supportActionBar?.let { actionBar ->
            actionBar.setDisplayHomeAsUpEnabled(true)
            actionBar.setHomeAsUpIndicator(R.drawable.ic_menu_black_24dp)
            actionBar.setHomeButtonEnabled(true)
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_settings -> {
                // Handle settings icon click - show user popup
                showUserPopup()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        // Handle hamburger menu click
        showUserPopup()
        return true
    }

    fun showUserPopup() {
        if (userPopup?.isShowing == true) {
            userPopup?.dismiss()
            return
        }

        // Create popup binding
        val popupBinding = UserPopupBinding.inflate(layoutInflater)
        
        // Set up popup content
        setupUserPopupContent(popupBinding)

        // Create popup window
        userPopup = PopupWindow(
            popupBinding.root,
            ViewGroup.LayoutParams.MATCH_PARENT,
            (resources.displayMetrics.heightPixels * 0.5).toInt(), // Half screen height
            true
        )

        // Set popup properties
        userPopup?.isOutsideTouchable = true
        userPopup?.isFocusable = true
        userPopup?.elevation = 8f

        // Show popup at the top of the screen
        userPopup?.showAsDropDown(findViewById(R.id.container), 0, 0)
    }

    private fun setupUserPopupContent(binding: UserPopupBinding) {
        // Set up user profile content
        binding.textUserName.text = "Green Horizon"
        binding.textUserEmail.text = "green.horizon@greenhorizon.com"
        binding.textUserRole.text = "Green Horizon Administrator"

        // Set up menu items click listeners
        binding.menuItemSettings.setOnClickListener {
            // TODO: Navigate to user settings
            userPopup?.dismiss()
        }

        binding.menuItemHelp.setOnClickListener {
            // TODO: Show help information
            userPopup?.dismiss()
        }

        // Close button
        binding.buttonClose.setOnClickListener {
            userPopup?.dismiss()
        }
    }

    private fun setupNotificationBadge(navView: BottomNavigationView) {
        val badge = navView.getOrCreateBadge(R.id.navigation_notifications)
        
        lifecycleScope.launch {
            notificationRepository.unreadCount.collect { count ->
                if (count > 0) {
                    badge.number = count
                    badge.isVisible = true
                } else {
                    badge.isVisible = false
                }
            }
        }
    }

    private fun handleNavigationIntent() {
        val navigateTo = intent.getStringExtra("navigate_to")
        if (navigateTo == "notifications") {
            val navController = findNavController(R.id.nav_host_fragment_activity_main)
            navController.navigate(R.id.navigation_notifications)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        userPopup?.dismiss()
    }
}