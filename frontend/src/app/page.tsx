"use client";
import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChatWindow } from "@/components/ChatWindow";
import { FileUploadSidebar } from "@/components/FileUploadSidebar";
import { UploadedFile } from "@/lib/types";

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  const handleNewSession = useCallback(() => {
    setSessionId(uuidv4());
  }, []);

  const handleFileUploaded = useCallback((file: UploadedFile) => {
    setUploadedFiles((prev) => [file, ...prev]);
  }, []);

  const handleFileUpdate = useCallback(
    (id: string, updates: Partial<UploadedFile>) => {
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  if (!sessionId) return null;

  return (
    <main className="flex h-screen overflow-hidden bg-surface-950">
      <FileUploadSidebar
        files={uploadedFiles}
        onFileUploaded={handleFileUploaded}
        onFileUpdate={handleFileUpdate}
      />
      <ChatWindow sessionId={sessionId} onNewSession={handleNewSession} />
    </main>
  );
}