'use client'

import Markdown from 'react-markdown'
import { useToast } from "@/components/ui/use-toast"
import ActionVisualizer from "../../../components/entrypoint/chat/ActionVisualizer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../components/ui/accordion"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Switch } from "../../../components/ui/switch"
import { Textarea } from "../../../components/ui/textarea"
// import useChat from "../../../hooks/useChat"
// import useReason from "../../../hooks/useReason"
import { useChat, useReason } from 'tryreason-react'
import { useState } from "react"
import { ChevronLeft, Cog, Forward, Loader2, Send } from "lucide-react"
import Link from "next/link"
import GradientHeading from "@/components/GradientHeading"
import RequestInfo from "@/components/entrypoint/request-information/RequestInfo"
import ResponseVisualizer from "@/components/entrypoint/ResponseVisualizer"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { PopoverContent } from "@radix-ui/react-popover"
import { AnimatePresence, motion } from "framer-motion"

interface Props {
  params: Record<string, string>
}

interface IChatMessage {
  role: 'user' | 'reason';
  content: string;
  steps: any[];
}

export default function EntrypointPage({ params, searchParams }: Props & {searchParams: Record<string, any>}) {
  const method = searchParams.method ?? 'POST'

  function getReasonURL() {
    if (searchParams?.url) {
      return searchParams.url
    }

    return 'http://localhost:1704'
  }

  const [body, setBody] = useState<string>('')
  const [headers, setHeaders] = useState([['', '']])
  const { data, reason, onFinish, onError, isLoading, isStreaming } = useReason(`${getReasonURL()}/${params.entrypoint}`)
  
  const { toast } = useToast()

  const [chatMode, setChatMode] = useState<boolean>(false)


  const { input, handleSubmit, handleInputChange, messages, isStreaming: isChatStreaming } = useChat(`${getReasonURL()}/${params.entrypoint}`)

  onFinish(() => {
    toast({ 
      title: 'Request finished',
      duration: 3_000,
     })
  })

  onError(() => {
    toast({ 
      title: 'Request failed',
      variant: 'destructive',
      description: 'Check the terminal for more information',
      duration: 5_000,
     })
  })

  function send() {
    let bodyData = {}
    if (body !== '') {
      try {
        bodyData = JSON.parse(body)
      } catch (err) {
        toast({ 
          title: 'Invalid body',
          description: 'The body must be a valid JSON object',
          variant: 'destructive',
          duration: 5_000,
         })
         console.error(err)
         return
      }
    }

    if (Array.isArray(bodyData)) {
      toast({ 
        title: 'Invalid body',
        description: 'The body cannot be an array',
        variant: 'destructive',
        duration: 5_000,
       })
       return
    }

    const headersData: Record<string, string> = {}
    for (const [key, value] of headers) {
      if (key === '' || value === '') continue
      headersData[key] = value
    }

    reason({ body: bodyData, headers: headersData, method: method })
  }

  return (
    <div className="max-h-full h-full flex flex-col" style={{ width: 'calc(100% + 5rem)', marginLeft: '-2.5rem' }}>
      <div className="flex w-full justify-between items-center px-[2.5rem] mb-5 ">
        <div>
          <GradientHeading type="snowText" className="text-2xl capitalize">{params.entrypoint}</GradientHeading>
          <span className="text-zinc-500">{method} /{params.entrypoint}</span>
        </div>
        <div className="flex flex-row items-end gap-2">
          {chatMode === false && (
            <Button onClick={() => send()} disabled={isLoading || isStreaming}>
                {isLoading || isStreaming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : undefined}
                {!isLoading && !isStreaming && <Forward className="mr-2 h-4 w-4" />}
                Send
            </Button>
          )}
          <div className="flex items-center gap-2 text-zinc-400 z-[10]">
            <Popover>
              <PopoverTrigger>
                <Button variant="ghost" className="px-2">
                  <Cog className="h-6 w-6" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="rounded-lg bg-[linear-gradient(to_bottom_right,_#101010_0%,_#000000_100%)] text-card-foreground border-solid border border-[rgba(255,255,255,0.1)] p-4 min-w-[300px] w-[90vw] max-w-[500px] flex justify-between items-center gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="entrypoint-mode" className="text-lg">Chat mode</Label>
                  <span className="text-sm text-zinc-400">Enable this if this entrypoint is a chat-like agent. <br></br><a href="http://link.to" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Learn more</a></span>
                </div>
                <Switch checked={chatMode} onCheckedChange={e => setChatMode(!chatMode)} id="entrypoint-mode" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {chatMode === false && (
        <div className="px-10 h-full relative z-[0]">
          <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3
          ">
            <RequestInfo headers={headers} setHeaders={setHeaders} body={body} setBody={setBody} />
            <ResponseVisualizer data={data} />
          </div>
        </div>
      )}

      {chatMode === true && (
        <div className="h-[100vh] w-[calc(100%-40px)] ml-[20px] rounded-lg bg-[linear-gradient(to_bottom_right,_#101010_0%,_#000000_100%)] flex flex-col overflow-hidden border-solid border border-[rgba(255,255,255,0.1)]">
          <div className="rounded-tl-lg rounded-tr-lg flex-1 overflow-auto flex flex-col" style={{ border: '1px solid rgba(255, 255, 255, 0.1)'}}>
            {messages.map((message, idx) => (
              <div key={idx}>
                {message.role === 'user' && (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)' }} className="p-4">
                    <GradientHeading type="snowText" className="text-xl capitalize">YOU</GradientHeading>
                    <p className="mt-[-2px] whitespace-pre-line">{message.content}</p>
                  </div>
                )}

                {message.role === 'reason' && (
                  <div className="p-4 bg-[240 10% 3.9%]">
                    <div className="flex items-center gap-1">
                      <AnimatePresence mode="popLayout">
                        {isChatStreaming && idx === messages.length - 1 && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut', delay: 0.1 }}
                          >
                            <Loader2 className="h-4 w-4 mt-[-2px] animate-spin" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <motion.div layout="position" layoutId={`reason-header-${idx}`}>
                        <GradientHeading type="snowText" className="text-xl capitalize tracking-[-0.125em] w-[100px]">RΞASON</GradientHeading>
                      </motion.div>
                    </div>
                    {/* <pre>{JSON.stringify(message, null, 2)}</pre> */}
                    <div className="flex flex-col gap-2 mt-1">
                      {message.steps?.map((step, stepIdx) => (
                        <div>
                          {step.message && (
                            // <p className="whitespace-pre-line">{step?.message.content}</p>
                            <Markdown>{step?.message.content}</Markdown>
                            // <div>
                            //   {step.message.content.split('').map((char, idx) => (
                            //     <>
                            //       {char === '\n' && <br />}
                            //       {char === ' ' && <>&nbsp;</>}
                            //       {char !== '\n' && char !== ' ' && (
                            //         <motion.span
                            //           key={idx}
                            //           className="whitespace-pre-line relative inline-block text-zinc-200"
                            //           initial={{ opacity: 0, x: -10, filter: 'blur(5px)'  }}
                            //           animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            //           transition={{ type: 'tween', duration: 0.3, ease: 'easeOut', delay: 0.15 }}
                            //         >
                            //           {char === '\n' ? <br />
                            //             : char === ' ' ? <>&nbsp;</> : char}
                            //         </motion.span>
                            //       )}
                            //     </>
                            //   ))}
                            // </div>
                          )}

                          {step.action && <ActionVisualizer action={step.action} isExecuting={stepIdx === (message.steps?.length ?? 1) - 1 && isChatStreaming && idx === messages.length - 1} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full h-[1px] bg-zinc-900"></div>
              </div>
            ))}
          </div>

          <div className="rounded-br-lg rounded-bl-console.log();
          " style={{ border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.03)' }}>
            <form className="flex gap-2 items-center" onSubmit={handleSubmit}>
              <Textarea placeholder="Insert you message here..." rows={3} value={input} onChange={handleInputChange} className="bg-transparent border-none hover:border-none hover:outline-none focus-visible:shadow-[none_!important]" />
              <Button type="submit" className="group hover:bg-transparent" variant="ghost"><Send className="w-5 h-5 text-zinc-400 group-hover:text-white" /></Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}