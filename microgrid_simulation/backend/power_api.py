from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from simulation_instances import (
    get_environment_instance,
    get_microgrid_instance,
)

# Import from your actual code structure
from power_simulation import (
    WindTurbine, SolarPanel, DieselGenerator,
    get_realistic_demand, GridConnection, Battery
)

app = FastAPI(title="Microgrid Environment API", version="1.0.0")

# Enable CORS for local dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class WindTurbineRequest(BaseModel):
    name: str
    rated_power: float
    direction: int
    cut_in_speed: float = 3.0
    rated_speed: float = 12.0
    cut_out_speed: float = 25.0

class SolarPanelRequest(BaseModel):
    name: str
    rated_power: float
    temp_coefficient: float = 0.004
    stc_temp: float = 25.0

class DieselGeneratorRequest(BaseModel):
    name: str
    rated_power: float
    diesel_usage_litre_per_kw: float = 0.4

class BatteryRequest(BaseModel):
    name: str
    capacity_kwh: float
    max_power_kw: float
    efficiency: float = 0.90
    initial_charge: float = 0.5

class GridConnectionRequest(BaseModel):
    name: str
    import_price: float
    export_price: float

class SimulationStepRequest(BaseModel):
    demand_kw: float
    timestep_hours: float = 1.0

class EnvironmentUpdateRequest(BaseModel):
    temperature: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    solar_radiation: Optional[float] = None

class DieselSetpointRequest(BaseModel):
    setpoint_kw: float

# Get global instances
environment = get_environment_instance()
microgrid = get_microgrid_instance()

@app.get("/")
def get_microgrid_state():
    """Get current state of the microgrid system"""
    device_states = []
    for device in microgrid.devices:
        device_info = {
            "name": device.name,
            "type": device.__class__.__name__,
            "power_output": device.get_power_output()
        }

        if isinstance(device, WindTurbine):
            device_info.update({
                "rated_power": device.rated_power,
                "direction": device.direction,
                "cut_in_speed": device.cut_in_speed,
                "rated_speed": device.rated_speed,
                "cut_out_speed": device.cut_out_speed
            })
        elif isinstance(device, SolarPanel):
            device_info.update({
                "rated_power": device.rated_power,
                "temp_coefficient": device.temp_coefficient,
                "stc_temp": device.stc_temp
            })
        elif isinstance(device, DieselGenerator):
            device_info.update({
                "rated_power": device.rated_power,
                "diesel_usage_litre_per_kw": device.diesel_usage_litre_per_kw,
                "current_diesel_usage": device.get_diesel_usage(),
                "manual_setpoint": microgrid.diesel_setpoints.get(device.name, "auto")
            })
        elif isinstance(device, Battery):
            device_info.update({
                "capacity_kwh": device.capacity_kwh,
                "max_power_kw": device.max_power_kw,
                "state_of_charge": device.get_state_of_charge(),
                "soc_percent": (device.get_state_of_charge() / device.capacity_kwh) * 100,
                "efficiency": device.one_way_efficiency ** 2
            })
        elif isinstance(device, GridConnection):
            device_info.update({
                "import_price": device.import_price,
                "export_price": device.export_price,
                "status": "importing" if device.get_power_output() > 0 else "exporting" if device.get_power_output() < 0 else "idle"
            })

        device_states.append(device_info)

    # Get all batteries and grids
    batteries = [d for d in microgrid.devices if isinstance(d, Battery)]
    grid_connections = [d for d in microgrid.devices if isinstance(d, GridConnection)]

    return {
        "timestamp": environment.current_time.isoformat(),
        "environment": {
            "temperature": environment.temperature,
            "wind_speed": environment.wind_speed,
            "wind_direction": environment.wind_direction,
            "solar_radiation": environment.solar_radiation
        },
        "devices": device_states,
        "batteries": [
            {
                "name": bat.name,
                "capacity_kwh": bat.capacity_kwh,
                "max_power_kw": bat.max_power_kw,
                "state_of_charge": bat.get_state_of_charge(),
                "current_power": bat.get_power_output(),
                "soc_percent": (bat.get_state_of_charge() / bat.capacity_kwh) * 100
            } for bat in batteries
        ],
        "grid_connections": [
            {
                "name": grid.name,
                "import_price": grid.import_price,
                "export_price": grid.export_price,
                "current_power": grid.get_power_output(),
                "status": "importing" if grid.get_power_output() > 0 else "exporting" if grid.get_power_output() < 0 else "idle"
            } for grid in grid_connections
        ],
        "diesel_strategy": microgrid.diesel_strategy,
        "total_generation": sum(d.get_power_output() for d in microgrid.devices if not isinstance(d, (Battery, GridConnection))),
        "total_storage_power": sum(d.get_power_output() for d in microgrid.devices if isinstance(d, Battery)),
        "total_grid_power": sum(d.get_power_output() for d in microgrid.devices if isinstance(d, GridConnection)),
        "device_count": len(microgrid.devices)
    }


