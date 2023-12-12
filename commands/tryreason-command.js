#!/usr/bin/env node
import {exec, execSync, spawn} from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, sep } from 'path';
import fse from 'fs-extra'
import fs from 'fs'
import c from 'ansi-colors'
import enq from 'enquirer'

console.log(c.gray.italic.bold(`
    WELCOME TO
   ______ _______ _______ _______ _______ _______ 
  |   __ \\ _____ |   _   |     __|       |    |  |
  |      < _____ |       |__     |   -   |       |
  |___|__|_______|___|___|_______|_______|__|____|
                                                  
                  THE MINIMALISTIC LLM FRAMEWORK
`));

const commandDir =  dirname(fileURLToPath(import.meta.url));

let projectDir = null
let isDebug = false
if (process.argv.indexOf('--debug') !== -1) isDebug = true
else if (process.argv.length >= 3) projectDir = process.argv[2]


const options = {
  name: null,
  oaiKey: null,
  packageManager: null,
}

async function projectname() {
  function isValidString(str) {
    const regex = /^[A-Za-z0-9-]+$/;
    return regex.test(str);
  }

  let prompt = new enq.Input({
    message: 'What is the name of your project?',
    initial: 'my-reason-app',
    validate: input => {
      if (input.trim().length === 0) {
        return 'Project name cannot be empty'
      }
  
      if (input.includes(' ')) {
        return 'Project name cannot contain spaces'
      }
  
      if (!isValidString(input)) {
        return 'Project name can only contain letters, numbers and dashes'
      }
  
      return true
    },
    styles: {
      success: c.gray.bold,
    }
  })
  
  return prompt.run()
}

async function oaikey() {
  let prompt = new enq.Password({
    message: 'What is the OpenAI API key this project will use? (you can leave empty and add it later in .env file)',
    styles: {
      success: c.gray.bold,
      selection: c.gray.bold,
      select: c.gray.bold,
      primary: c.gray.bold,
      em: c.gray.bold,
    },
  })
  const key = await prompt.run()
  if (key.trim().length === 0) {
    return null
  }
  return key
}

async function packagemanager() {
  const prompt = new enq.Select({
    message: 'Which package manager to use?',
    choices: ['npm', 'pnpm', 'yarn'],
    styles: {
      primary: c.gray.bold,
      success: c.gray.bold,
      em: c.cyan.underline,
    },
  })
  return prompt.run()
}

async function main() {
  options.name = await projectname()
  options.oaiKey = await oaikey()
  options.packageManager = await packagemanager()
  
  console.log()
  console.log(c.bold('Setting up your project now...'))

  await setupProject()
  process.exit(0)
}

async function setupProject() {
  const sampleDir = join(commandDir, '..', 'sample')
  if (!projectDir) projectDir = options.name
  const destDir = join(process.cwd(), projectDir)

  let install
  switch (options.packageManager) {
    case 'yarn': {
      install = `yarn`
      break
    }
    default: {
      install = `${options.packageManager} install`
      break
    }
  }

  if (isDebug) {
    console.log('sampleDir', sampleDir)
    console.log('destDir', destDir)
    console.log('projectDir', projectDir)
    console.time('copying')
  }
  fse.copySync(sampleDir, projectDir)
  if (isDebug) console.timeEnd('copying')

  changeFiles(options, destDir)
  
  // const command = spawn(`cd ${destDir} && pwd && echo '${install}'`, { shell: true, stdio: 'inherit' })
  // const command = exec(`cd ${destDir} && ${install}`)
  const child = spawn(`cd ${destDir} && ${install}`, { shell: true, stdio: 'inherit' });
  
  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code !== 0) {
        console.log(c.red.bold(`\n\nSomething went wrong. Please try again.`))
        process.exit(1)
      }

      console.log(c.green.bold(`\n${options.name} setup completed!`))
      console.log((`To run, go to its directory and run ${c.bold(`${options.packageManager} ${options.packageManager === 'yarn' ? '' : 'run '}dev`)}`))
      process.exit(0)
    });
    // command.stdout.pipe(process.stdout)
    // command.stderr.pipe(process.stderr)
    // command.on('exit', (code) => {
    //   if (code !== 0) {
    //       console.log(c.red.bold(`\n\nSomething went wrong. Please try again.`))
    //       process.exit(0)
    //     }
  
    //     console.log(c.green.bold(`\n\n${options.name} setup completed!`))
    //     console.log((`To run, go to its directory and run ${c.bold(`${options.packageManager} run dev`)}`))
    //     process.exit(1)
    // })
  })
}

function changeFiles({ name, oaiKey }, destDir) {
  const configPath = join(destDir, '.reason.config.js')
  let configContent = fs.readFileSync(configPath, 'utf8')
  if (oaiKey) configContent = configContent.replace('<your-openai-key>', oaiKey)
  configContent = configContent.replace('<your-project-name>', name)
  fs.writeFileSync(configPath, configContent, 'utf8')
}

main()
