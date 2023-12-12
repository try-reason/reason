import dynamic from "next/dynamic";
import "@uiw/react-textarea-code-editor/dist.css";

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
  data: any;
}

export default function ResponseVisualizer({ data }: Props) {
  return (
    <div className="h-full">
      {!CodeEditor && <div>Loading...</div>}
      <CodeEditor
        value={JSON.stringify(data) !== '{}' ? JSON.stringify(data, null, 2) : ''}
        onChange={e => {}}
        disabled
        language="json"
        className="abc" 
        padding={15}
        placeholder="The response will appear here"
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