# === DEVICE MANAGEMENT ===

@app.post("/add/windturbine")
def add_wind_turbine(turbine: WindTurbineRequest):
    """Add a wind turbine to the microgrid"""
    try:
        if any(d.name == turbine.name for d in microgrid.devices):
            raise HTTPException(status_code=400, detail=f"Device '{turbine.name}' already exists")

        if not (0 <= turbine.direction <= 360):
            raise HTTPException(status_code=400, detail="Direction must be 0-360 degrees")

        wind_turbine = WindTurbine(
            name=turbine.name,
            rated_power=turbine.rated_power,
            direction=turbine.direction,
            cut_in_speed=turbine.cut_in_speed,
            rated_speed=turbine.rated_speed,
            cut_out_speed=turbine.cut_out_speed
        )

        microgrid.devices.append(wind_turbine)

        return {
            "message": f"Wind turbine '{turbine.name}' added successfully",
            "device": {
                "name": wind_turbine.name,
                "rated_power": wind_turbine.rated_power,
                "direction": wind_turbine.direction
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/add/solarpanel")
def add_solar_panel(panel: SolarPanelRequest):
    """Add a solar panel to the microgrid"""
    try:
        if any(d.name == panel.name for d in microgrid.devices):
            raise HTTPException(status_code=400, detail=f"Device '{panel.name}' already exists")

        solar_panel = SolarPanel(
            name=panel.name,
            rated_power=panel.rated_power,
            temp_coefficient=panel.temp_coefficient,
            stc_temp=panel.stc_temp
        )

        microgrid.devices.append(solar_panel)

        return {
            "message": f"Solar panel '{panel.name}' added successfully",
            "device": {
                "name": solar_panel.name,
                "rated_power": solar_panel.rated_power,
                "temp_coefficient": solar_panel.temp_coefficient
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/add/battery")
def add_battery(battery: BatteryRequest):
    """Add a battery to the microgrid"""
    try:
        if any(d.name == battery.name for d in microgrid.devices):
            raise HTTPException(status_code=400, detail=f"Device '{battery.name}' already exists")

        if battery.capacity_kwh <= 0:
            raise HTTPException(status_code=400, detail="Capacity must be positive")
        if battery.max_power_kw <= 0:
            raise HTTPException(status_code=400, detail="Max power must be positive")
        if not (0 < battery.efficiency <= 1):
            raise HTTPException(status_code=400, detail="Efficiency must be between 0 and 1")
        if not (0 <= battery.initial_charge <= 1):
            raise HTTPException(status_code=400, detail="Initial charge must be between 0 and 1")

        new_battery = Battery(
            name=battery.name,
            capacity_kwh=battery.capacity_kwh,
            max_power_kw=battery.max_power_kw,
            efficiency=battery.efficiency,
            initial_charge=battery.initial_charge
        )

        microgrid.devices.append(new_battery)

        return {
            "message": f"Battery '{battery.name}' added successfully",
            "battery": {
                "name": new_battery.name,
                "capacity_kwh": new_battery.capacity_kwh,
                "max_power_kw": new_battery.max_power_kw,
                "efficiency": new_battery.one_way_efficiency ** 2
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/add/gridconnection")
def add_grid_connection(grid: GridConnectionRequest):
    """Add a grid connection to the microgrid"""
    try:
        if any(d.name == grid.name for d in microgrid.devices):
            raise HTTPException(status_code=400, detail=f"Device '{grid.name}' already exists")

        if grid.import_price < 0:
            raise HTTPException(status_code=400, detail="Import price must be non-negative")
        if grid.export_price < 0:
            raise HTTPException(status_code=400, detail="Export price must be non-negative")

        new_grid = GridConnection(
            name=grid.name,
            import_price=grid.import_price,
            export_price=grid.export_price
        )

        microgrid.devices.append(new_grid)

        return {
            "message": f"Grid connection '{grid.name}' added successfully",
            "grid": {
                "name": new_grid.name,
                "import_price": new_grid.import_price,
                "export_price": new_grid.export_price
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/add/dieselgenerator")
def add_diesel_generator(generator: DieselGeneratorRequest):
    """Add a diesel generator to the microgrid"""
    try:
        if any(d.name == generator.name for d in microgrid.devices):
            raise HTTPException(status_code=400, detail=f"Device '{generator.name}' already exists")

        diesel_gen = DieselGenerator(
            name=generator.name,
            rated_power=generator.rated_power,
            diesel_usage_litre_per_kw=generator.diesel_usage_litre_per_kw
        )

        microgrid.devices.append(diesel_gen)

        return {
            "message": f"Diesel generator '{generator.name}' added successfully",
            "device": {
                "name": diesel_gen.name,
                "rated_power": diesel_gen.rated_power,
                "diesel_usage_litre_per_kw": diesel_gen.diesel_usage_litre_per_kw
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/remove/{device_name}")
def remove_device(device_name: str):
    """Remove a device from the microgrid"""
    device_to_remove = None
    for device in microgrid.devices:
        if device.name == device_name:
            device_to_remove = device
            break

    if device_to_remove is None:
        raise HTTPException(status_code=404, detail=f"Device '{device_name}' not found")

    microgrid.devices.remove(device_to_remove)

    return {
        "message": f"Device '{device_name}' removed successfully",
        "remaining_devices": len(microgrid.devices)
    }

# === SIMULATION CONTROL ===

@app.post("/simulate/step")
def simulate_step(request: SimulationStepRequest):
    """Run one simulation step"""
    try:
        results = microgrid.step(
            demand_kw=request.demand_kw,
            timestep_hours=request.timestep_hours
        )

        return {
            "simulation_results": results,
            "environment_state": {
                "temperature": environment.temperature,
                "wind_speed": environment.wind_speed,
                "wind_direction": environment.wind_direction,
                "solar_radiation": environment.solar_radiation,
                "current_time": environment.current_time.isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@app.post("/simulate/realistic")
def simulate_realistic_step(total_daily_kwh: float = 15.0, timestep_hours: float = 1.0):
    """Run simulation step with realistic demand"""
    try:
        demand = get_realistic_demand(environment.current_time, total_daily_kwh)
        results = microgrid.step(demand_kw=demand, timestep_hours=timestep_hours)

        environment.step(timestep_hours)

        return {
            "simulation_results": results,
            "calculated_demand": demand,
            "environment_state": {
                "temperature": environment.temperature,
                "wind_speed": environment.wind_speed,
                "wind_direction": environment.wind_direction,
                "solar_radiation": environment.solar_radiation,
                "current_time": environment.current_time.isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

# === DIESEL GENERATOR CONTROL ===

@app.get("/diesel/status")
def get_diesel_status():
    """Get status of all diesel generators"""
    diesel_generators = [d for d in microgrid.devices if isinstance(d, DieselGenerator)]

    diesel_info = []
    total_diesel_output = 0.0
    total_diesel_usage = 0.0

    for gen in diesel_generators:
        gen_info = {
            "name": gen.name,
            "rated_power": gen.rated_power,
            "current_output": gen.get_power_output(),
            "diesel_usage_rate": gen.diesel_usage_litre_per_kw,
            "current_diesel_usage": gen.get_diesel_usage(),
            "utilization_percent": (gen.get_power_output() / gen.rated_power) * 100 if gen.rated_power > 0 else 0,
            "manual_setpoint": microgrid.diesel_setpoints.get(gen.name, "auto")
        }
        diesel_info.append(gen_info)
        total_diesel_output += gen.get_power_output()
        total_diesel_usage += gen.get_diesel_usage()

    return {
        "diesel_generators": diesel_info,
        "summary": {
            "total_generators": len(diesel_generators),
            "running_generators": sum(1 for gen in diesel_generators if gen.get_power_output() > 0),
            "total_diesel_output": total_diesel_output,
            "total_diesel_usage_lph": total_diesel_usage,
            "current_strategy": microgrid.diesel_strategy,
            "fleet_utilization": (total_diesel_output / sum(gen.rated_power for gen in diesel_generators)) * 100 if diesel_generators else 0
        }
    }

@app.post("/diesel/strategy")
def set_diesel_strategy(strategy: str):
    """Set diesel control strategy"""
    try:
        microgrid.set_diesel_strategy(strategy)
        return {
            "message": f"Diesel strategy set to '{strategy}'",
            "strategy": strategy,
            "available_strategies": ["demand_following", "battery_charging", "manual"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/diesel/{generator_name}/setpoint")
def set_diesel_setpoint(generator_name: str, request: DieselSetpointRequest):
    """Set manual setpoint for diesel generator"""
    diesel_gen = None
    for device in microgrid.devices:
        if isinstance(device, DieselGenerator) and device.name == generator_name:
            diesel_gen = device
            break

    if diesel_gen is None:
        raise HTTPException(status_code=404, detail=f"Generator '{generator_name}' not found")

    if request.setpoint_kw < 0 or request.setpoint_kw > diesel_gen.rated_power:
        raise HTTPException(
            status_code=400,
            detail=f"Setpoint must be 0-{diesel_gen.rated_power} kW"
        )

    microgrid.set_diesel_setpoint(generator_name, request.setpoint_kw)

    return {
        "message": f"Setpoint for '{generator_name}' set to {request.setpoint_kw} kW",
        "generator": generator_name,
        "setpoint": request.setpoint_kw,
        "note": "Set strategy to 'manual' to activate manual setpoints"
    }

@app.get("/diesel/strategies")
def get_diesel_strategies():
    """Get available diesel control strategies"""
    return {
        "current_strategy": microgrid.diesel_strategy,
        "available_strategies": {
            "demand_following": "Run diesel only to meet unmet demand",
            "battery_charging": "Run diesel to charge battery when SOC < 30%",
            "manual": "Use manually set setpoints for each generator"
        }
    }

# === ENVIRONMENT CONTROL ===

# === BATTERY & GRID ===

@app.get("/batteries/status")
def get_batteries_status():
    """Get status of all batteries"""
    batteries = [d for d in microgrid.devices if isinstance(d, Battery)]

    battery_statuses = []
    for battery in batteries:
        battery_statuses.append({
            "name": battery.name,
            "capacity_kwh": battery.capacity_kwh,
            "max_power_kw": battery.max_power_kw,
            "state_of_charge": battery.get_state_of_charge(),
            "soc_percent": (battery.get_state_of_charge() / battery.capacity_kwh) * 100,
            "current_power": battery.get_power_output(),
            "efficiency": battery.one_way_efficiency ** 2
        })

    return {
        "batteries": battery_statuses,
        "total_batteries": len(batteries),
        "total_capacity_kwh": sum(bat.capacity_kwh for bat in batteries),
        "total_energy_kwh": sum(bat.get_state_of_charge() for bat in batteries),
        "total_power_kw": sum(bat.get_power_output() for bat in batteries)
    }
@app.get("/grids/status")
def get_grids_status():
    """Get status of all grid connections"""
    grids = [d for d in microgrid.devices if isinstance(d, GridConnection)]

    grid_statuses = []
    total_import_cost = 0.0
    total_export_revenue = 0.0

    for grid in grids:
        current_power = grid.get_power_output()
        status = "importing" if current_power > 0 else "exporting" if current_power < 0 else "idle"

        grid_statuses.append({
            "name": grid.name,
            "import_price": grid.import_price,
            "export_price": grid.export_price,
            "current_power": current_power,
            "status": status
        })

    return {
        "grid_connections": grid_statuses,
        "total_grids": len(grids),
        "total_power_flow": sum(grid.get_power_output() for grid in grids)
    }


@app.get("/devices")
def list_devices():
    """List all devices"""
    devices = []
    for device in microgrid.devices:
        device_info = {
            "name": device.name,
            "type": device.__class__.__name__,
            "power_output": device.get_power_output()
        }
        devices.append(device_info)

    return {
        "devices": devices,
        "total_devices": len(devices),
        "total_generation": sum(d.get_power_output() for d in microgrid.devices)
    }

@app.get("/health")
def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "devices_count": len(microgrid.devices),
        "environment_time": environment.current_time.isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)