import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Body from "./Body";
import Header from "./Header";

interface Props {
  body: string;
  setBody: (body: string) => void;

  headers: string[][];
  setHeaders: (headers: string[][]) => void;
}

export default function RequestInfo({ body, setBody, headers, setHeaders }: Props) {
  return (
    <div className="h-full">
      <Tabs defaultValue="headers" className="h-full flex flex-col gap-2">
        <div className="outline outline-1 outline-[rgba(255,255,255,0.1)] rounded-md">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
          </TabsList>
        </div>

          <TabsContent value="body" className="h-full">
            <Body body={body} setBody={setBody} />
          </TabsContent>
          <TabsContent value="headers" className="h-full">
            <div className="bg-[linear-gradient(to_bottom_right,_#101010_0%,_#000000_100%)]
              rounded-lg px-3 border-solid border border-[rgba(255,255,255,0.1)]
              flex flex-col
              h-full
              pt-2
            ">
              <Header headers={headers} setHeaders={setHeaders} />
            </div>
          </TabsContent>
      </Tabs>
    </div>
  )
}