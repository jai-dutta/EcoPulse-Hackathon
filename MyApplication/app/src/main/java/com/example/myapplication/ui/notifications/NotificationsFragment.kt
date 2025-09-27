package com.example.myapplication.ui.notifications

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.unit.dp
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import com.example.myapplication.data.model.Alert
import com.example.myapplication.data.model.AlertType
import com.example.myapplication.ui.notifications.components.*

class NotificationsFragment : Fragment() {

    private val viewModel: NotificationsViewModel by viewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ComposeView(requireContext()).apply {
            setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
            setContent {
                MaterialTheme {
                    NotificationsScreen(
                        viewModel = viewModel,
                        onAction = { alert, action ->
                            handleAction(alert, action)
                        }
                    )
                }
            }
        }
    }

    private fun handleAction(alert: Alert, action: String) {
        when (action) {
            "Acknowledge" -> viewModel.acknowledgeAlert(alert.id)
            "Dismiss" -> viewModel.removeAlert(alert.id)
            "Retry" -> {
                // Handle retry logic
                viewModel.addTestAlert() // For demo purposes
            }
            "Open Dashboard" -> {
                // Navigate to dashboard
            }
            "Switch to Island Mode" -> {
                // Handle island mode switch
            }
            "View SOP" -> {
                // Handle SOP viewing
            }
            "Open Weather" -> {
                // Handle weather app opening
            }
            "Prep Checklist" -> {
                // Handle preparation checklist
            }
            "Pre-charge Battery" -> {
                // Handle battery pre-charging
            }
            "Schedule Load Shift" -> {
                // Handle load shifting
            }
            "Start Backup" -> {
                // Handle backup start
            }
            "Start Generator" -> {
                // Handle generator start
            }
            "Shed Load" -> {
                // Handle load shedding
            }
            "View Schedule" -> {
                // Handle schedule viewing
            }
            "Plan Load Shift" -> {
                // Handle load shift planning
            }
            "Open Device" -> {
                // Handle device opening
            }
            "Investigate Loads" -> {
                // Handle load investigation
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    viewModel: NotificationsViewModel,
    onAction: (Alert, String) -> Unit
) {
    val alerts by viewModel.alerts.collectAsState()
    val unreadCount by viewModel.unreadCount.collectAsState()
    val context = LocalContext.current
    
    var selectedFilter by remember { mutableStateOf(AlertFilter.All) }
    
    val filteredAlerts = when (selectedFilter) {
        AlertFilter.All -> alerts
        AlertFilter.Unread -> alerts.filter { !it.acknowledged }
        AlertFilter.Critical -> alerts.filter { it.type is AlertType.Error }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notifications") },
                navigationIcon = {
                    IconButton(
                        onClick = { 
                            // Handle hamburger menu click - show user popup
                            (context as com.example.myapplication.MainActivity).showUserPopup()
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Menu,
                            contentDescription = "Menu"
                        )
                    }
                },
                actions = {
                    IconButton(
                        onClick = { viewModel.addTestAlert() }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Add Test Alert"
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            NotificationFilter(
                selectedFilter = selectedFilter,
                onFilterChanged = { selectedFilter = it },
                unreadCount = unreadCount,
                modifier = Modifier.padding(16.dp)
            )
            
            NotificationList(
                alerts = filteredAlerts,
                onAction = onAction,
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}