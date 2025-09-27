from power_simulation import *
from environment_simulation import Environment

# Create global instances
env = Environment.get_instance()

devices = []
microgrid = MicrogridManager(env, devices)

def get_environment_instance() -> Environment:
    return env

def get_microgrid_instance() -> MicrogridManager:
    return microgrid
