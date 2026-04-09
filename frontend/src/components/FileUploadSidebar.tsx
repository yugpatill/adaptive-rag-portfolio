"use client";

import { useRef, useState } from "react";
import { UploadedFile } from "@/lib/types";
import { uploadDocument } from "@/lib/api";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle,
  XCircle,
  Loader2,
  X,
} from "lucide-react";

interface FileUploadSidebarProps {
  files: UploadedFile[];
  onFileUploaded: (file: UploadedFile) => void;
  onFileUpdate: (id: string, updates: Partial<UploadedFile>) => void;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: FileText,
  csv: FileSpreadsheet,
  txt: File,
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ filename }: { filename: string }) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const Icon = FILE_ICONS[ext] ?? File;
  return <Icon size={14} className="text-brand-400 flex-shrink-0" />;
}

export function FileUploadSidebar({
  files,
  onFileUploaded,
  onFileUpdate,
}: FileUploadSidebarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFiles(fileList: FileList) {
    const allowed = ["pdf", "docx", "csv", "txt"];
    for (const file of Array.from(fileList)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!allowed.includes(ext)) {
        alert(`Unsupported file type: .${ext}\nAllowed: PDF, DOCX, CSV, TXT`);
        continue;
      }

      const id = crypto.randomUUID();
      const uploadedFile: UploadedFile = {
        id,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        status: "uploading",
      };
      onFileUploaded(uploadedFile);

      try {
        await uploadDocument(file);
        onFileUpdate(id, { status: "success" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        onFileUpdate(id, { status: "error", errorMessage: msg });
      }
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files);
    }
  }

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col bg-surface-900 border-r border-surface-800 h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-surface-800">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">AR</span>
          </div>
          <h1 className="text-white font-semibold text-base">Adaptive RAG</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Intelligent multi-source AI chatbot
        </p>
      </div>

      {/* Upload zone */}
      <div className="px-4 py-4 border-b border-surface-800">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Documents
        </p>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-2 px-3 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-brand-500 bg-brand-500/10"
              : "border-surface-700 hover:border-brand-600 hover:bg-surface-800"
          }`}
        >
          <Upload
            size={18}
            className={isDragging ? "text-brand-400" : "text-gray-500"}
          />
          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium">
              Drop files or click to upload
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              PDF, DOCX, CSV, TXT
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.csv,.txt"
            onChange={onInputChange}
            className="hidden"
          />
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {files.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-6">
            No documents uploaded yet
          </p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-850 border border-surface-700"
            >
              <FileIcon filename={file.name} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-200 font-medium truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                {file.status === "error" && file.errorMessage && (
                  <p className="text-xs text-red-400 mt-0.5 line-clamp-2">
                    {file.errorMessage}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 mt-0.5">
                {file.status === "uploading" && (
                  <Loader2 size={14} className="text-brand-400 animate-spin" />
                )}
                {file.status === "success" && (
                  <CheckCircle size={14} className="text-emerald-400" />
                )}
                {file.status === "error" && (
                  <XCircle size={14} className="text-red-400" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      <div className="px-4 py-3 border-t border-surface-800">
        <div className="space-y-1.5">
          {[
            { color: "bg-emerald-400", label: "Documents" },
            { color: "bg-sky-400", label: "Web Search" },
            { color: "bg-purple-400", label: "General AI" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
