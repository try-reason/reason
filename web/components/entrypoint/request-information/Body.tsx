import dynamic from "next/dynamic";
import "@uiw/react-textarea-code-editor/dist.css";
import { useEffect } from "react";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full bg-[linear-gradient(to_bottom_right,_#101010_0%,_#000000_100%)] rounded-[0.5rem] border-solid border border-[rgba(255,255,255,0.1)]" />
    ) 
  },
);

interface Props {
  body: string;
  setBody: (body: string) => void;
}

export default function Body({ body, setBody }: Props) {
  console.log(CodeEditor)
  return (
    <div className="h-full">
      {!CodeEditor && <div>Loading...</div>}
      <CodeEditor
        value={body}
        onChange={e => setBody(e.target.value)}
        language="json"
        className="abc" 
        padding={15}
        placeholder="Enter JSON body here..."
        style={{
          fontSize: 14,
          height: "100%",
          maxHeight: "100%",
          background: "linear-gradient(to bottom right, #101010 0%, #000000 100%)",
          fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
          borderRadius: '0.5rem',
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}
      />
    </div>
  )
}