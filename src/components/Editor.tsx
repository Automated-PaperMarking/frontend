import { Suspense } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

interface Props {
  language: string;
  value: string;
  onChange: (v: string) => void;
  height?: number | string;
}

export default function CodeEditor({ language, value, onChange, height = 360 }: Props) {
  const handleChange = (val?: string) => onChange(val ?? "");
  const onMount: OnMount = (editor) => {
    editor.updateOptions({ fontSize: 14, minimap: { enabled: false } });
  };

  return (
    <div className="border rounded-md overflow-hidden bg-card">
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading editor…</div>}>
        <Editor
          height={height}
          defaultLanguage={language}
          language={language}
          theme="vs-dark"
          value={value}
          onChange={handleChange}
          onMount={onMount}
          options={{ tabSize: 2, scrollBeyondLastLine: false }}
        />
      </Suspense>
    </div>
  );
}
