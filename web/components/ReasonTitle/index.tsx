import { Suspense } from "react";
import DynamicReasonTitle from "./dynamic";
import StaticReasonTitle from "./static";

export default function ReasonTitle() {
  return (
    <Suspense fallback={<StaticReasonTitle />}>
      <DynamicReasonTitle />
    </Suspense>
  )
}