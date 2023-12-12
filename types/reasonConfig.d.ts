import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { OAIChatModels } from "./services/getChatCompletion";

export default interface ReasonConfig {
  projectName: string;
  
  openai: {
    key: string;
    defaultModel: OAIChatModels;
  };

  openTelemetryExporter: SpanExporter;
}