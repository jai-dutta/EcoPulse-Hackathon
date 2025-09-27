# Microgrid Android App Specification

## 📱 **Android App UI Elements & API Mapping**

### **🏠 Home Screen (Welcome & Quick Actions)**

#### **1. Welcome Section**
- **App Title:** "Welcome to Microgrid Monitor"
- **Subtitle:** "Your central hub for managing microgrid systems"
- **Icon:** 🏠 (large home icon)
- **Purpose:** Branding and user orientation

#### **2. Quick Action Cards (2x2 Grid)**

**Card 1: Dashboard**
- **Icon:** 📊
- **Label:** "Dashboard"
- **Action:** Navigate to Dashboard tab
- **Color:** Primary blue
- **Purpose:** Access real-time microgrid monitoring

**Card 2: Grids**
- **Icon:** 🔌
- **Label:** "Grids"
- **Action:** Navigate to Grids listing (future feature)
- **Color:** Grid-themed color
- **Purpose:** Manage multiple microgrid systems

**Card 3: Devices**
- **Icon:** 🔧
- **Label:** "Devices"
- **Action:** Navigate to Devices listing (future feature)
- **Color:** Device-themed color
- **Purpose:** Monitor individual devices

**Card 4: Settings**
- **Icon:** ⚙️
- **Label:** "Settings"
- **Action:** Navigate to User Settings (future feature)
- **Color:** Settings-themed color
- **Purpose:** Configure app preferences

#### **3. Coming Soon Section**
- **Title:** "More Features Coming Soon!"
- **Description:** "Grid management, device monitoring, and advanced analytics"
- **Icon:** 🚀
- **Color:** Success green
- **Purpose:** Set user expectations for future features

### **📊 Dashboard Screen (Main Microgrid Monitoring)**

#### **1. Header Section**
- **Current Time Display**
  - **API:** `GET /microgrid` → `timestamp` field
  - **Format:** "2025-01-15T14:30:00" (ISO format)
  - **Update:** Real-time

#### **2. Primary Metric Cards (8 cards in 2x4 grid)**

**Card 1: Temperature**
- **Display:** Large number + unit
- **API:** `GET /microgrid` → `environment.temperature` field
- **Format:** "25.3°C"
- **Trend:** Up/Down arrow with change value
- **Color:** Blue gradient
- **Icon:** 🌡️

**Card 2: Solar Radiation**
- **Display:** Large number + unit
- **API:** `GET /microgrid` → `environment.solar_radiation` field
- **Format:** "450.2 W/m²"
- **Trend:** Up/Down arrow with change value
- **Color:** Orange gradient
- **Icon:** ☀️

**Card 3: Wind Speed**
- **Display:** Large number + unit
- **API:** `GET /microgrid` → `environment.wind_speed` field
- **Format:** "5.8 m/s"
- **Trend:** Up/Down arrow with change value
- **Color:** Cyan gradient
- **Icon:** 💨

**Card 4: Wind Direction**
- **Display:** Large number + unit
- **API:** `GET /microgrid` → `environment.wind_direction` field
- **Format:** "230°"
- **Trend:** Up/Down arrow with change value
- **Color:** Purple gradient
- **Icon:** 🧭

**Card 5: Battery State of Charge**
- **Display:** Large number + unit
- **API:** `GET /microgrid` → `battery.state_of_charge` field
- **Format:** "12.5 kWh"
- **Trend:** Up/Down arrow with change value
- **Color:** Green gradient
- **Icon:** 🔋

**Card 6: Battery Current Power**
- **Display:** Large number + unit
- **API:** `GET /microgrid` → `battery.current_power` field
- **Format:** "2.3 kW"
- **Trend:** Up/Down arrow with change value
- **Color:** Green gradient
- **Icon:** ⚡

**Card 7: Grid Power Flow**
- **Display:** Large number + unit
- **API:** `GET /microgrid` → `grid.current_power` field
- **Format:** "1.2 kW" (positive=import, negative=export)
- **Trend:** Up/Down arrow with change value
- **Color:** Yellow gradient
- **Icon:** 🔌

**Card 8: Total Generation**
- **Display:** Large number + unit
- **API:** `GET /microgrid` → `total_generation` field
- **Format:** "4.5 kW"
- **Trend:** Up/Down arrow with change value
- **Color:** Teal gradient
- **Icon:** 🌱

