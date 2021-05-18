const { spawnSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const globalPackage = require('../package.json')

const commadsToExecute = {
  init: ['yarn', ['init', '-y']],
  react: ['yarn', ['add', 'next', 'react', 'react-dom']],
  typescript: [
    'yarn',
    ['add', '--dev', 'typescript', '@types/node', '@types/react'],
  ],
}

function getCommandsToExecute(args) {
  const { init, react, typescript } = commadsToExecute
  const cmds = [init, react]

  if (isTypescript(args)) {
    cmds.push(typescript)
  }

  return cmds
}

function isTypescript(args) {
  return args.t || args.typescript
}

const gitignore = `
.next
.vercel
out
node_modules
yarn.lock
.DS_Store
`

module.exports = (args) => {
  if (args.h || args.help) {
    console.log(`
    $ ${globalPackage.name} next [ -h || --help || -t || --typescript ]

    Starts a yarn project and adds all dependencies to create
    aNextJS website with typescript support (if typescript option is passed):

    ${Object.values(commadsToExecute)
      .map((c) => `${c[0]} ${c[1].join(' ')}`)
      .join('\n    ')}

    It will also add next dev/start/build scripts to package.json

    `)

    return
  }

  for (const command of getCommandsToExecute(args)) {
    spawnSync(command[0], command[1], { stdio: 'inherit' })
  }

  const packageJsonFile = path.join(process.cwd(), 'package.json')

  try {
    var pkg = require(packageJsonFile)
  } catch (err) {
    console.log(err.message)
    process.exit(1)
  }

  if (!pkg.hasOwnProperty('scripts')) {
    pkg.scripts = {
      dev: 'next',
      start: 'next start',
      build: 'next build',
    }
  }

  fs.writeFile(
    packageJsonFile,
    JSON.stringify(pkg, null, 2),
    (err) => err && console.log(err.message)
  )

  fs.writeFile(
    '.gitignore',
    gitignore,
    {
      encoding: 'utf-8',
      flag: 'a',
    },
    (err) => err && console.log(err.message)
  )

  spawnSync('mkdir', ['pages'])
  spawn('touch', [isTypescript(args) ? 'pages/index.tsx' : 'pages/index.js'])
}
