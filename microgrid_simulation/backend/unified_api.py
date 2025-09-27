from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import copy

from simulation_instances import (
    get_environment_instance,
    get_microgrid_instance,
)

# Import from your actual code structure
from power_simulation import (
    WindTurbine, SolarPanel, DieselGenerator,
    get_realistic_demand, GridConnection, Battery
)

app = FastAPI(title="Unified Microgrid Management API", version="2.2.0")

# Enable CORS for local dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class WindTurbineParams(BaseModel):
    name: str
    rated_power: float
    direction: int
    cut_in_speed: float = 3.0
    rated_speed: float = 12.0
    cut_out_speed: float = 25.0

class SolarPanelParams(BaseModel):
    name: str
    rated_power: float
    temp_coefficient: float = 0.004
    stc_temp: float = 25.0

class DieselGeneratorParams(BaseModel):
    name: str
    rated_power: float
    diesel_usage_litre_per_kw: float = 0.4

class BatteryParams(BaseModel):
    name: str
    capacity_kwh: float
    max_power_kw: float
    efficiency: float = 0.90
    initial_charge: float = 0.5

class GridConnectionParams(BaseModel):
    name: str
    import_price: float
    export_price: float

class AddDeviceRequest(BaseModel):
    type: str
    params: Dict[str, Any]

class AnalysisRequest(BaseModel):
    exclude_device_name: str
    duration_days: int = 1

class SimulationStepRequest(BaseModel):
    demand_kw: float
    timestep_hours: float = 1.0

class EnvironmentUpdateRequest(BaseModel):
    temperature: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    solar_radiation: Optional[float] = None
    cloud_cover: Optional[float] = None

class DieselSetpointRequest(BaseModel):
    setpoint_kw: float

# Get global instances
environment = get_environment_instance()
microgrid = get_microgrid_instance()

def _env_state():
    """Get current environment state"""
    return {
        "time": environment.current_time.strftime("%d %B %Y %H:%M"),
        "timestamp": environment.current_time.isoformat(),
        "temperature": getattr(environment, "temperature", None),
        "solar_radiation": getattr(environment, "solar_radiation", None),
        "wind_speed": getattr(environment, "wind_speed", None),
        "wind_direction": getattr(environment, "wind_direction", None),
        "cloud_cover": getattr(environment, "cloud_cover", None),
    }

def _set_if_exists(obj, attr, value):
    """Set attribute if it exists and value is not None"""
    if hasattr(obj, attr) and value is not None:
        setattr(obj, attr, value)

# === MAIN DASHBOARD ENDPOINT ===
@app.get("/")
def get_system_status():
    """Get complete system status including environment and power systems"""
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
        "environment": _env_state(),
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

# === ENVIRONMENT ENDPOINTS ===
@app.get("/environment")
def get_environment():
    """Get current environment state"""
    return _env_state()

@app.post("/environment/update")
def update_environment(req: EnvironmentUpdateRequest):
    """Update multiple environment parameters at once"""
    _set_if_exists(environment, "temperature", req.temperature)
    _set_if_exists(environment, "wind_speed", req.wind_speed)
    _set_if_exists(environment, "wind_direction", req.wind_direction)
    _set_if_exists(environment, "solar_radiation", req.solar_radiation)
    _set_if_exists(environment, "cloud_cover", req.cloud_cover)
    return {
        "message": "Environment updated",
        "environment": _env_state()
    }

# ... (Individual environment set endpoints remain the same) ...

