import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import OAIChatModels from './oai-chat-models'

export default interface ReasonConfig {
  projectName: string;
  
  openai: {
    key: string;
    defaultModel: OAIChatModels;
  };

  anyscale: {
    key: string;
    defaultModel: string;
  }

  openTelemetryExporter: SpanExporter;
}