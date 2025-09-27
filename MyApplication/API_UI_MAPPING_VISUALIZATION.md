# 📱 API to UI Mapping Visualization

## 🖥️ **Current Python Dashboard Structure**

### **Header Section**
```
┌─────────────────────────────────────────────────────────────┐
│  🌐 Microgrid Environment Dashboard    [Step] [Auto] [Reset] │
└─────────────────────────────────────────────────────────────┘
```

### **Metric Cards Grid (6 cards)**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│    Time     │ │Temperature  │ │   Solar     │
│ 14:30:00    │ │   25.3°C    │ │  450.2 W/m² │
│             │ │     ↗ +2.1   │ │     ↘ -15.3  │
└─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Cloud     │ │Wind Speed   │ │Wind Direction│
│   3.2/9     │ │   5.8 m/s   │ │    230°     │
│     ↗ +0.5   │ │     ↘ -1.2  │ │     ↗ +15   │
└─────────────┘ └─────────────┘ └─────────────┘
```

### **Charts Section**
```
┌─────────────────────────────────────────────────────────────┐
│                Temperature & Solar Radiation                │
│  [Line Chart: Temp (°C) vs Solar (W/m²) over time]        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Wind Conditions                         │
│  [Line Chart: Wind Speed (m/s) vs Wind Direction (°)]     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Cloud Cover & Solar Radiation                │
│  [Line Chart: Cloud Cover (/9) vs Solar (W/m²)]          │
└─────────────────────────────────────────────────────────────┘
```

### **Control Panel**
```
┌─────────────────────────────────────────────────────────────┐
│                Environment Controls                        │
│ Temperature: [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] 25°C │
│ Solar:       [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] 500W │
│ Cloud:       [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] 4.5/9│
│ Wind Speed:  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] 5m/s │
│ Wind Dir:    [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] 180° │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 **Enhanced Android App UI Structure**

### **Header Section**
```
┌─────────────────────────────────────────────────────────────┐
│  📱 Microgrid Monitor        [Step] [Auto] [Settings] [📡]  │
│  🕐 2025-01-15T14:30:00                                     │
└─────────────────────────────────────────────────────────────┘
```

### **Enhanced Metric Cards Grid (10 cards)**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Temperature  │ │   Solar     │ │Wind Speed   │ │Wind Direction│
│   25.3°C    │ │  450.2 W/m² │ │   5.8 m/s   │ │    230°     │
│     ↗ +2.1   │ │     ↘ -15.3  │ │     ↘ -1.2  │ │     ↗ +15   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Battery SOC  │ │Battery Power│ │Grid Power   │ │Total Gen    │
│  12.5 kWh   │ │   2.3 kW    │ │   1.2 kW    │ │   4.5 kW    │
│     ↗ +0.8   │ │     ↘ -0.5  │ │     ↗ +0.3  │ │     ↗ +1.2  │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐
│Device Count │ │   Status    │
│   3 devices │ │ Connected   │
│     Static   │ │     🟢     │
└─────────────┘ └─────────────┘
```

### **Enhanced Charts Section**
```
┌─────────────────────────────────────────────────────────────┐
│                Power Generation Overview                   │
│  [Line Chart: Total Gen (kW) vs Battery Power (kW)]       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                Battery & Grid Status                       │
│  [Line Chart: Battery SOC (kWh) vs Grid Power (kW)]        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Environmental Conditions                       │
│  [Line Chart: Temperature (°C) vs Solar (W/m²)]          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Wind Conditions                         │
│  [Line Chart: Wind Speed (m/s) vs Wind Direction (°)]     │
└─────────────────────────────────────────────────────────────┘
```

### **Enhanced History Table**
```
┌─────────────────────────────────────────────────────────────┐
│ Time        │ Temp │ Solar │ Wind │ SOC  │ Bat │ Grid │ Gen │
├─────────────────────────────────────────────────────────────┤
│ 14:30:00    │ 25.3 │ 450.2 │ 5.8  │ 12.5 │ 2.3 │ 1.2  │ 4.5 │
│ 14:29:00    │ 25.1 │ 465.5 │ 7.0  │ 12.3 │ 2.8 │ 0.8  │ 5.1 │
│ 14:28:00    │ 24.8 │ 480.1 │ 6.5  │ 12.0 │ 3.1 │ 0.5  │ 5.4 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 **API Field to UI Element Mapping**

### **Primary API Endpoint: GET /microgrid**

