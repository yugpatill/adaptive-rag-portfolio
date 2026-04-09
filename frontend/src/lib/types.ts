export type Route = "index" | "general" | "search";

export interface Source {
  content: string;
  source: string;
  title: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  route?: Route;
  sources?: Source[];
  timestamp: Date;
  isError?: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
}

export interface QueryResponse {
  answer: string;
  route: Route;
  sources: Source[];
  session_id: string;
}

export interface HistoryResponse {
  session_id: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}
