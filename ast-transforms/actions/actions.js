import { transformAsync } from '@babel/core';
import isPathFromReason from '../isPathFromReason.js';
import wrapWithActionObserver from "./action-observervability.js";
import getPromptInfoFromAction from './action-prompt-info.js';
import getPromptInfoFromThink from '../think/think-prompt-info.js'
import getPromptInfoFromThinkStream from '../think/think-stream-prompt-info.js'
import isJs from '../utils/isJs.js';


export default async function transformAction(code, filePath) {
  const extractPromptInfoPlugin = getPromptInfoFromAction(code, filePath)

  let plugins = [extractPromptInfoPlugin]

  if (isPathFromReason(code) && code.includes('reason')) {
    // can potentially use `think`
    const thinkPlugin = getPromptInfoFromThink(code, filePath, isJs(filePath))
    plugins.push(thinkPlugin)
  }

  if (isPathFromReason(code) && code.includes('reasonStream')) {
    // can potentially use `think`
    const thinkPlugin = getPromptInfoFromThinkStream(code, filePath, isJs(filePath))
    plugins.push(thinkPlugin)
  }

  plugins.push(wrapWithActionObserver)

  const result = await transformAsync(code, {
    presets: [
      ['@babel/preset-typescript', { allExtensions: true, isTSX: false }]
    ],
    plugins,
    // filename: filePath,
    sourceType: 'module',
  });

  return result.code
}