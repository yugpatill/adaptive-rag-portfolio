import { QueryResponse, HistoryResponse } from "./types";

const API_BASE = "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function sendQuery(
  query: string,
  sessionId: string
): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/rag/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, session_id: sessionId }),
  });
  return handleResponse<QueryResponse>(res);
}

export async function uploadDocument(
  file: File,
  description: string = ""
): Promise<{ filename: string; chunks: number; status: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/rag/documents/upload`, {
    method: "POST",
    headers: description ? { "x-description": description } : {},
    body: formData,
  });
  return handleResponse(res);
}

export async function getChatHistory(sessionId: string): Promise<HistoryResponse> {
  const res = await fetch(`${API_BASE}/rag/history/${sessionId}`);
  return handleResponse<HistoryResponse>(res);
}

export async function clearChatHistory(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/rag/history/${sessionId}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}
