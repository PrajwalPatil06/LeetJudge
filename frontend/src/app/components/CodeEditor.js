"use client";

import { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({ language, value, onChange, readOnly = false, onSubmit }) {
  const editorRef = useRef(null);
  const onSubmitRef = useRef(onSubmit);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    
    if (onSubmit) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        if (onSubmitRef.current) onSubmitRef.current();
      });
    }
  };

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      theme="light"
      onChange={onChange}
      onMount={handleEditorMount}
      options={{
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        lineHeight: 24,
        readOnly: readOnly,
        domReadOnly: readOnly,
        cursorBlinking: readOnly ? 'solid' : 'blink',
      }}
    />
  );
}
