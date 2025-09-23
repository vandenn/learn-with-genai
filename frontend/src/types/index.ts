export interface File {
  name: string;
  path: string;
  content: string;
  size: number;
  modified: string;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  file_names: string[];
  created: string;
  modified: string;
}

export interface Config {
  active_project_id: string | null;
  active_file_path: string | null;
  user_settings: Record<string, any>;
  created: string;
  modified: string;
}

export interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}
