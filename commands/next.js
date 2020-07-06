const { execSync } = require('child_process')
const pkg = require('../package.json')

const commadsToExecute = `\
yarn init -y && \
yarn add next react react-dom && \
yarn add --dev typescript @types/node @types/react
`

module.exports = (args) => {
  if (args.h || args.help) {
    console.log(`
    $ ${pkg.name} next [ -h || -help ]

    Starts a yarn project and adds all dependencies to create a NextJS website with typescript support:

    ${commadsToExecute}

    `)

    return
  }

  execSync(commadsToExecute)
}
