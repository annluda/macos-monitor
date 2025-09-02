import asyncio
import psutil
import os
import platform
import cpuinfo
import subprocess
import re
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Functions ---
def get_macos_version():
    try:
        name = subprocess.check_output(['sw_vers', '-productName']).decode('utf-8').strip()
        version = subprocess.check_output(['sw_vers', '-productVersion']).decode('utf-8').strip()
        return f"{name} {version}"
    except Exception:
        return platform.platform()

# --- API Endpoints ---

@app.get("/api/system/static")
async def get_system_static():
    boot_dt = datetime.fromtimestamp(psutil.boot_time())
    uptime_seconds = (datetime.now() - boot_dt).total_seconds()
    
    home_path = os.path.expanduser('~')
    disk_total = psutil.disk_usage(home_path).total
    mem_total = psutil.virtual_memory().total

    return {
        "os_version": get_macos_version(),
        "cpu_info": cpuinfo.get_cpu_info()['brand_raw'],
        "cpu_cores": psutil.cpu_count(logical=False),
        "cpu_logical_cores": psutil.cpu_count(logical=True),
        "total_memory": mem_total,
        "total_disk": disk_total,
        "boot_time": boot_dt.isoformat(),
        "uptime_seconds": uptime_seconds
    }

# Initialize CPU percent calculation for dynamic endpoint
psutil.cpu_percent(interval=None)
# Initialize process cpu percent calculation
for p in psutil.process_iter(['pid']):
    try:
        p.cpu_percent(interval=None)
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        pass

import re

def get_gpu_usage():
    try:
        result = subprocess.check_output(
            ['sudo', '/usr/bin/powermetrics', '--samplers', 'gpu_power', '-i', '1000', '-n', '1'],
            stderr=subprocess.DEVNULL
        ).decode('utf-8')
        
        gpu_residency = re.search(r"GPU HW active residency:\s+(\d+\.?\d*)%", result)
        
        if not gpu_residency:
            print(f"Could not parse GPU residency from powermetrics output:\n---\n{result}\n---")
            return 0.0
            
        return float(gpu_residency.group(1))
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError) as e:
        print(f"Could not fetch powermetrics data for GPU: {e}")
        return 0.0


@app.get("/api/system/dynamic")
async def get_system_dynamic():
    gpu_usage_task = asyncio.to_thread(get_gpu_usage)
    
    cpu_percent = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    home_path = os.path.expanduser('~')
    disk = psutil.disk_usage(home_path)

    procs = list(psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']))
    for p in procs:
        try:
            p.cpu_percent(interval=None)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    await asyncio.sleep(0.5)

    processes = []
    for p in procs:
        try:
            p_info = p.as_dict(attrs=['pid', 'name'])
            p_info['cpu_percent'] = p.cpu_percent(interval=None)
            p_info['memory_rss'] = p.memory_info().rss
            processes.append(p_info)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    top_processes = sorted(processes, key=lambda p: p['cpu_percent'], reverse=True)[:5]

    gpu_percent = await gpu_usage_task

    return {
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "memory_used": memory.used,
        "disk_percent": disk.percent,
        "disk_used": disk.used,
        "processes": top_processes,
        "gpu_percent": gpu_percent,
    }


@app.websocket("/ws/network")
async def network_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            net_io = psutil.net_io_counters()
            await websocket.send_json({
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv
            })
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Client disconnected from network socket")
    except Exception as e:
        print(f"An error occurred in network socket: {e}")