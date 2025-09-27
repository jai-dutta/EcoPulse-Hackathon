from power_simulation import *
from environment_simulation import Environment
from collections import deque

# Create global instances
env = Environment.get_instance()

devices = []
microgrid = MicrogridManager(env, devices)

# Store the last 24 hours of data (assuming 1-hour timesteps)
historical_data = deque(maxlen=24)

def get_environment_instance() -> Environment:
    return env

def get_microgrid_instance() -> MicrogridManager:
    return microgrid

def get_historical_data() -> deque:
    return historical_data