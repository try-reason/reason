import { motion } from 'framer-motion'
import { Check, FunctionSquare, Loader, Loader2 } from "lucide-react";
import { ReasonStepAction } from "../../../hooks/useChat";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion";

interface Props {
  action: Partial<ReasonStepAction['action']>;
  isExecuting: boolean;
}

export default function ActionVisualizer({ action, isExecuting }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -15, filter: 'blur(5px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
    >
      <Accordion type="single" collapsible className="w-[calc(100%+20px)] ml-[-10px] px-[10px] py-2 rounded-lg hover:cursor-pointer bg-zinc-900
        border border-[rgba(255,255,255,0.03)]
      ">
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="py-0 hover:no-underline font-normal text-zinc-200">
            <div className="flex items-center justify-center gap-2">
              {isExecuting && <Loader className="h-4 w-4 mt-[-2px] animate-spin" />}
              {!isExecuting && <Check className="h-4 w-4" />}
              <div>
                <span>{isExecuting ? 'Executing' : 'Executed'}
                <span className="text-zinc-200 font-mono"> {action.name}</span></span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="overflow-x-auto">
            <h3 className="text-md font-normal text-zinc-300 mt-2">INPUT</h3>
            <pre className="text-zinc-400">{JSON.stringify(action.input, null, 2)}</pre>

            <h3 className="text-md font-medium text-zinc-300 mt-2">OUTPUT</h3>
            <pre className="text-zinc-400">{JSON.stringify(action.output, null, 2)}</pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  )
}