import { OAIChatModels } from '../services/getChatCompletion';

interface ThinkConfig {
  model?: OAIChatModels;
  validation_strategy?: 'ignore' | 'error' //| 'retry';
  temperature?: number;
  max_tokens?: number;
}

interface OAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export { ThinkConfig, OAIMessage }