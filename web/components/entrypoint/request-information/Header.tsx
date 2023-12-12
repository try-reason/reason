import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Delete, Plus, X } from "lucide-react";

interface Props {
  headers: string[][];
  setHeaders: (headers: string[][]) => void;
}

export default function Header({ headers, setHeaders }: Props) {
  function addItem() {
    let temp = [...headers]
    temp.push(['', ''])
    setHeaders(temp)
  }

  function removeItem(idx: number) {
    let temp = [...headers]
    
    if (headers.length === 1) {
      temp[0] = ['', '']
      setHeaders(temp)
      return
    }

    temp.splice(idx, 1)
    setHeaders(temp)
  }

  function changeItem(idx: number, key: string, value: string) {
    let temp = [...headers]
    temp[idx] = [key, value]
    setHeaders(temp)
  }

  return (
    <div className="w-full grid gap-2 text-muted-foreground text-sm" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
      <span>Key</span>
      <span>Value</span>
      <div />

      {headers.map(([key, value], idx) => (
        <>
          <Input placeholder="Header name" className="font-mono text-zinc-200" value={key} onChange={e => changeItem(idx, e.target.value, value)} />
          <Input placeholder="Header value" className="font-mono text-zinc-200" value={value} onChange={e => changeItem(idx, key, e.target.value)} />
          <Button variant="ghost" className="px-2" onClick={() => removeItem(idx)}><X size={18} /></Button>
        </>
      ))}

      <Button variant="outline" className="w-[150px] mb-3" onClick={addItem}>
        <Plus size={20} className="mr-1" />Add another
      </Button>
    </div>
  )
}