#### **3. Device Count Card**
- **Display:** Large number + unit
- **API:** `GET /microgrid` → `device_count` field
- **Format:** "3 devices"
- **Color:** Device-themed color
- **Icon:** 🔧
- **Layout:** Full-width horizontal card

#### **4. Connection Status**
- **Display:** Connection status in header
- **API:** `GET /microgrid` (health check)
- **Format:** "🟢 Connected" / "🔴 Disconnected"
- **Color:** Green/Red
- **Location:** Header section

#### **5. Refresh Button**
- **Action:** Manual data refresh
- **API:** `GET /microgrid`
- **Text:** "🔄 Refresh Data"
- **Style:** Full-width Material button
- **Color:** Primary theme

#### **6. Control Panel Section (Future Feature)**

**Simulation Controls:**
- **Step Forward Button**
  - **API:** `POST /step?timestep_hours={value}`
  - **Action:** Advance simulation by X hours
  - **Input:** Timestep value (0.1-24 hours)

- **Reset Button**
  - **API:** `POST /reset`
  - **Action:** Reset environment to initial state
  - **Confirmation:** Dialog required

- **Auto-Step Toggle**
  - **API:** `POST /step` (repeated calls)
  - **Action:** Automatically step forward
  - **Settings:** Interval (1-60 seconds)

**Environment Controls:**
- **Temperature Slider**
  - **API:** `POST /environment/temperature?temperature={value}`
  - **Range:** -50 to 50°C
  - **Current Value:** From `GET /environment`

- **Solar Radiation Slider**
  - **API:** `POST /environment/solar_radiation?solar_radiation={value}`
  - **Range:** 0 to 1000 W/m²
  - **Current Value:** From `GET /environment`

- **Cloud Cover Slider**
  - **API:** `POST /environment/cloud_cover?cloud_cover={value}`
  - **Range:** 0 to 9
  - **Current Value:** From `GET /environment`

- **Wind Speed Slider**
  - **API:** `POST /environment/wind_speed?wind_speed={value}`
  - **Range:** 0 to 100 m/s
  - **Current Value:** From `GET /environment`

- **Wind Direction Slider**
  - **API:** `POST /environment/wind_direction?wind_direction={value}`
  - **Range:** 0 to 359°
  - **Current Value:** From `GET /environment`

#### **7. Charts & Graphs Section (Future Feature)**

**Chart 1: Power Generation Overview**
- **Data Source:** Historical data from `GET /microgrid` calls
- **X-Axis:** Time (last 24 hours)
- **Y-Axis:** Total Generation (kW) and Battery Power (kW)
- **Type:** Dual-axis line chart

**Chart 2: Battery & Grid Status**
- **Data Source:** Historical data from `GET /microgrid` calls
- **X-Axis:** Time (last 24 hours)
- **Y-Axis:** Battery SOC (kWh) and Grid Power (kW)
- **Type:** Dual-axis line chart

**Chart 3: Environmental Conditions**
- **Data Source:** Historical data from `GET /microgrid` calls
- **X-Axis:** Time (last 24 hours)
- **Y-Axis:** Temperature (°C) and Solar Radiation (W/m²)
- **Type:** Dual-axis line chart

**Chart 4: Wind Conditions**
- **Data Source:** Historical data from `GET /microgrid` calls
- **X-Axis:** Time (last 24 hours)
- **Y-Axis:** Wind Speed (m/s) and Wind Direction (°)
- **Type:** Dual-axis line chart

#### **8. History Table (Future Feature)**
- **Data Source:** Historical data from `GET /microgrid` calls
- **Columns:**
  - Time
  - Temperature (°C)
  - Solar (W/m²)
  - Wind (m/s)
  - Battery SOC (kWh)
  - Battery Power (kW)
  - Grid Power (kW)
  - Total Gen (kW)
- **Rows:** Last 10-20 entries
- **Update:** Real-time

### **🔔 Notifications Screen (Future Feature)**

#### **Smart Notifications Based on API Data:**

**Battery Notifications:**
- **Low Battery Alert:** `battery.state_of_charge < 20%` of capacity
  - **Message:** "Low battery: {value} kWh remaining"
- **High Battery Alert:** `battery.state_of_charge > 90%` of capacity
  - **Message:** "Battery nearly full: {value} kWh"

