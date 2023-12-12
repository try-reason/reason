import fs from 'fs'
import ReasonError from '../utils/reasonError.js'
import path from 'path'
import ReasonConfig from '../types/reasonConfig.js';

interface OpenAIConfig {
  defaultModel: string;
  key: string
}

export { OpenAIConfig, ReasonConfig }

let reasonConfig

function isWindows() {
  return process.platform === 'win32'
}

try {
  if (!fs.existsSync('./.reason.config.js')) {
    throw new ReasonError(`Could not find a \`.reason.config.js\` file in the root of your project. Please create one. Learn more at link.docs`, 9018)
  }
  
  let configPath = path.join(process.cwd(), '.reason.config.js')

  // windows really sucks
  if (isWindows()) configPath = `file:///${configPath}`
  const config = await import(configPath)
  reasonConfig = config.default
  
  // const configFile = fs.readFileSync('./.reason-config.json', 'utf8')
  // reasonConfig = JSON.parse(configFile)
} catch (err) {
  throw new ReasonError(`Could not read your \`.reason.config.js\` file to get your default configuration. Please make sure it exists and is valid JSON. Learn more at link.docs`, 9019, { err })
}

export default reasonConfig as ReasonConfig