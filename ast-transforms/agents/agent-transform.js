import { transformAsync } from '@babel/core';
import wrapWithAgentObserver from './agent-observability.js';
import getPromptInfoFromAgent from './agent-prompt-info.js';
import AgentError from './agentError.js';
import path from 'path'
import ReasonError from '../../utils/reasonError.js';

export default async function agentTransform(code, filePath) {
  const state = {
    hasFoundAgentCall: false,
    hasCreatedActionArray: false,
    reason: '',
  }

  const extractPromptInfoPlugin = getPromptInfoFromAgent(code, filePath, state)

  const result = await transformAsync(code, {
    presets: [
      ['@babel/preset-typescript', { allExtensions: true, isTSX: false }]
    ],
    plugins: [extractPromptInfoPlugin, wrapWithAgentObserver],
    sourceType: 'module',
  });

  if (!state.hasFoundAgentCall) {
    throw new ReasonError(`Did not found a \`useAgent()\` call inside the agent ${path.basename(filePath)} in ${filePath}.\n\nThis can happen for a few reasons:\n1) You are not calling the actual function inside your agent — anv every agent needs to call it;\n2) You renamed the fuction when you imported — e.g. \`import { useAgent as anotherName }\` — which is not allowed at the moment.`, 38)
  }

  return result.code
}