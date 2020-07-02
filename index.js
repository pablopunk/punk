#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const mri = require('mri')
const { cyan, red, bold } = require('kleur')

const commandsFolder = path.join(__dirname, 'commands')
const getCommandFile = (cmd) => path.join(commandsFolder, `${cmd}.js`)
const getCommandsAvailable = () => {
  const files = fs.readdirSync(commandsFolder)
  const commands = files.map((f) => f.split('.')[0])

  return commands
}

if (!fs.existsSync(commandsFolder)) {
  console.log('No commands available')
  process.exit(1)
}

const args = mri(process.argv.slice(2))
const { _: mainArgs, help, h } = args

if (mainArgs.length < 1) {
  if (help || h) {
    console.log(`
    Commands available:

    ${getCommandsAvailable().join('\n    ')}
    `)

    process.exit(0)
  }
}

const commandToExecute = mainArgs[0]

if (!commandToExecute) {
  console.log(red('No command provided'))
  console.log(bold(cyan('\nOpinionated configs on the go')))
  console.log(cyan('Visit https://github.com/pablopunk/punk for more info\n'))
  process.exit(1)
}

const commandFile = getCommandFile(commandToExecute)

if (!fs.existsSync(commandFile)) {
  console.log(`Unknown command '${commandToExecute}'`)
  process.exit(1)
}

const commandFunction = require(commandFile)
commandFunction(args)
