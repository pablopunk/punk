const { execSync } = require('child_process')

module.exports = (args) => {
  execSync(`
    yarn init -y && \
    yarn add next react react-dom && \
    yarn add --dev typescript @types/node @types/react
  `)
}
