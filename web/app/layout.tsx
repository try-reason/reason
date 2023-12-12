import Image from 'next/image'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import GradientHeading from '@/components/GradientHeading'
import Balancer from 'react-wrap-balancer'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import ReasonTitle from '@/components/ReasonTitle'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RΞASON Playground',
  description: 'RΞASON playground',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  function goToMainPage() {
    let currentUrl = new URL(window.location.href);
    let searchParams = currentUrl.searchParams;
    const url = searchParams.get('url');

    if (url) window.location.href = `/?url=${url}`
    else window.location.href = '/'
  }

  return (
    <html lang="en" className="h-full">
      <body className={inter.className + ' dark h-full w-full bg-[#000203]'}>
        <div className="flex justify-between items-center sticky top-10 px-5 sm:px-10 mb-5 cursor-pointer">
          <ReasonTitle />

          <a href="https://docs.tryreason.dev" target="_blank" rel="noopener noreferrer" className="flex items-center
            transition-all duration-200 ease-out hover:brightness-150 group underline-offset-2 hover:underline
          ">
            <ExternalLink size={16} className="mt-[-1px] mr-[5px] text-zinc-400 transition-all duration-200 ease-out" />
            <GradientHeading type="snowText">DOCS</GradientHeading>
          </a>
        </div>

        <div className="w-full h-[calc(100%-72px)] overflow-x-hidden p-5 sm:p-10 mt-8 sm:mt-0">
          {children}
        </div>

        <Toaster />  

        <div className="fixed w-full flex items-center justify-center z-[-1] h-screen top-0 pt-[35vh] overflow-hidden">
          <div className="relative min-w-[700px] w-[100000px] max-w-[min(100vw,_2000px)] aspect-[1.165]">
            <Image
              src="/bg4.jpg"
              alt="Background image"
              fill
              style={{ background: 'black' }}
              priority
              placeholder='blur'
blurDataURL='data:image/png;base64,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'
            />
          </div>
        </div>
      </body>
    </html>
  )
}
