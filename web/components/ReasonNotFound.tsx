import { ChevronRight, Info, Loader2, RotateCw } from "lucide-react";
import GradientHeading from "./GradientHeading";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useState } from "react";
import { Input } from "./ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "./ui/use-toast";



interface Props {
  url: string;
  setURL: (url: string) => void;
  isLoading: boolean;
  fetchEntrypoints: (url?: string) => Promise<null | any[]>;
}

export default function ReasonNotFound({ url, fetchEntrypoints, isLoading, setURL }: Props) {
  const [newUrl, setNewUrl] = useState<string>('')
  const [state, setState] = useState<'url' | 'not-found'>('url')

  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    let nUrl = newUrl.trim()

    if (newUrl.lastIndexOf('/') === newUrl.length - 1) {
      nUrl = newUrl.slice(0, newUrl.length - 1)
    }

    if (nUrl === url || nUrl === '') {
      setState('not-found')
      return
    }

    if (!nUrl.startsWith('http')) {
      toast({ 
        title: 'Invalid URL',
        variant: 'destructive',
        description: 'Your URL needs to start with \'http://\' or \'https://\'',
        duration: 5_000,
       })
       return
    }

    setURL(nUrl)

    let currentUrl = new URL(window.location.href);
    let searchParams = currentUrl.searchParams;
    searchParams.set('url', nUrl);
    currentUrl.search = searchParams.toString();
    history.pushState({}, '', currentUrl);

    const r = await fetchEntrypoints(nUrl)

    if (r === null) {
      setState('not-found')
    }

    setNewUrl(nUrl)
  }

  function refresh() {
    let currentUrl = new URL(window.location.href);
    let searchParams = currentUrl.searchParams;
    searchParams.set('url', url);
    currentUrl.search = searchParams.toString();

    window.location.replace(currentUrl.toString());
  }

  return (
    <div className="h-screen px-5 w-screen fixed flex flex-col justify-center items-center top-0 left-0">
      {state === 'url' && (
        <Card className="w-full max-w-[800px]">
          <CardHeader>
            <CardTitle className="font-normal">
              <GradientHeading type="snowText" className="text-2xl flex items-center">
                Project URL
                <Popover>
                  <PopoverTrigger><Info className="text-zinc-400 ml-2" />
</PopoverTrigger>
                  <PopoverContent>
                    <p className="text-center">
                      By default, its <span className="font-mono text-zinc-300">http://ip-of-computer-running-reason:1704</span>
                    </p>
                  </PopoverContent>
                </Popover>
              </GradientHeading>
            </CardTitle>
            <CardDescription>What is the URL that your RΞASON project is running?</CardDescription>
            <CardTitle className="font-normal"><GradientHeading type="snowText" className="text-lg"></GradientHeading></CardTitle>
            <form onSubmit={handleSubmit}>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder={url}
                className="mb-3"
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                Go
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {!isLoading && <ChevronRight className="h-4 w-4 ml-[3px] mr-[-3px] transition-all duration-150 ease-out" />}
              </Button>
            </form>
          </CardHeader>

          <CardContent>
            <div className="w-full h-[1px] bg-[rgba(255,255,255,0.1)] mb-[0px]" />

            <Accordion type="single" collapsible className="w-full mb-[-13px]">
              <AccordionItem value="item-1" className="border-0 m-0 p-0 py-1 mt-3">
                <AccordionTrigger className="hover:no-underline py-0">
                  <GradientHeading type="snowText" className="text-lg font-normal">Don't know how to start a project?</GradientHeading>
                </AccordionTrigger>

                <AccordionContent>
                  <GradientHeading type="snowText" className="text-md">To start your project:</GradientHeading>
                  <pre className="bg-zinc-900 p-3 rounded-md mt-3">
                    <code className="text-zinc-500">npm run dev</code>
                  </pre>

                  <div className="w-full h-[1px] bg-[rgba(255,255,255,0.1)] mt-[20px] mb-[13px]" />
                  
                  <GradientHeading type="snowText" className="text-md">To create a project:</GradientHeading>
                  <pre className="bg-zinc-900 p-3 rounded-md mt-3">
                    <code className="text-zinc-500">npx use-reason</code>
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

          </CardContent>
        </Card>
      )}

      {state === 'not-found' && (
        <Card className="w-full max-w-[1000px]">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="font-normal"><GradientHeading type="snowText" className="text-2xl">Are you sure your RΞASON project is running?</GradientHeading></CardTitle>
              <CardDescription>Could not find a RΞASON project running</CardDescription>
            </div>

            <Button onClick={refresh} className="group hidden md:inline-flex">Retry<RotateCw className="h-4 w-4 ml-[3px] mr-[-3px] transition-all duration-150 ease-out" /></Button>
          </CardHeader>

          <CardContent>
            <GradientHeading type="snowText" className="text-lg mt-[-15px]">This can happen because:</GradientHeading>
            <ul className="text-zinc-300">
              <li><span className="text-zinc-500">—</span> your project isn't running at all;</li>
              <li><span className="text-zinc-500">—</span> your project isn't running at <span className="font-mono text-sm text-zinc-400">{url}</span>.</li>
            </ul>

            <div className="w-full h-[1px] bg-[rgba(255,255,255,0.1)] mt-[20px] mb-[13px]" />

            <GradientHeading type="snowText" className="text-lg">To start your project:</GradientHeading>
            <pre className="bg-zinc-900 p-3 rounded-md mt-3">
              <code className="text-zinc-500">npm run dev</code>
            </pre>

            <div className="w-full h-[1px] bg-[rgba(255,255,255,0.1)] mt-[20px] mb-[13px]" />
            
            <GradientHeading type="snowText" className="text-lg">To create a project:</GradientHeading>
            <pre className="bg-zinc-900 p-3 rounded-md mt-3">
              <code className="text-zinc-500">npx use-reason</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}