**Grid Notifications:**
- **High Import Alert:** `grid.current_power > 5` kW
  - **Message:** "High grid import: {value} kW"
- **Export Alert:** `grid.current_power < 0` kW
  - **Message:** "Exporting to grid: {value} kW"

**Generation Notifications:**
- **High Generation Alert:** `total_generation > 8` kW
  - **Message:** "High generation: {value} kW"
- **Low Generation Alert:** `total_generation < 1` kW
  - **Message:** "Low generation: {value} kW"

**Temperature Notifications:**
- **High Temp:** `temperature > 35`
  - **Message:** "High temperature: {value}°C"
- **Low Temp:** `temperature < 5`
  - **Message:** "Low temperature: {value}°C"

**Solar Power Notifications:**
- **High Solar Alert:** `environment.solar_radiation > 800`
  - **Message:** "Optimal solar conditions: {value} W/m²"
- **Low Solar Alert:** `environment.solar_radiation < 100`
  - **Message:** "Low solar output: {value} W/m²"

**Wind Power Notifications:**
- **High Wind Alert:** `environment.wind_speed > 8`
  - **Message:** "Strong winds detected: {value} m/s"
- **Low Wind Alert:** `environment.wind_speed < 2`
  - **Message:** "Low wind conditions: {value} m/s"

**System Notifications:**
- **API Connection Lost:** Network error
  - **Message:** "Connection lost to microgrid API"
- **API Connection Restored:** After reconnection
  - **Message:** "Connection restored to microgrid API"
- **Simulation Step:** After `POST /step`
  - **Message:** "Simulation advanced by {timestep} hours"
- **Environment Reset:** After `POST /reset`
  - **Message:** "Environment reset to initial state"

### **⚙️ Settings Screen (Future Feature)**

**API Configuration:**
- **Base URL:** `http://localhost:8000` (editable)
- **Update Interval:** 5-60 seconds (slider)
- **Auto-step Interval:** 1-60 seconds (slider)

**Notification Preferences:**
- **Enable/Disable:** Each notification type
- **Thresholds:** Custom values for alerts
- **Sound/Vibration:** Per notification type

**Display Preferences:**
- **Theme:** Light/Dark mode
- **Units:** Metric/Imperial
- **Chart Time Range:** 6/12/24 hours
- **History Table Size:** 10/20/50 entries

## 📊 **Data Models for Android App**

### **Microgrid Data Model:**
```kotlin
data class MicrogridData(
    val timestamp: String,      // "2025-01-15T14:30:00"
    val environment: EnvironmentData,
    val devices: List<DeviceState>,
    val battery: BatteryData,
    val grid: GridData,
    val totalGeneration: Double,
    val deviceCount: Int
)

data class EnvironmentData(
    val temperature: Double,    // 25.3
    val windSpeed: Double,       // 5.8
    val windDirection: Double,  // 230
    val solarRadiation: Double   // 450.2
)

data class DeviceState(
    val name: String,
    val powerOutput: Double
)

data class BatteryData(
    val name: String,
    val capacityKwh: Double,
    val maxPowerKw: Double,
    val stateOfCharge: Double,
    val currentPower: Double
)

data class GridData(
    val name: String,
    val importPrice: Double,
    val exportPrice: Double,
    val currentPower: Double
)
```

### **Historical Data Model:**
```kotlin
data class HistoricalData(
    val timestamp: Long,        // System timestamp
    val microgridData: MicrogridData
)
```

### **Notification Model:**
```kotlin
data class MicrogridNotification(
    val id: String,
    val type: NotificationType,
    val title: String,
    val message: String,
    val timestamp: Long,
    val isRead: Boolean
)

enum class NotificationType {
    BATTERY_LOW, BATTERY_HIGH,
    GRID_HIGH_IMPORT, GRID_EXPORT,
    GENERATION_HIGH, GENERATION_LOW,
    SOLAR_HIGH, SOLAR_LOW,
    WIND_HIGH, WIND_LOW,
    TEMP_HIGH, TEMP_LOW,
    SYSTEM_CONNECTION, SYSTEM_STEP, SYSTEM_RESET
}
```

