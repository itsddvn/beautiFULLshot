// Screenshot capture types for Tauri IPC

export interface MonitorInfo {
  id: number;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  is_primary: boolean;
}

export interface WindowInfo {
  id: number;
  app_name: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}