@app.post("/step")
def step_environment(timestep_hours: float = Query(1.0, gt=0, le=24)):
    """Step the environment simulation forward"""
    try:
        environment.step(timestep_hours)
        return {"message": f"Environment stepped by {timestep_hours} hours", "environment": _env_state()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Environment step error: {str(e)}")

@app.post("/reset")
def reset_environment():
    """Reset the environment to initial state"""
    try:
        # Reset environment to initial values
        environment.current_time = datetime.now()
        environment.set_environment_values()
        
        return {"message": "Environment reset to initial state", "environment": _env_state()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Environment reset error: {str(e)}")

# === DEVICE MANAGEMENT ENDPOINTS ===
DEVICE_TYPE_MAP = {
    "windturbine": (WindTurbine, WindTurbineParams),
    "solarpanel": (SolarPanel, SolarPanelParams),
    "dieselgenerator": (DieselGenerator, DieselGeneratorParams),
    "battery": (Battery, BatteryParams),
    "gridconnection": (GridConnection, GridConnectionParams),
}

@app.post("/device")
def add_device(request: AddDeviceRequest):
    """Add any type of device to the microgrid."""
    device_type_key = request.type.lower()
    
    if device_type_key not in DEVICE_TYPE_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid device type: {request.type}. Valid types are: {list(DEVICE_TYPE_MAP.keys())}")

    DeviceClass, PydanticModel = DEVICE_TYPE_MAP[device_type_key]

    try:
        validated_params = PydanticModel(**request.params)
        
        if any(d.name == validated_params.name for d in microgrid.devices):
            raise HTTPException(status_code=400, detail=f"Device '{validated_params.name}' already exists")

        new_device = DeviceClass(**validated_params.dict())
        microgrid.devices.append(new_device)
        
        return {
            "message": f"{DeviceClass.__name__} '{validated_params.name}' added successfully.",
            "device": validated_params.dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/device/{device_name}")
def remove_device(device_name: str):
    """Remove a device from the microgrid by name."""
    device_to_remove = next((d for d in microgrid.devices if d.name == device_name), None)

    if device_to_remove is None:
        raise HTTPException(status_code=404, detail=f"Device '{device_name}' not found")

    microgrid.devices.remove(device_to_remove)
    
    if isinstance(device_to_remove, DieselGenerator) and device_name in microgrid.diesel_setpoints:
        del microgrid.diesel_setpoints[device_name]

    return {
        "message": f"Device '{device_name}' removed successfully",
        "remaining_devices": len(microgrid.devices)
    }

# === SIMULATION & ANALYSIS ===
@app.post("/simulate/step")
def simulate_step(request: SimulationStepRequest):
    """Run one simulation step with specified demand"""
    try:
        results = microgrid.step(
            demand_kw=request.demand_kw,
            timestep_hours=request.timestep_hours
        )
        return { "simulation_results": results, "environment_state": _env_state() }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@app.post("/simulate/realistic")
def simulate_realistic_step(total_daily_kwh: float = Query(default=150.0), timestep_hours: float = Query(default=1.0)):
    """Run simulation step with realistic demand calculation"""
    try:
        demand = get_realistic_demand(environment.current_time, total_daily_kwh)
        results = microgrid.step(demand_kw=demand, timestep_hours=timestep_hours)
        environment.step(timestep_hours)
        return {
            "simulation_results": results,
            "calculated_demand": demand,
            "environment_state": _env_state()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

def run_simulation_for_duration(sim_microgrid, sim_environment, duration_days: int):
    """Helper to run a simulation for a given duration and return metrics."""
    total_diesel_usage_l, total_grid_import_kwh, total_cost, total_renewable_gen = 0, 0, 0, 0
    
    CO2_KG_PER_LITRE_DIESEL = 2.68
    CO2_KG_PER_KWH_GRID = 0.43
    DIESEL_PRICE_PER_LITRE = 1.20

    grid_connections = [d for d in sim_microgrid.devices if isinstance(d, GridConnection)]
    import_price = grid_connections[0].import_price if grid_connections else 0.15
    export_price = grid_connections[0].export_price if grid_connections else 0.05

    for _ in range(duration_days * 24):
        demand_kw = get_realistic_demand(sim_environment.current_time, total_daily_kwh=1500)
        results = sim_microgrid.step(demand_kw=demand_kw, timestep_hours=1.0)
        sim_environment.step(1.0)
        
        total_diesel_usage_l += results.get("diesel_usage_lph", 0)
        grid_power = results.get("grid_power_kw", 0)
        
        cost_for_step = (results.get("diesel_usage_lph", 0) * DIESEL_PRICE_PER_LITRE)
        if grid_power > 0:
            total_grid_import_kwh += grid_power
            cost_for_step += grid_power * import_price
        else:
            cost_for_step -= abs(grid_power) * export_price
        total_cost += cost_for_step

        total_renewable_gen += results.get("renewable_generation_kw", 0)

    co2_emissions = (total_diesel_usage_l * CO2_KG_PER_LITRE_DIESEL) + (total_grid_import_kwh * CO2_KG_PER_KWH_GRID)
    
    return {
        "total_cost": total_cost,
        "co2_emissions_kg": co2_emissions,
        "diesel_usage_l": total_diesel_usage_l,
        "grid_import_kwh": total_grid_import_kwh,
        "renewable_generation_kwh": total_renewable_gen
    }

@app.post("/analyze/scenario")
def analyze_scenario(request: AnalysisRequest):
    """Runs a twin simulation: one with renewables, one without (baseline)."""
    
    # --- Scenario 1: Current system with renewables ---
    microgrid_with_renewables = copy.deepcopy(microgrid)
    env_with_renewables = copy.deepcopy(environment)
    results_with_renewables = run_simulation_for_duration(microgrid_with_renewables, env_with_renewables, request.duration_days)

    # --- Scenario 2: Baseline system without any renewables ---
    microgrid_without_renewables = copy.deepcopy(microgrid)
    env_without_renewables = copy.deepcopy(environment)
    
    # Remove all wind and solar devices for the baseline scenario
    microgrid_without_renewables.devices = [
        d for d in microgrid_without_renewables.devices 
        if not isinstance(d, (WindTurbine, SolarPanel))
    ]
        
    results_without_renewables = run_simulation_for_duration(microgrid_without_renewables, env_without_renewables, request.duration_days)
    
    # --- Calculate savings ---
    cost_saved = results_without_renewables["total_cost"] - results_with_renewables["total_cost"]
    co2_saved_kg = results_without_renewables["co2_emissions_kg"] - results_with_renewables["co2_emissions_kg"]
    
    cost_saving_percent = (cost_saved / results_without_renewables["total_cost"]) * 100 if results_without_renewables["total_cost"] != 0 else 0
    co2_saving_percent = (co2_saved_kg / results_without_renewables["co2_emissions_kg"]) * 100 if results_without_renewables["co2_emissions_kg"] != 0 else 0

    return {
        "with_renewables": results_with_renewables,
        "without_renewables": results_without_renewables,
        "savings": {
            "cost_saved": cost_saved,
            "co2_saved_kg": co2_saved_kg,
            "cost_saving_percent": cost_saving_percent,
            "co2_saving_percent": co2_saving_percent,
        }
    }

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
def set_diesel_strategy(strategy: str = Query(...)):
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

# === BATTERY & GRID STATUS ===
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

# === UTILITY ENDPOINTS ===
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
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "devices_count": len(microgrid.devices),
        "environment_time": environment.current_time.isoformat(),
        "api_version": "2.2.0"
    }

def run():
    """Run the unified API server"""
    import uvicorn
    print("Starting Unified Microgrid Management API on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    run()