### **API Response Models:**
```kotlin
data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: String?
)

data class MicrogridResponse(
    val timestamp: String,
    val environment: EnvironmentResponse,
    val devices: List<DeviceResponse>,
    val battery: BatteryResponse,
    val grid: GridResponse,
    val total_generation: Double,
    val device_count: Int
)

data class EnvironmentResponse(
    val temperature: Double,
    val wind_speed: Double,
    val wind_direction: Double,
    val solar_radiation: Double
)

data class DeviceResponse(
    val name: String,
    val power_output: Double
)

data class BatteryResponse(
    val name: String,
    val capacity_kwh: Double,
    val max_power_kw: Double,
    val state_of_charge: Double,
    val current_power: Double
)

data class GridResponse(
    val name: String,
    val import_price: Double,
    val export_price: Double,
    val current_power: Double
)
```

## 🏗️ **Android App Architecture**

### **Package Structure:**
```
com.example.myapplication/
├── ui/
│   ├── MainActivity.kt
│   ├── home/
│   │   ├── HomeFragment.kt
│   │   └── HomeViewModel.kt
│   ├── dashboard/
│   │   ├── DashboardFragment.kt
│   │   └── DashboardViewModel.kt
│   ├── notifications/
│   │   ├── NotificationsFragment.kt (future)
│   │   └── NotificationsViewModel.kt (future)
│   └── settings/
│       ├── UserSettingsFragment.kt (future)
│       └── UserSettingsViewModel.kt (future)
├── data/
│   ├── api/
│   │   ├── MicrogridApiService.kt
│   │   └── ApiClient.kt
│   ├── repository/
│   │   └── MicrogridRepository.kt
│   └── local/
│       ├── database/
│       │   ├── MicrogridDatabase.kt
│       │   └── entities/
│       └── preferences/
│           └── AppPreferences.kt
├── domain/
│   ├── models/
│   │   ├── EnvironmentData.kt
│   │   ├── HistoricalData.kt
│   │   └── MicrogridNotification.kt
│   └── usecases/
│       ├── GetEnvironmentData.kt
│       ├── UpdateEnvironment.kt
│       └── ManageNotifications.kt
├── service/
│   ├── MicrogridService.kt
│   └── NotificationService.kt
└── utils/
    ├── Constants.kt
    ├── Extensions.kt
    └── ChartUtils.kt
```

### **Key Components:**

**1. MainActivity**
- **Purpose:** Main app container with bottom navigation
- **Features:** Bottom navigation, toolbar, status bar

**2. HomeFragment**
- **Purpose:** Welcome screen with quick actions
- **Features:** App branding, navigation cards, coming soon section

**3. DashboardFragment**
- **Purpose:** Primary microgrid data display
- **Features:** Metric cards, real-time updates, refresh button

**4. MicrogridApiService**
- **Purpose:** API communication
- **Features:** Retrofit service, error handling, response mapping

**5. MicrogridRepository**
- **Purpose:** Data management
- **Features:** API calls, local caching, data transformation

**6. MicrogridService**
- **Purpose:** Background data fetching
- **Features:** Periodic updates, notification triggers

**7. NotificationService**
- **Purpose:** Smart notifications
- **Features:** Threshold monitoring, user preferences

## 🔌 **API Endpoints Summary**

### **Primary Endpoints:**
- **`GET /microgrid`** - Get complete microgrid state (environment, devices, battery, grid)
- **`POST /step`** - Advance simulation by timestep
- **`POST /reset`** - Reset environment to initial state

### **Environment Control Endpoints:**
- **`POST /environment/temperature`** - Set temperature (-50 to 50°C)
- **`POST /environment/solar_radiation`** - Set solar radiation (0-1000 W/m²)
- **`POST /environment/cloud_cover`** - Set cloud cover (0-9)
- **`POST /environment/wind_speed`** - Set wind speed (0-100 m/s)
- **`POST /environment/wind_direction`** - Set wind direction (0-359°)

### **API Base Configuration:**
- **Base URL:** `http://localhost:8000`
- **Update Frequency:** Every 5-30 seconds
- **Data Format:** JSON
- **CORS:** Enabled for all origins

## 📋 **Implementation Checklist**

### **Phase 1: Core Setup ✅ COMPLETED**
- [x] Create Android project structure
- [x] Set up Retrofit for API communication
- [x] Implement data models
- [x] Create basic UI layout

