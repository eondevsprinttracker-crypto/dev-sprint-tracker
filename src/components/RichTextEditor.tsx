"use client";

import { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

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
    height = 300,
    disabled = false,
}: RichTextEditorProps) {
    const editorRef = useRef<Editor | null>(null);

    return (
        <div className="rich-text-editor-wrapper">
            <Editor
                tinymceScriptSrc="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js"
                onInit={(_evt, editor) => {
                    editorRef.current = editor as unknown as Editor;
                }}
                value={value}
                onEditorChange={(content) => onChange(content)}
                disabled={disabled}
                init={{
                    height,
                    menubar: false,
                    placeholder,
                    plugins: [
                        "advlist",
                        "autolink",
                        "lists",
                        "link",
                        "charmap",
                        "preview",
                        "searchreplace",
                        "visualblocks",
                        "code",
                        "insertdatetime",
                        "table",
                        "wordcount",
                    ],
                    toolbar:
                        "undo redo | blocks | " +
                        "bold italic underline strikethrough | " +
                        "bullist numlist | link | " +
                        "removeformat",
                    content_style: `
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                            font-size: 14px;
                            line-height: 1.6;
                            color: #1f2937;
                            padding: 12px;
                        }
                        p { margin: 0 0 0.75em 0; }
                        ul, ol { padding-left: 1.5em; margin: 0 0 0.75em 0; }
                        a { color: #f97316; }
                        h1, h2, h3, h4, h5, h6 { 
                            margin: 0 0 0.5em 0;
                            font-weight: 600;
                            color: #111827;
                        }
                    `,
                    skin: "oxide",
                    content_css: false,
                    branding: false,
                    promotion: false,
                    resize: false,
                    statusbar: true,
                    elementpath: false,
                }}
            />
            <style jsx global>{`
                .rich-text-editor-wrapper {
                    border-radius: 12px;
                    overflow: hidden;
                    border: 2px solid #e5e7eb;
                    transition: all 0.2s ease;
                }
                .rich-text-editor-wrapper:focus-within {
                    border-color: #f97316;
                    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
                }
                .tox-tinymce {
                    border: none !important;
                    border-radius: 0 !important;
                }
                .tox .tox-toolbar-overlord {
                    background: linear-gradient(to bottom, #fafafa, #f5f5f5) !important;
                    border-bottom: 1px solid #e5e7eb !important;
                }
                .tox .tox-toolbar__primary {
                    background: transparent !important;
                }
                .tox .tox-tbtn {
                    border-radius: 6px !important;
                    margin: 2px !important;
                }
                .tox .tox-tbtn:hover {
                    background-color: #fff7ed !important;
                }
                .tox .tox-tbtn--enabled,
                .tox .tox-tbtn--enabled:hover {
                    background-color: #fed7aa !important;
                }
                .tox .tox-statusbar {
                    border-top: 1px solid #e5e7eb !important;
                    background: #fafafa !important;
                }
                .tox .tox-statusbar__text-container {
                    font-size: 11px !important;
                    color: #6b7280 !important;
                }
            `}</style>
        </div>
    );
}
