
"""
environment_simulation.py

This class represents the physical world and properties related to microgrid power generation:
- Wind
    - Speed
    - Direction
- Solar Radiation
- Cloud Cover
- Season
- Time
- Temperature

"""
from datetime import datetime, timedelta
import random
import math
    
    
class Environment:
    def __init__(self):
        self.current_time: datetime = datetime.now()
        self.set_environment_values()
        
    def set_environment_values(self):
        self.cloud_cover: float = self.get_cloud_cover()
        self.wind_speed, self.wind_direction = self.get_wind()
        self.solar_radiation: float = self.get_solar_radiation()
        self.temperature: float = self.get_temperature()
 
    def step(self, timestep_hours):
        self.current_time += timedelta(hours=timestep_hours)
        self.set_environment_values()

    """Generate cloud cover based on climatic averages for the Perth region."""
    def get_cloud_cover(self) -> float:
    
        current_month = self.current_time.month
        self.months = { # Month (key) - Mean cloud cover (value)
            1: 2, # Jan
            2: 2, # Feb
            3: 3, # March
            4: 4, # April
            5: 4, # May
            6: 5.5, # June
            7: 6, # July
            8: 5.5, # August
            9: 5, # September
            10: 4.5, # October
            11: 3, # November
            12: 2 # December
        }
        return max(0, min(9, random.normalvariate(self.months[current_month], 1.5))) # 0 (clear) - 9 (sky obstructed from view) okta (unit of measurement for cloud cover) with 1.5 standard deviations from the mean
    
    """Set the current cloud cover."""
    def set_cloud_cover(self, cloud_cover: float):
        if 0 <= cloud_cover <= 9:
            self.cloud_cover = cloud_cover
        else:
            raise ValueError("Illegal cloud cover value. Use 0-9.")
        
    """Generate daily temperature based on month and hour."""
    def get_temperature(self) -> float:
        current_month = self.current_time.month
        current_hour = self.current_time.hour
        avg_min = {
            1: 18, 2: 18, 3: 16, 4: 13, 5: 10, 6: 8,
            7: 8, 8: 9, 9: 10, 10: 12, 11: 15, 12: 17
        }[current_month]
        avg_max = {
            1: 32, 2: 31, 3: 29, 4: 25, 5: 22, 6: 19,
            7: 18, 8: 19, 9: 21, 10: 24, 11: 27, 12: 30
        }[current_month]

        # Simulate day night curve using sine function
        base = (avg_min + avg_max) / 2
        amplitude = (avg_max - avg_min) / 2
        temp = base + amplitude * math.sin((current_hour - 6) / 24 * 2 * math.pi)
        return round(temp + random.normalvariate(0, 1), 1)
    
    """Set the current temperature."""
    def set_temperature(self, temperature: int):
        if -50 <= temperature <= 50:
            self.temperature = temperature
        else:
            raise ValueError("Illegal temperature value. Use -50 to 50c.")
    
    """Return solar radiation in W/m² based on time, season, and cloud cover."""
    def get_solar_radiation(self) -> float:
        current_month = self.current_time.month
        current_hour = self.current_time.hour
        current_cloud_cover = self.cloud_cover  

        # 1. Seasonal factor (solar potential by month for Perth)
        seasonal_factor = {
            1: 0.95,  2: 0.90,  3: 0.80,
            4: 0.70,  5: 0.60,  6: 0.50,
            7: 0.55,  8: 0.65,  9: 0.75,
            10: 0.85, 11: 0.90, 12: 0.95
        }.get(current_month)

        # 2. Cloud factor (0 = overcast, 1 = clear)
        cloud_factor = 1 - (current_cloud_cover / 9)

        # 3. Time-of-day factor (0 at night, 1 at solar noon)
        if current_hour < 6 or current_hour > 18:
            time_of_day_factor = 0.0
        else:
            # Sine curve from 6 AM to 6 PM
            time_of_day_factor = math.sin(math.pi * (current_hour - 6) / 12)

        # 4. Final solar radiation (in W/m²)
        base_radiation = 1000  # Max theoretical radiation
        radiation = base_radiation * seasonal_factor * cloud_factor * time_of_day_factor

        return round(radiation, 1)
    
    """Set the solar radiation."""
    def set_solar_radiation(self, solar_radiation: float):
        if 0 <= solar_radiation <= 1000:
            self.solar_radiation = solar_radiation
        else:
            raise ValueError("Illegal solar radiation value. Use 0-1000 (W/m²).")
        
    """Generate wind speed (m/s) and direction (°) based on month and hour."""
    def get_wind(self) -> tuple:
        current_month = self.current_time.month
        current_hour = self.current_time.hour

        # Base seasonal average wind speeds (approx, m/s)
        monthly_avg_speed = {
            1: 5.5,  2: 5.0,  3: 5.2,  4: 4.8,
            5: 4.5,  6: 4.0,  7: 4.2,  8: 4.8,
            9: 5.0, 10: 5.3, 11: 5.6, 12: 5.8
        }[current_month]

        # Simulate stronger winds in afternoon
        if 12 <= current_hour <= 18:
            diurnal_boost = 1.2
        else:
            diurnal_boost = 0.8

        mean_speed = monthly_avg_speed * diurnal_boost

        # Generate wind speed using normal distribution, clamp to non-negative
        wind_speed = max(0, random.normalvariate(mean_speed, 1.5))

        # Wind direction model (degrees from North, clockwise)
        if current_month in [12, 1, 2]:  # Summer — SW sea breeze
            wind_direction = random.normalvariate(230, 20)
        elif current_month in [6, 7, 8]:  # Winter — variable
            wind_direction = random.uniform(0, 360)
        else:
            wind_direction = random.normalvariate(200, 60)

        # Clamp direction to [0, 360)
        wind_direction = wind_direction % 360

        return round(wind_speed, 1), round(wind_direction)
    
    """Set the current wind speed (m/s)."""
    def set_wind_speed(self, wind_speed: float):
        if not 0 <= wind_speed <= 100:
            raise ValueError("Wind speed must be between 0 and 100 m/s.")
        self.wind_speed = wind_speed

    """Set the current wind direction (degrees)."""
    def set_wind_direction(self, wind_direction: float):
        if not (0 <= wind_direction < 360):
            raise ValueError("Wind direction must be between 0 and less than 360 degrees.")
        self.wind_direction = wind_direction