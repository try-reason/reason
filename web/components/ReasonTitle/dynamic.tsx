'use client'

import Link from "next/link";
import GradientHeading from "../GradientHeading";

export default function DynamicReasonTitle() {
  function goToMainPage() {
    let currentUrl = new URL(window.location.href);
    let searchParams = currentUrl.searchParams;
    const url = searchParams.get('url');

    if (url) window.location.href = `/?url=${url}`
    else window.location.href = '/'
  }

  return (
    <div onClick={goToMainPage} className="cursor-pointer">
      <GradientHeading
        type="snowText"
        className="text-5xl tracking-[-0.125em] w-full flex justify-start shadow-inner h-[52px] hover:brightness-125 "
      >
        RΞASON <span className="hidden sm:inline ml-2">Playground</span>
      </GradientHeading>
    </div>
  )
}