
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
- Humidity

"""
import datetime
import random
class Environment:
    def __init__(self):
        self.current_time: datetime = datetime.now()
        self.temperature: int = 20
        
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
        
        self.cloud_cover: float = random.normalvariate(self.months[self.current_time.month], 1.5) # 0 (clear) - 9 (sky obstructed from view) okta (unit of measurement for cloud cover) with 1.5 standard deviations from the mean