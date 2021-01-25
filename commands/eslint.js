const path = require('path')
const fs = require('fs')
const globalPackage = require('../package.json')

const getConfigFile = (ts = false, react = false) => {
  return `env:
  browser: true
  es2021: true
  node: true
extends: 'eslint:recommended' ${
    ts
      ? `
parser: '@typescript-eslint/parser'`
      : ``
  }
parserOptions:
  ecmaVersion: 12
  sourceType: module
  ${
    react
      ? `ecmaFeatures:
    jsx: true`
      : ``
  } ${
    ts || react
      ? `
plugins: ${
          ts
            ? `
  - '@typescript-eslint'`
            : ''
        }${
          react
            ? `
  - react`
            : ''
        }`
      : ``
  }
rules:
  no-unused-vars: error
  `
}

const getDevDeps = (ts = false, react = false) => {
  let devDeps = {
    eslint: '*',
    'eslint-plugin-node': '*',
    'eslint-plugin-promise': '*',
    'eslint-plugin-import': '*',
  }
  if (ts) {
    devDeps = {
      '@typescript-eslint/eslint-plugin': '*',
      '@typescript-eslint/parser': '*',
      ...devDeps,
    }
  }
  if (react) {
    devDeps = {
      'eslint-plugin-react': '*',
      ...devDeps,
    }
  }

  return devDeps
}

const getScripts = (ts = false) => ({
  lint: `eslint --ext .js --ext .jsx${ts ? ' --ext .ts --ext .tsx' : ''} .`,
  'lint-fix': `eslint --fix --ext .js --ext .jsx${
    ts ? ' --ext .ts --ext .tsx' : ''
  } .`,
})

module.exports = (args) => {
  const ts = isTypescript(args)
  const react = isReact(args)
  const devDeps = getDevDeps(ts, react)

  if (args.h || args.help) {
    console.log(`
    $ ${
      globalPackage.name
    } eslint [ -h || --help || -t || --typescript || -r || --react ]

    Sets up eslint config file and scripts
    It will install some devDependencies to your package.json:

        ${Object.keys(devDeps).join('\n        ')}
    `)

    return
  }

  const packageJsonFile = path.join(process.cwd(), 'package.json')
  const eslintConfigFile = path.join(process.cwd(), '.eslintrc.yml')

  try {
    var pkg = require(packageJsonFile)
  } catch (err) {
    console.log(err.message)
    process.exit(1)
  }

  if (!pkg.hasOwnProperty('devDependencies')) {
    pkg.devDependencies = {}
  }
  if (!pkg.hasOwnProperty('scripts')) {
    pkg.scripts = {}
  }

  for (const dep in devDeps) {
    if (!(dep in pkg.devDependencies)) {
      pkg.devDependencies[dep] = devDeps[dep]
    }
  }

  const scripts = getScripts(ts)
  for (const script in scripts) {
    if (!(script in pkg.scripts)) {
      pkg.scripts[script] = scripts[script]
    }
  }

  fs.writeFileSync(
    eslintConfigFile,
    getConfigFile(ts, react),
    (err) => err && console.log(err.message)
  )

  console.log('Created .eslintrc.yml')

  fs.writeFileSync(
    packageJsonFile,
    JSON.stringify(pkg, null, 2),
    (err) => err && console.log(err.message)
  )

  console.log(
    `Installed [${Object.keys(devDeps).join(
      ', '
    )}] as devDependencies. Run 'npm install'`
  )
}

function isTypescript(args) {
  return args.t || args.typescript
}

function isReact(args) {
  return args.r || args.react
}
