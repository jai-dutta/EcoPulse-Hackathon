"""
power_simulation.py

This file represents multiple power generation and storage devices.
"""

from environment_simulation import Environment
import math
from datetime import datetime
import random

class PowerDevice:
    def __init__(self, name: str):
        self.name: str = name
        self.power_output = 0.0  # Current power output in kW

    def update_output(self, environment: Environment) -> None:
        pass

    def get_power_output(self) -> float:
        return self.power_output

    def __str__(self) -> str:
        return self.name

class WindTurbine(PowerDevice):
    # ADDED: Realistic power curve parameters
    def __init__(self, name: str, rated_power: float, direction: int, 
                 cut_in_speed: float, rated_speed: float, cut_out_speed: float):
        super().__init__(name)
        self.rated_power = rated_power
        self.cut_in_speed = cut_in_speed
        self.rated_speed = rated_speed
        self.cut_out_speed = cut_out_speed
        
        if 0 <= direction <= 360:
            self.direction = direction
        else:
            raise ValueError("Invalid direction for WindTurbine.")

    def update_output(self, environment):
        wind_speed = environment.wind_speed
        wind_direction = environment.wind_direction

        angle_diff = abs(self.direction - wind_direction) % 360
        if angle_diff > 180:
            angle_diff = 360 - angle_diff
        alignment_factor = max(0, math.cos(math.radians(angle_diff)))
        
        power = 0.0
        if self.cut_in_speed <= wind_speed < self.rated_speed:
            # Power is proportional to velocity cubed in this range
            # This formula scales the output to match the rated power at the rated speed
            power = self.rated_power * (
                (wind_speed**3 - self.cut_in_speed**3) / 
                (self.rated_speed**3 - self.cut_in_speed**3)
            )
        elif self.rated_speed <= wind_speed < self.cut_out_speed:
            # Output is capped at rated power
            power = self.rated_power
        # If wind is below cut-in or above cut-out, power remains 0.0
        
        self.power_output = power * alignment_factor

class SolarPanel(PowerDevice):
    def __init__(self, name: str, rated_power: float, temp_coefficient: float = 0.004, stc_temp: float = 25.0):
        super().__init__(name)
        self.rated_power = rated_power
        self.temp_coefficient = temp_coefficient  # 0.4% loss per degree C over STC
        self.stc_temp = stc_temp  # Standard Test Condition temperature (25°C)

    def update_output(self, environment):
        max_radiation = 1000  # W/m²
        radiation = environment.solar_radiation
        temperature = environment.temperature

        # Base power from radiation
        base_power = self.rated_power * (radiation / max_radiation)

        # For every degree above 25°C, the panel loses efficiency
        temp_derating = 1.0 - (temperature - self.stc_temp) * self.temp_coefficient
        
        # Final power is base power adjusted for temperature
        self.power_output = max(0.0, base_power * temp_derating)

class DieselGenerator(PowerDevice):
    def __init__(self, name: str, rated_power: float, diesel_usage_litre_per_kw: float = 0.4):
        super().__init__(name)
        self.rated_power = rated_power
        self.diesel_usage_litre_per_kw = diesel_usage_litre_per_kw

    def update_output(self, environment, setpoint_kw):
        self.power_output = min(self.rated_power, setpoint_kw)

    def get_diesel_usage(self):
        return self.diesel_usage_litre_per_kw * self.power_output

class GridConnection(PowerDevice):
    def __init__(self, name: str, import_price: float, export_price: float):
        super().__init__(name)
        self.import_price = import_price # Price to buy from grid ($/kWh)
        self.export_price = export_price # Price to sell to grid ($/kWh)

    def update_output(self, environment, net_demand: float = 0.0):
        # If demand is positive, we import. If negative, we export.
        self.power_output = net_demand

    # Cost calculation method for clarity
    def get_cost(self, timestep_hours: float) -> float:
        """Returns the cost for the timestep. Positive for import, negative for export revenue."""
        if self.power_output > 0: # Importing
            return self.power_output * self.import_price * timestep_hours
        elif self.power_output < 0: # Exporting
            return self.power_output * self.export_price * timestep_hours
        else:
            return 0.0

