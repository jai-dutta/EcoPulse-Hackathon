"""
environment_simulation.py

This class represents the physical world and properties related to microgrid power generation.
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
        self.temperature: float = self.get_temperature()
        self.solar_radiation: float = self.get_solar_radiation()


    def step(self, timestep_hours):
        self.current_time += timedelta(hours=timestep_hours)
        self.set_environment_values()

    def get_cloud_cover(self) -> float:
        current_month = self.current_time.month
        months = {
            1: 0, 2: 1, 3: 3, 4: 4, 5: 4, 6: 5.5,
            7: 6, 8: 4.5, 9: 3, 10: 2, 11: 0, 12: 0
        }
        return max(0, min(9, random.normalvariate(months[current_month], 0.8)))

    def set_cloud_cover(self, cloud_cover: float):
        if 0 <= cloud_cover <= 9:
            self.cloud_cover = cloud_cover
        else:
            raise ValueError("Illegal cloud cover value. Use 0-9.")

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

        base = (avg_min + avg_max) / 2
        amplitude = (avg_max - avg_min) / 2
        temp = base + amplitude * math.sin((current_hour - 6) / 24 * 2 * math.pi)
        return round(temp + random.normalvariate(0, 1), 1)

    def set_temperature(self, temperature: int):
        if -50 <= temperature <= 50:
            self.temperature = temperature
        else:
            raise ValueError("Illegal temperature value. Use -50 to 50c.")

    def get_solar_radiation(self) -> float:
        current_month = self.current_time.month
        current_hour = self.current_time.hour

        # 1. Seasonal factor (solar potential by month for Perth)
        seasonal_factor = {
            1: 0.95,  2: 0.90,  3: 0.80, 4: 0.70,  5: 0.60,  6: 0.50,
            7: 0.55,  8: 0.65,  9: 0.75, 10: 0.85, 11: 0.90, 12: 0.95
        }.get(current_month)

        # 2. Cloud factor (0 = overcast, 1 = clear)
        cloud_factor = 1 - (self.cloud_cover / 9)

        # 3. Time-of-day factor with realistic day length
        # Realistic sunrise/sunset times for Perth (approx. 32° S)
        sunrise_hour = {
            1: 5.5, 2: 6.0, 3: 6.5, 4: 7.0, 5: 7.2, 6: 7.5,
            7: 7.5, 8: 7.0, 9: 6.5, 10: 6.0, 11: 5.5, 12: 5.2
        }[current_month]
        sunset_hour = {
            1: 19.5, 2: 19.0, 3: 18.5, 4: 17.8, 5: 17.3, 6: 17.2,
            7: 17.3, 8: 17.8, 9: 18.0, 10: 18.5, 11: 19.0, 12: 19.5
        }[current_month]

        daylight_hours = sunset_hour - sunrise_hour
        
        # CHANGED: Use dynamic sunrise/sunset instead of fixed 6 AM to 6 PM
        if sunrise_hour <= current_hour <= sunset_hour:
            # Sine curve over the actual daylight hours
            time_of_day_factor = math.sin(math.pi * (current_hour - sunrise_hour) / daylight_hours)
        else:
            time_of_day_factor = 0.0

        # 4. Final solar radiation (in W/m²)
        base_radiation = 1000  # Max theoretical radiation
        radiation = base_radiation * seasonal_factor * cloud_factor * time_of_day_factor

        return max(0, round(radiation, 1))

    def set_solar_radiation(self, solar_radiation: float):
        if 0 <= solar_radiation <= 1000:
            self.solar_radiation = solar_radiation
        else:
            raise ValueError("Illegal solar radiation value. Use 0-1000 (W/m²).")

    def get_wind(self) -> tuple:
        current_month = self.current_time.month
        current_hour = self.current_time.hour

        monthly_avg_speed = {
            1: 5.5,  2: 5.0,  3: 5.2,  4: 4.8, 5: 4.5,  6: 4.0,
            7: 4.2,  8: 4.8,  9: 5.0, 10: 5.3, 11: 5.6, 12: 5.8
        }[current_month]

        diurnal_boost = 1.2 if 12 <= current_hour <= 18 else 0.8
        mean_speed = monthly_avg_speed * diurnal_boost
        wind_speed = max(0, random.normalvariate(mean_speed, 1.5))

        if current_month in [12, 1, 2]:  # Summer — SW sea breeze
            wind_direction = random.normalvariate(230, 20)
        elif current_month in [6, 7, 8]:  # Winter — variable
            wind_direction = random.uniform(0, 360)
        else:
            wind_direction = random.normalvariate(200, 60)
        wind_direction %= 360

        return round(wind_speed, 1), round(wind_direction)

    def set_wind_speed(self, wind_speed: float):
        if not 0 <= wind_speed <= 100:
            raise ValueError("Wind speed must be between 0 and 100 m/s.")
        self.wind_speed = wind_speed

    def set_wind_direction(self, wind_direction: float):
        if not (0 <= wind_direction < 360):
            raise ValueError("Wind direction must be between 0 and less than 360 degrees.")
        self.wind_direction = wind_direction
