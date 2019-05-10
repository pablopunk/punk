#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const mri = require('mri')

const commandsFolder = path.join(__dirname, 'commands')
const getCommandFile = cmd => path.join(commandsFolder, `${cmd}.js`)
const getCommandsAvailable = () => {
  const files = fs.readdirSync(commandsFolder)
  const commands = files.map(f => f.split('.')[0])

  return commands
}

if (!fs.existsSync(commandsFolder)) {
  console.log('No commands available')
  process.exit(1)
}

const { _: args, help } = mri(process.argv.slice(2))

if (help) {
  console.log(`
  Commands available:

  ${getCommandsAvailable().join('\n  ')}
  `)

  process.exit(0)
}

const commandToExecute = args[0]

if (!commandToExecute) {
  console.log('No command provided')
  process.exit(1)
}

const commandFile = getCommandFile(commandToExecute)

if (!fs.existsSync(commandFile)) {
  console.log(`Unknown command '${commandToExecute}'`)
  process.exit(1)
}

const commandFunction = require(commandFile)
commandFunction()
