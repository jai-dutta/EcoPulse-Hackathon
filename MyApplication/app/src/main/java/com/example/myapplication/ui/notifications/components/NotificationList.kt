package com.example.myapplication.ui.notifications.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.myapplication.data.model.Alert
import com.example.myapplication.data.model.AlertType

@Composable
fun NotificationList(
    alerts: List<Alert>,
    onAction: (Alert, String) -> Unit,
    modifier: Modifier = Modifier
) {
    if (alerts.isEmpty()) {
        EmptyState(modifier = modifier)
    } else {
        LazyColumn(
            modifier = modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Group alerts by type
            val groupedAlerts = alerts.groupBy { it.type }
            
            // Error alerts
            groupedAlerts[AlertType.Error]?.let { errorAlerts ->
                if (errorAlerts.isNotEmpty()) {
                    stickyHeader {
                        SectionHeader(
                            title = "Critical Alerts",
                            count = errorAlerts.size,
                            icon = Icons.Default.Clear,
                            color = Color(0xFFD32F2F)
                        )
                    }
                    items(errorAlerts) { alert ->
                        AlertCard(alert = alert, onAction = onAction)
                    }
                }
            }
            
            // Warning alerts
            groupedAlerts[AlertType.Warning]?.let { warningAlerts ->
                if (warningAlerts.isNotEmpty()) {
                    stickyHeader {
                        SectionHeader(
                            title = "Warnings",
                            count = warningAlerts.size,
                            icon = Icons.Default.Warning,
                            color = Color(0xFFF57C00)
                        )
                    }
                    items(warningAlerts) { alert ->
                        AlertCard(alert = alert, onAction = onAction)
                    }
                }
            }
            
            // Info alerts
            groupedAlerts[AlertType.Info]?.let { infoAlerts ->
                if (infoAlerts.isNotEmpty()) {
                    stickyHeader {
                        SectionHeader(
                            title = "Information",
                            count = infoAlerts.size,
                            icon = Icons.Default.Info,
                            color = Color(0xFF1976D2)
                        )
                    }
                    items(infoAlerts) { alert ->
                        AlertCard(alert = alert, onAction = onAction)
                    }
                }
            }
            
            // Transparent block at the end to allow scrolling past navigation bar
            item {
                Spacer(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp) // Larger spacing for better scrolling experience
                )
            }
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    count: Int,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Spacer(modifier = Modifier.width(8.dp))
            Surface(
                shape = MaterialTheme.shapes.small,
                color = color.copy(alpha = 0.1f)
            ) {
                Text(
                    text = count.toString(),
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.Bold,
                    color = color,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

@Composable
private fun EmptyState(
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.Info,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No notifications",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "You're all caught up! Check back later for updates.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