### **Phase 2: Dashboard Implementation ✅ COMPLETED**
- [x] Implement metric cards
- [x] Add real-time data updates
- [x] Create refresh functionality
- [x] Implement home page with quick actions

### **Phase 3: Advanced Features (Future)**
- [ ] Add notification system
- [ ] Implement settings screen
- [ ] Add historical data storage
- [ ] Create background service
- [ ] Add control panel
- [ ] Implement charts

### **Phase 4: Polish & Testing (Future)**
- [ ] Add error handling
- [ ] Implement offline support
- [ ] Add unit tests
- [ ] Performance optimization

## 🎯 **Key Features Summary**

### **✅ Current Features (Implemented):**
- **Home Screen:** Welcome page with quick action cards
- **Dashboard Screen:** Real-time microgrid data display
- **Live Monitoring:** Environment, battery, grid, and device data
- **Connection Status:** Real-time API connection monitoring
- **Manual Refresh:** User-triggered data updates
- **Modern UI:** Material Design with card-based layout
- **Navigation:** Bottom navigation between screens

### **🚀 Future Features (Planned):**
- **Smart Notifications:** Battery, grid, and generation alerts
- **Interactive Controls:** Environment parameter adjustment
- **Data Visualization:** Charts and graphs for historical data
- **Settings Screen:** API configuration and preferences
- **Background Service:** Automatic data updates
- **Offline Support:** Local data caching
- **Advanced Analytics:** Historical data analysis

## 📡 **Complete API Response Structure**

### **GET /microgrid Response:**
```json
{
  "timestamp": "2025-01-15T14:30:00",
  "environment": {
    "temperature": 25.3,
    "wind_speed": 5.8,
    "wind_direction": 230,
    "solar_radiation": 450.2
  },
  "devices": [
    {
      "name": "Solar Panel",
      "power_output": 2.7
    },
    {
      "name": "Wind Turbine",
      "power_output": 1.8
    }
  ],
  "battery": {
    "name": "Battery",
    "capacity_kwh": 15.0,
    "max_power_kw": 3.5,
    "state_of_charge": 12.5,
    "current_power": 2.3
  },
  "grid": {
    "name": "Grid",
    "import_price": 0.40,
    "export_price": 0.08,
    "current_power": 1.2
  },
  "total_generation": 4.5,
  "device_count": 2
}
```

### **API Field Mappings:**
- **timestamp** → Current simulation time (ISO format)
- **environment.temperature** → Temperature in °C
- **environment.wind_speed** → Wind speed in m/s
- **environment.wind_direction** → Wind direction in degrees (0-359)
- **environment.solar_radiation** → Solar radiation in W/m²
- **devices[].name** → Device name
- **devices[].power_output** → Current power output in kW
- **battery.capacity_kwh** → Total battery capacity in kWh
- **battery.max_power_kw** → Maximum charge/discharge power in kW
- **battery.state_of_charge** → Current charge level in kWh
- **battery.current_power** → Current power flow in kW (positive=discharge, negative=charge)
- **grid.import_price** → Price to buy from grid ($/kWh)
- **grid.export_price** → Price to sell to grid ($/kWh)
- **grid.current_power** → Current grid power flow in kW (positive=import, negative=export)
- **total_generation** → Total power generation from all devices in kW
- **device_count** → Number of power generation devices

---

## 📱 **Current App Structure**

### **Navigation Flow:**
```
🏠 Home Screen
├── 📊 Dashboard (Real-time monitoring)
├── 🔔 Notifications (Future)
└── ⚙️ Settings (Future)
```

### **Screen Descriptions:**

**🏠 Home Screen:**
- Welcome message and app branding
- Quick action cards for navigation
- "Coming Soon" section for future features
- Clean, modern design with Material cards

**📊 Dashboard Screen:**
- Real-time microgrid data display
- 8 metric cards in 2x4 grid layout
- Connection status indicator
- Manual refresh button
- Device count summary card

**🔔 Notifications Screen (Future):**
- Smart alerts based on API data
- Battery, grid, and generation notifications
- Environmental condition alerts
- System status notifications

**⚙️ Settings Screen (Future):**
- API configuration
- Notification preferences
- Display settings
- Update intervals

---

**✅ Phase 1 & 2 Complete!** The core microgrid monitoring app is now functional with a clean home screen and comprehensive dashboard. Ready for Phase 3 advanced features!
