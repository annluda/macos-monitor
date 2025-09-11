export interface StaticInfo {
  os_version: string;
  cpu_info: string;
  cpu_cores: number;
  cpu_logical_cores: number;
  total_memory: number;
  total_disk: number;
  local_ip: string;
  boot_time: string;
}

export interface Process {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_rss: number;
}

export interface DynamicMetrics {
  cpu_percent: number;
  memory_percent: number;
  memory_used: number;
  disk_percent: number;
  disk_used: number;
  processes: Process[];
  load_average: {
    load1: number;
    load5: number;
    load15: number;
  };
}
