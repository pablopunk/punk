const { spawnSync } = require('child_process')
const pkg = require('../package.json')

const commadsToExecute = [
  ['yarn', ['init', '-y']],
  ['yarn', ['add', 'next', 'react', 'react-dom']],
  ['yarn', ['add', '--dev', 'typescript', '@types/node', '@types/react']],
]

module.exports = (args) => {
  if (args.h || args.help) {
    console.log(`
    $ ${pkg.name} next [ -h || -help ]

    Starts a yarn project and adds all dependencies to create a NextJS website with typescript support:

    ${commadsToExecute.map((c) => `${c[0]} ${c[1].join(' ')}`).join('\n    ')}
    `)

    return
  }

  for (const command of commadsToExecute) {
    spawnSync(command[0], command[1], { stdio: 'inherit' })
  }
}
