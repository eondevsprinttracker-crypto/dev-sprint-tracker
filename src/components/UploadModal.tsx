"use client";

import { useState, useRef } from "react";
import { markAsPending } from "@/app/actions/taskActions";

interface UploadModalProps {
    taskId: string | null;
    onClose: () => void;
}

export default function UploadModal({ taskId, onClose }: UploadModalProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!taskId) return null;

    const currentTaskId = taskId;

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            setError("Please select a file");
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setError("File size must be less than 50MB");
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = async () => {
                const base64 = reader.result as string;

                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ file: base64, taskId: currentTaskId }),
                });

                const data = await response.json();

                clearInterval(progressInterval);
                setUploadProgress(100);

                if (data.success) {
                    const result = await markAsPending(currentTaskId, data.url);
                    if (result.success) {
                        setTimeout(() => onClose(), 300);
                    } else {
                        setError(result.error || "Failed to update task");
                        setUploading(false);
                    }
                } else {
                    setError(data.error || "Upload failed");
                    setUploading(false);
                }
            };

            reader.onerror = () => {
                clearInterval(progressInterval);
                setError("Failed to read file");
                setUploading(false);
            };
        } catch (err) {
            clearInterval(progressInterval);
            setError("Upload failed");
            setUploading(false);
        }
    }

    function handleDrag(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (fileInputRef.current) {
                fileInputRef.current.files = e.dataTransfer.files;
                setSelectedFile(e.dataTransfer.files[0]);
            }
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    }

    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="glass-modal rounded-2xl p-6 w-full max-w-md animate-scale-in-bounce">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Upload Proof</h3>
                        <p className="text-xs text-neutral-500">Submit your work for review</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-scale-in">
                        <div className="p-1.5 bg-red-500/20 rounded-lg flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpload}>
                    {/* Upload Zone */}
                    <div
                        className={`mb-5 p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer relative overflow-hidden ${dragActive
                            ? "border-emerald-500 bg-emerald-500/10"
                            : selectedFile
                                ? "border-emerald-500/50 bg-emerald-500/5"
                                : "border-neutral-700 hover:border-orange-500/50 bg-black/30"
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-3 relative">
                                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
                                            <circle
                                                className="text-neutral-700"
                                                strokeWidth="8"
                                                stroke="currentColor"
                                                fill="transparent"
                                                r="40"
                                                cx="50"
                                                cy="50"
                                            />
                                            <circle
                                                className="text-emerald-500 transition-all duration-300"
                                                strokeWidth="8"
                                                strokeLinecap="round"
                                                stroke="currentColor"
                                                fill="transparent"
                                                r="40"
                                                cx="50"
                                                cy="50"
                                                style={{
                                                    strokeDasharray: `${2 * Math.PI * 40}`,
                                                    strokeDashoffset: `${2 * Math.PI * 40 * (1 - uploadProgress / 100)}`
                                                }}
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                                            {uploadProgress}%
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-300">Uploading...</p>
                                </div>
                            </div>
                        )}

                        <div className="text-center">
                            {selectedFile ? (
                                <>
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                        <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-white font-medium mb-1 truncate max-w-[200px] mx-auto">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-neutral-500">{formatFileSize(selectedFile.size)}</p>
                                    <p className="text-xs text-orange-400 mt-2">Click to change file</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-neutral-800 flex items-center justify-center">
                                        <svg className="w-7 h-7 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-neutral-300 mb-1">
                                        <span className="text-orange-400 font-medium">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        JPG, PNG, GIF, MP4, WebM (max 50MB)
                                    </p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="btn-ghost px-5 py-2.5 text-sm disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !selectedFile}
                            className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:-translate-y-0.5"
                        >
                            {uploading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Submit for Review
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