class Battery(PowerDevice):
    def __init__(self, name: str, capacity_kwh: float, max_power_kw: float, 
                 efficiency: float = 0.90, initial_charge: float = 0.5):
        super().__init__(name)
        self.capacity_kwh = capacity_kwh
        self.max_power_kw = max_power_kw
        # Account for round-trip efficiency
        self.one_way_efficiency = math.sqrt(efficiency) # Split losses between charge/discharge
        self.state_of_charge = initial_charge * self.capacity_kwh  # kWh

    def update_output(self, environment, demand: float = 0.0, timestep_hours: float = 1.0):
        if demand > 0:  # Discharge to meet demand
            # How much power can we deliver from storage?
            power_available_from_soc = self.state_of_charge * self.one_way_efficiency / timestep_hours
            available_to_discharge = min(power_available_from_soc, self.max_power_kw)
            
            discharge = min(demand, available_to_discharge)
            self.power_output = discharge
            # To deliver 'discharge' kW, we must pull more from storage due to losses
            self.state_of_charge -= (discharge * timestep_hours) / self.one_way_efficiency

        elif demand < 0:  # Charge with surplus generation
            # How much can we charge?
            power_available_to_charge = (self.capacity_kwh - self.state_of_charge) / self.one_way_efficiency / timestep_hours
            available_to_charge = min(-demand, self.max_power_kw, power_available_to_charge)

            self.power_output = -available_to_charge
            # When charging, we store less than we take in due to losses
            self.state_of_charge += available_to_charge * timestep_hours * self.one_way_efficiency
        else:
            self.power_output = 0.0
        
        self.state_of_charge = max(0, min(self.capacity_kwh, self.state_of_charge))

    def get_state_of_charge(self) -> float:
        return self.state_of_charge

