'use client'

import GradientHeading from "@/components/GradientHeading";
import Balancer from 'react-wrap-balancer'
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ChevronRight, Loader2, RotateCcw, RotateCw } from "lucide-react"
import Link from "next/link";
import { useEffect, useState } from "react";
import ReasonNotFound from "@/components/ReasonNotFound";

interface Entrypoint {
  prettyName: string;
  serverPath: string;
  method: string;
}

export default function Home({ params, searchParams }: {params: { slug: string }; searchParams: Record<string, any>}) {
  const [entrypoints, setEntrypoints] = useState<Entrypoint[] | null | 'not-connected'>(null)

  const [newUrl, setNewUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  function getReasonURL() {
    if (newUrl !== '') {
      return newUrl
    }

    if (searchParams?.url) {
      return searchParams.url
    }

    return 'http://localhost:1704'
  }

  async function fetchEntrypoints(url?: string) {
    setIsLoading(true)
    try {
      const res = await fetch(`${url ? url : getReasonURL()}/__reason_internal__/entrypoints`, {
        method: 'GET',
        cache: 'no-cache'
      })
  
      if (res.ok) {
        const data = await res.json()
        setEntrypoints(data)
        return data
      } else {
        setEntrypoints('not-connected')
        return null
      }
    } catch {
      setEntrypoints('not-connected')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEntrypoints()
  }, [])

  return (
    <div>
      {entrypoints === null && (
        <div className="h-screen w-screen fixed flex flex-col justify-center items-center top-0 left-0 mt-[60px]">
          <Loader2 className="mb-2 h-9 w-9 animate-spin text-zinc-300" />
          <GradientHeading type="snowText" className="text-lg md:text-2xl">Connecting to your RΞASON project...</GradientHeading>
        </div>
      )}

      {entrypoints === 'not-connected' && (
        <ReasonNotFound url={getReasonURL()} setURL={setNewUrl} isLoading={isLoading} fetchEntrypoints={fetchEntrypoints} />
      )}

      {Array.isArray(entrypoints) && (
        <>
          <GradientHeading type="snowText" className="text-2xl">Entrypoints</GradientHeading>
          <span className="text-zinc-500">Learn more about entrypoints <a href="https://docs.tryreason.dev" className="underline underline-offset-2 transition-colors hover:text-zinc-300" target="_blank" rel="noopener noreferrer">here</a>.</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5">
            {entrypoints.map((entrypoint) => (
              <Card key={entrypoint.serverPath}>
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="capitalize">{entrypoint.prettyName}</CardTitle>
                    <CardDescription><span className="font-mono">{entrypoint.method}</span> {entrypoint.serverPath}</CardDescription>
                  </div>

                  <Link href={`entrypoint/${entrypoint.serverPath.replace('/', '')}?url=${getReasonURL()}&method=${entrypoint.method}`}>
                    <Button className="group">Try it<ChevronRight className="h-4 w-4 group-hover:ml-[3px] group-hover:mr-[-3px] transition-all duration-150 ease-out" /></Button>
                  </Link>
                </CardHeader>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
