package com.example.myapplication.ui.notifications.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.myapplication.data.model.Alert
import com.example.myapplication.data.model.AlertType
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
fun AlertCard(
    alert: Alert,
    onAction: (Alert, String) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = when (alert.type) {
                is AlertType.Error -> Color(0xFFFFCDD2)
                is AlertType.Warning -> Color(0xFFFFF59D)
                is AlertType.Info -> Color(0xFFBBDEFB)
            }
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header with icon, title, and timestamp
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    val icon = getAlertIcon(alert.type)
                    if (icon != null) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = getAlertIconColor(alert.type),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    } else {
                        // For Error type, show text instead of icon
                        Text(
                            text = "ERROR",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = getAlertIconColor(alert.type),
                            modifier = Modifier.padding(end = 8.dp)
                        )
                    }
                    Text(
                        text = alert.shortCut,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = getAlertTextColor(alert.type),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                }
                
                Column(
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = alert.timestamp.atZone(ZoneId.systemDefault())
                            .format(DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT)),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (alert.acknowledged) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = "Acknowledged",
                                tint = Color(0xFF4CAF50),
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Acknowledged",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF4CAF50)
                            )
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Reason text
            Text(
                text = alert.reason,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface,
                lineHeight = MaterialTheme.typography.bodyMedium.lineHeight * 1.2
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                alert.actions.forEach { action ->
                    OutlinedButton(
                        onClick = { onAction(alert, action) },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = getAlertTextColor(alert.type)
                        )
                    ) {
                        Text(
                            text = action,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun getAlertIcon(type: AlertType): ImageVector? {
    return when (type) {
        is AlertType.Error -> null // No icon for Error, will use text instead
        is AlertType.Warning -> Icons.Default.Warning
        is AlertType.Info -> Icons.Default.Info
    }
}

@Composable
private fun getAlertIconColor(type: AlertType): Color {
    return when (type) {
        is AlertType.Error -> Color(0xFFD32F2F)
        is AlertType.Warning -> Color(0xFFF57C00)
        is AlertType.Info -> Color(0xFF1976D2)
    }
}

@Composable
private fun getAlertTextColor(type: AlertType): Color {
    return when (type) {
        is AlertType.Error -> Color(0xFFD32F2F)
        is AlertType.Warning -> Color(0xFFF57C00)
        is AlertType.Info -> Color(0xFF1976D2)
    }
}
