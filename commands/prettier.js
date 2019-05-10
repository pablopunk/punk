const path = require('path')
const fs = require('fs')

const additions = {
  husky: {
    hooks: {
      'pre-commit': 'pretty-quick --staged'
    }
  },
  prettier: {
    semi: false,
    singleQuote: true,
    tabWidth: 2
  }
}

module.exports = () => {
  const packageJsonFile = path.join(process.cwd(), 'package.json')

  try {
    var pkg = require(packageJsonFile)
  } catch (err) {
    console.log(err.message)
    process.exit(1)
  }

  for (const field in additions) {
    if (field in pkg) {
      console.log(`'${field}' field will be modified in package.json`)
    }

    pkg[field] = additions[field]
  }

  fs.writeFile(
    packageJsonFile,
    JSON.stringify(pkg, null, 2),
    err => err && console.log(err.message)
  )
}
