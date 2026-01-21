"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => (
        <div className="h-[250px] rounded-xl bg-gray-100 animate-pulse flex items-center justify-center border-2 border-gray-200">
            <span className="text-gray-400">Loading editor...</span>
        </div>
    ),
});

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    height?: number;
    disabled?: boolean;
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = "Enter description...",
    height = 250,
    disabled = false,
}: RichTextEditorProps) {
    const modules = useMemo(
        () => ({
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link"],
                ["clean"],
            ],
        }),
        []
    );

    const formats = [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "list",
        "link",
    ];

    return (
        <div className="rich-text-editor-wrapper">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                readOnly={disabled}
                style={{ height: height - 42 }}
            />
            <style jsx global>{`
                .rich-text-editor-wrapper {
                    border-radius: 12px;
                    overflow: hidden;
                    border: 2px solid #e5e7eb;
                    transition: all 0.2s ease;
                    background: white;
                }
                .rich-text-editor-wrapper:focus-within {
                    border-color: #f97316;
                    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
                }
                .rich-text-editor-wrapper .ql-container {
                    border: none !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    min-height: ${height - 42}px;
                }
                .rich-text-editor-wrapper .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid #e5e7eb !important;
                    background: linear-gradient(to bottom, #fafafa, #f5f5f5);
                    padding: 8px 12px !important;
                }
                .rich-text-editor-wrapper .ql-toolbar button {
                    border-radius: 6px;
                    margin: 0 2px;
                }
                .rich-text-editor-wrapper .ql-toolbar button:hover {
                    background-color: #fff7ed;
                }
                .rich-text-editor-wrapper .ql-toolbar button.ql-active {
                    background-color: #fed7aa;
                }
                .rich-text-editor-wrapper .ql-toolbar .ql-picker-label {
                    border-radius: 6px;
                }
                .rich-text-editor-wrapper .ql-toolbar .ql-picker-label:hover {
                    background-color: #fff7ed;
                }
                .rich-text-editor-wrapper .ql-editor {
                    padding: 12px 16px;
                    color: #1f2937;
                    line-height: 1.6;
                }
                .rich-text-editor-wrapper .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: normal;
                    left: 16px;
                }
                .rich-text-editor-wrapper .ql-editor p {
                    margin-bottom: 0.75em;
                }
                .rich-text-editor-wrapper .ql-editor h1,
                .rich-text-editor-wrapper .ql-editor h2,
                .rich-text-editor-wrapper .ql-editor h3 {
                    margin-bottom: 0.5em;
                    font-weight: 600;
                    color: #111827;
                }
                .rich-text-editor-wrapper .ql-editor ul,
                .rich-text-editor-wrapper .ql-editor ol {
                    padding-left: 1.5em;
                    margin-bottom: 0.75em;
                }
                .rich-text-editor-wrapper .ql-editor a {
                    color: #f97316;
                }
                .rich-text-editor-wrapper .ql-snow .ql-stroke {
                    stroke: #6b7280;
                }
                .rich-text-editor-wrapper .ql-snow .ql-fill {
                    fill: #6b7280;
                }
                .rich-text-editor-wrapper .ql-snow button:hover .ql-stroke,
                .rich-text-editor-wrapper .ql-snow button.ql-active .ql-stroke {
                    stroke: #f97316;
                }
                .rich-text-editor-wrapper .ql-snow button:hover .ql-fill,
                .rich-text-editor-wrapper .ql-snow button.ql-active .ql-fill {
                    fill: #f97316;
                }
            `}</style>
        </div>
    );
}