class MicrogridManager:
    def __init__(self, environment, devices: list):
        self.environment = environment
        self.devices = devices
        self.diesel_strategy = "demand_following"
        self.diesel_setpoints = {}

    def set_diesel_strategy(self, strategy: str):
        valid_strategies = ["demand_following", "battery_charging", "manual"]
        if strategy not in valid_strategies:
            raise ValueError(f"Strategy must be one of {valid_strategies}")
        self.diesel_strategy = strategy

    def set_diesel_setpoint(self, generator_name: str, setpoint_kw: float):
        self.diesel_setpoints[generator_name] = setpoint_kw

    def step(self, demand_kw: float, timestep_hours: float = 1.0) -> dict:
        # 1. Separate devices by type for easier management
        renewable_devices = []
        diesel_generators = []
        batteries = [d for d in self.devices if isinstance(d, Battery)]
        grid_connections = [d for d in self.devices if isinstance(d, GridConnection)]

        for d in self.devices:
            if isinstance(d, DieselGenerator):
                diesel_generators.append(d)
            elif isinstance(d, (WindTurbine, SolarPanel)):
                d.update_output(self.environment)
                renewable_devices.append(d)

        # 2. Calculate total renewable generation
        renewable_generation = sum(d.get_power_output() for d in renewable_devices)
        
        # 3. Calculate demand remaining after renewables
        net_demand_after_renewables = demand_kw - renewable_generation
        
        # 4. Determine required diesel generation based on strategy
        diesel_generation = self._control_diesel_generators(
            diesel_generators, net_demand_after_renewables, timestep_hours
        )
        
        # 5. Calculate total generation and the final net demand for the batteries
        total_generation = renewable_generation + diesel_generation
        net_demand_for_batteries = demand_kw - total_generation

        # 6. Battery response: Charge with surplus or discharge to meet shortfall
        total_battery_power = 0.0
        total_battery_capacity = sum(bat.capacity_kwh for bat in batteries) or 1
        for battery in batteries:
            battery_share = (battery.capacity_kwh / total_battery_capacity) * net_demand_for_batteries
            battery.update_output(self.environment, battery_share, timestep_hours)
            total_battery_power += battery.get_power_output()
            
        # 7. Final net demand after battery response
        final_net_demand = net_demand_for_batteries - total_battery_power
        
        # 8. Grid response: import or export any remaining balance
        total_grid_power = 0.0
        if grid_connections:
            grid_share = final_net_demand / len(grid_connections)
            for grid in grid_connections:
                grid.update_output(self.environment, grid_share)
                total_grid_power += grid.get_power_output()

        # 9. Calculate costs and usage for this step
        total_diesel_usage = sum(gen.get_diesel_usage() for gen in diesel_generators)
        total_grid_cost = sum(grid.get_cost(timestep_hours) for grid in grid_connections)

        # 10. Record results
        results = {
            "Time": self.environment.current_time.strftime("%Y-%m-%d %H:%M"),
            "Demand (kW)": demand_kw,
            "Renewable Generation (kW)": renewable_generation,
            "Diesel Generation (kW)": diesel_generation,
            "Battery Flow (kW)": total_battery_power,
            "Grid Flow (kW)": total_grid_power,
            "Total Battery SOC (kWh)": sum(bat.get_state_of_charge() for bat in batteries),
            "Total Diesel Usage (L/h)": total_diesel_usage,
            "Total Grid Cost ($)": total_grid_cost,
            "Diesel Strategy": self.diesel_strategy,
            "Battery Count": len(batteries),
            "Grid Connection Count": len(grid_connections)
        }
        return results

    def _control_diesel_generators(self, diesel_generators, net_demand, timestep_hours):
        """Control diesel generators based on selected strategy"""
        diesel_generation = 0.0
        batteries = [d for d in self.devices if isinstance(d, Battery)]

        if self.diesel_strategy == "demand_following":
            remaining_demand = max(0, net_demand)
            for diesel_gen in diesel_generators:
                if remaining_demand > 0:
                    setpoint = min(remaining_demand, diesel_gen.rated_power)
                    diesel_gen.update_output(self.environment, setpoint)
                    diesel_output = diesel_gen.get_power_output()
                    diesel_generation += diesel_output
                    remaining_demand -= diesel_output
                else:
                    diesel_gen.update_output(self.environment, 0.0)

        elif self.diesel_strategy == "battery_charging":
            # Calculate average SOC across all batteries
            if batteries:
                total_soc = sum(bat.get_state_of_charge() for bat in batteries)
                total_capacity = sum(bat.capacity_kwh for bat in batteries)
                avg_soc_percent = (total_soc / total_capacity) * 100 if total_capacity > 0 else 0
            else:
                avg_soc_percent = 0

            if avg_soc_percent < 30:  # Low battery threshold
                battery_charge_power = sum(bat.max_power_kw for bat in batteries)
                total_setpoint = max(0, net_demand) + battery_charge_power

                for diesel_gen in diesel_generators:
                    if total_setpoint > 0:
                        setpoint = min(total_setpoint, diesel_gen.rated_power)
                        diesel_gen.update_output(self.environment, setpoint)
                        diesel_output = diesel_gen.get_power_output()
                        diesel_generation += diesel_output
                        total_setpoint -= diesel_output
                    else:
                        diesel_gen.update_output(self.environment, 0.0)
            else:
                # If batteries are sufficiently charged, DGs do not run.
                for diesel_gen in diesel_generators:
                    diesel_gen.update_output(self.environment, 0.0)

        elif self.diesel_strategy == "manual":
            for diesel_gen in diesel_generators:
                setpoint = self.diesel_setpoints.get(diesel_gen.name, 0.0)
                diesel_gen.update_output(self.environment, setpoint)
                diesel_generation += diesel_gen.get_power_output()

        return diesel_generation


def get_realistic_demand(current_time: datetime, total_daily_kwh: float) -> float:
    """
    Generates a plausible industrial demand profile for a 24/7 operation.
    The profile is scaled to match the total_daily_kwh.
    """
    hour = current_time.hour + current_time.minute / 60

    # Base profile for an industrial site: high, constant load with minor dips
    # during shift changes or maintenance periods.
    base_profile = [
        0.9, 0.85, 0.85, 0.85, 0.9, 0.95, 1.0, 1.0, 1.0, 1.0, 0.95, 0.9, # 00:00 - 11:59
        0.9, 0.95, 1.0, 1.0, 1.0, 0.95, 0.9, 0.85, 0.85, 0.85, 0.9, 0.95 # 12:00 - 23:59
    ]

    # Interpolate between hours
    hour_floor = int(hour)
    hour_ceil = (hour_floor + 1) % 24
    fraction = hour - hour_floor
    
    base_demand = base_profile[hour_floor] * (1 - fraction) + base_profile[hour_ceil] * fraction

    # The average power (kW) required to meet the daily energy target (kWh)
    average_power = total_daily_kwh / 24.0
    
    # Scale the base demand to meet the average power requirement
    demand = base_demand * average_power
    
    # Add minor random noise
    noise = random.uniform(-0.05, 0.05) * demand
    final_demand = demand + noise
    
    return max(average_power * 0.7, final_demand) # Ensure a minimum load