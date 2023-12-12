import GradientHeading from "../GradientHeading";

export default function StaticReasonTitle() {
  return (
    <GradientHeading
      type="snowText"
      className="text-5xl tracking-[-0.125em] w-full flex justify-start shadow-inner h-[52px] hover:brightness-125 "
    >
      RΞASON <span className="hidden sm:inline ml-2">Playground</span>
    </GradientHeading>
  )
}