| **API Field** | **UI Element** | **Display Format** | **Card Color** |
|---------------|----------------|-------------------|----------------|
| `timestamp` | Header Time | "2025-01-15T14:30:00" | - |
| `environment.temperature` | Card 1 | "25.3°C" | Blue |
| `environment.solar_radiation` | Card 2 | "450.2 W/m²" | Orange |
| `environment.wind_speed` | Card 3 | "5.8 m/s" | Cyan |
| `environment.wind_direction` | Card 4 | "230°" | Purple |
| `battery.state_of_charge` | Card 5 | "12.5 kWh" | Green |
| `battery.current_power` | Card 6 | "2.3 kW" | Green |
| `grid.current_power` | Card 7 | "1.2 kW" | Yellow |
| `total_generation` | Card 8 | "4.5 kW" | Teal |
| `device_count` | Card 9 | "3 devices" | Indigo |
| Connection Status | Card 10 | "Connected" | Green/Red |

### **Chart Data Sources**

| **Chart** | **Data Source** | **Y-Axis 1** | **Y-Axis 2** |
|-----------|-----------------|--------------|--------------|
| Power Generation | Historical `total_generation` | Total Gen (kW) | Battery Power (kW) |
| Battery & Grid | Historical `battery.state_of_charge` | Battery SOC (kWh) | Grid Power (kW) |
| Environmental | Historical `environment.temperature` | Temperature (°C) | Solar (W/m²) |
| Wind | Historical `environment.wind_speed` | Wind Speed (m/s) | Wind Direction (°) |

### **History Table Columns**

| **Column** | **API Field** | **Format** |
|------------|---------------|------------|
| Time | `timestamp` | "14:30:00" |
| Temp | `environment.temperature` | "25.3°C" |
| Solar | `environment.solar_radiation` | "450.2 W/m²" |
| Wind | `environment.wind_speed` | "5.8 m/s" |
| SOC | `battery.state_of_charge` | "12.5 kWh" |
| Bat | `battery.current_power` | "2.3 kW" |
| Grid | `grid.current_power` | "1.2 kW" |
| Gen | `total_generation` | "4.5 kW" |

---

## 🔔 **Notification Triggers**

| **Condition** | **API Field** | **Threshold** | **Message** |
|---------------|---------------|---------------|-------------|
| Low Battery | `battery.state_of_charge` | < 20% capacity | "Low battery: 3.0 kWh remaining" |
| High Battery | `battery.state_of_charge` | > 90% capacity | "Battery nearly full: 13.5 kWh" |
| High Import | `grid.current_power` | > 5 kW | "High grid import: 6.2 kW" |
| Exporting | `grid.current_power` | < 0 kW | "Exporting to grid: -2.1 kW" |
| High Generation | `total_generation` | > 8 kW | "High generation: 9.3 kW" |
| Low Generation | `total_generation` | < 1 kW | "Low generation: 0.5 kW" |
| High Solar | `environment.solar_radiation` | > 800 W/m² | "Optimal solar: 850 W/m²" |
| Low Solar | `environment.solar_radiation` | < 100 W/m² | "Low solar: 75 W/m²" |
| High Wind | `environment.wind_speed` | > 8 m/s | "Strong winds: 9.2 m/s" |
| Low Wind | `environment.wind_speed` | < 2 m/s | "Low wind: 1.5 m/s" |

---

## 📊 **Data Flow Visualization**

```
┌─────────────────┐    GET /microgrid    ┌─────────────────┐
│   Python API    │ ──────────────────→ │  Android App    │
│   (FastAPI)     │                      │                 │
└─────────────────┘                      └─────────────────┘
         │                                         │
         │ JSON Response                           │ Parse & Display
         │                                         │
         ▼                                         ▼
┌─────────────────┐                      ┌─────────────────┐
│   JSON Data     │                      │   UI Elements   │
│                 │                      │                 │
│ • timestamp      │                      │ • Header Time   │
│ • environment    │                      │ • Metric Cards  │
│ • devices        │                      │ • Charts        │
│ • battery        │                      │ • History Table │
│ • grid           │                      │ • Notifications │
│ • total_gen      │                      │                 │
│ • device_count   │                      │                 │
└─────────────────┘                      └─────────────────┘
```

---

## 🎨 **Visual Design Elements**

### **Card Design Pattern**
```
┌─────────────────────────┐
│ 🌡️ Temperature          │ ← Icon + Title
│                         │
│        25.3°C           │ ← Large Value
│                         │
│        ↗ +2.1°C         │ ← Trend Indicator
└─────────────────────────┘
```

### **Chart Design Pattern**
```
┌─────────────────────────────────────────┐
│        Power Generation Overview        │ ← Chart Title
│                                         │
│  kW                                     │
│  5 ┤                                    │
│  4 ┤     ●                              │
│  3 ┤   ●   ●                            │
│  2 ┤ ●       ●                          │
│  1 ┤           ●                        │
│  0 └────────────────────────────────────│ ← Time Axis
│    10:00 11:00 12:00 13:00 14:00 15:00  │
└─────────────────────────────────────────┘
```

This visualization shows exactly how each API field maps to specific UI elements in the Android app, providing a clear roadmap for implementation!
