import { transformAsync } from '@babel/core';
import getPromptInfoFromThink from './think-prompt-info.js';
import getPromptInfoFromThinkStream from '../think/think-stream-prompt-info.js'
import isJs from '../utils/isJs.js';
import isPathFromReason from '../isPathFromReason.js';

export default async function thinkTransform(code, filePath) {
  const extractPromptInfoPlugin = getPromptInfoFromThink(code, filePath, isJs(filePath))

  const plugins = [extractPromptInfoPlugin]

  if (isPathFromReason(code) && code.includes('reasonStream')) {
    // can potentially use `think`
    const thinkPlugin = getPromptInfoFromThinkStream(code, filePath, isJs(filePath))
    plugins.push(thinkPlugin)
  }

  const result = await transformAsync(code, {
    presets: [
      ['@babel/preset-typescript', { allExtensions: true, isTSX: false }]
    ],
    plugins: plugins,
    sourceType: 'module',
  });

  return result.code
}