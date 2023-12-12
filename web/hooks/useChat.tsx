import StreamDecoder, { dividerEnd, dividerStart, errorIdentifier } from "@/reason/StreamDecoder";
import { memo, useRef, useState } from "react";

async function* fetchReason(entrypoint: string, body: Record<string, any> = {}, headers: Record<string, any> = {}) {
  const res = await fetch(`http://127.0.0.1:1704/${entrypoint}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  })

  const stream = res.body
  if (!stream) throw new Error('No stream')
  const reader = stream.getReader()

  let result = await reader.read()

  let buffer = ''

  while (!result.done) {
    const { value } = result

    const text = new TextDecoder("utf-8").decode(value)
    buffer += text

    if (buffer.indexOf(errorIdentifier) !== -1) {
      throw new Error('The server returned an error.')
    }

    const texts = buffer.split(dividerStart)

    for (let t of texts) {
      if (t === '') continue

      if (t.endsWith(dividerEnd)) {
        yield t.replace(dividerEnd, '')
      } else {
        buffer = t
        break
      }
    }
    
    if (texts[texts.length - 1].endsWith(dividerEnd)) {
      buffer = ''
    }

    result = await reader.read()
  }
}

interface UserChatMessage {
  role: 'user';
  content: string;
}

interface ReasonStepMessage {
  message: {
    content: string;
    done: boolean
  }
}

interface ReasonStepMessage {
  message: {
    content: string;
    done: boolean
  }
}

interface ReasonStepAction {
  action: {
    name: string;
    input: Record<string, any>
    output: any;
  }
}

interface ReasonStepMessageAndAction {
  message?: ReasonStepMessage['message'];
  action?: ReasonStepAction['action'];
}

type ReasonStep = ReasonStepMessageAndAction

export type { ReasonStep, ReasonStepAction }

interface ReasonChatMessageInProgress {
  steps?: ReasonStep[];
  memory_id?: string;
  [key: string]: any;
}

interface ReasonChatMessageDone {
  steps: ReasonStep[];
  memory_id: string;
  [key: string]: any;
}

type ReasonChatMessage = ReasonChatMessageDone | ReasonChatMessageInProgress

interface BaseReasonChatMessageInProgress {
  role: 'reason';
  done: false
}

interface BaseReasonChatMessageDone {
  role: 'reason'
  done: true
}

type ChatMessage<T = ReasonChatMessage> = UserChatMessage | (Partial<T> & BaseReasonChatMessageInProgress) | (T & BaseReasonChatMessageDone)

interface ChatConfig {
  body: Record<string, any>;
  headers: Record<string, any>;
}

export default function useChat<T = ReasonChatMessage>(entrypoint: string, config: Partial<ChatConfig> = {}) {
  const [messages, setMessages] = useState<ChatMessage<T>[]>([])
  const [input, setInput] = useState<string>('')
  const [memoryID, setMemoryID] = useState<string>('')

  function clear() {
    setMessages([])
    setMemoryID('')
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    console.log('asiodasiodasioduasioduaiosdsa')
    e.preventDefault()
    if (!memoryID) {
      clear()
    }
    send(input)
    setInput('')
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setInput(e.target.value)
  }

  const onFinishCallback = useRef<(() => void) | null>(null);
  const onErrorCallback = useRef<(() => void) | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isStreaming, setIsStreaming] = useState<boolean>(false)

  function onFinish(fn: () => void) {
    onFinishCallback.current = fn
  }
  
  function onError(fn: () => void) {
    onErrorCallback.current = fn
  }

  async function send(input: string) {
    try {
      setIsLoading(true)

      let message: ReasonChatMessage = {
        role: 'reason',
        done: false
      }
      let _messages = [...messages, { role: 'user', content: input }, message] as any
      setMessages(_messages)

      let decoder = new StreamDecoder()
  
      let gen = fetchReason(entrypoint, {...config.body, input, memory_id: memoryID || undefined}, config.headers)
      let result = await gen.next()
      setIsLoading(false)
      setIsStreaming(true)
      while (!result.done) {
        const { value } = result
        
        const obj = {...decoder.decode(value)}
        
        message = {
          ...message,
          ...obj
        }
        _messages[_messages.length - 1] = message
        setMessages([..._messages])
  
        result = await gen.next()
      }

      if (!message.memory_id) {
        console.error('No Memory ID was returned from the server. Make sure the server is returning a `memory_id`.')
      } else setMemoryID(message.memory_id)
      message.done = true as any
      _messages[_messages.length - 1] = message
      setMessages([..._messages])
  
      if (onFinishCallback.current) {
        onFinishCallback.current();
      }
    } catch (err) {
      console.error(err)
      if (onErrorCallback.current) {
        onErrorCallback.current();
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  return {
    input,
    handleInputChange,
    handleSubmit,
    memoryID,
    messages,
    clear,
    onFinish,
    onError,
    isLoading,
    isStreaming,
  }
}