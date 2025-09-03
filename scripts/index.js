#!/usr/bin/env node

import { execSync } from 'child_process'
import { blue, cyan, green, red, yellow } from 'colorette'
import fs from 'fs'
import inquirer from 'inquirer'
import path from 'path'

const currentNodeVersion = process.versions.node
const semver = currentNodeVersion.split('.')
const major = parseInt(semver[0], 10)

const minNodeVersion = 20
const recomendationNodeVersion = 22

const defaultProjectName = process.argv[2]
const currentPath = process.cwd()
const originGitRepo = 'https://github.com/masb0ymas'

const selectRepositories = ['express-api', 'express-api-typeorm', 'express-api-sequelize']
const selectPackageManagers = ['yarn', 'pnpm', 'npm']

/**
 *
 * @param {string} prefix
 * @param {string} message
 * @param {Function} colorFn
 */
function logger(prefix, message, colorFn = green) {
  const prefixColor = blue(prefix)
  console.log(`${prefixColor} ${colorFn(message)}`)
}

/**
 *
 * @param {string} prefix
 * @param {string} message
 */
function errorLogger(prefix, message) {
  const prefixColor = blue(prefix)
  console.error(`${prefixColor} ${red(message)}`)
}

/**
 * Validate Node.js version
 */
function validateNodeVersion() {
  const prefix = 'expressjs-cli'

  if (major < minNodeVersion) {
    const message =
      `You are running Node ${currentNodeVersion}.\n` +
      `Create Expressjs Starterkit requires Node ${minNodeVersion} or higher.\n` +
      'Please update your version of Node.'
    errorLogger(prefix, message)
    process.exit(1)
  }

  if (major < recomendationNodeVersion) {
    const message = `Recommendation using node version ${recomendationNodeVersion}`
    logger(prefix, message, yellow)
  }
}

/**
 * Validate command line arguments
 */
function validateArgs() {
  const prefix = 'expressjs-cli'
  if (process.argv.length < 3) {
    logger(prefix, 'You have to provide a name to your app.', blue)
    logger(prefix, 'For example:', blue)
    logger(prefix, '    npx create-expressjs-starterkit my-app', cyan)
    process.exit(1)
  }
}

/**
 * Create project directory
 * @param {string} projectPath
 * @param {string} projectName
 */
function createProjectDirectory(projectPath, projectName) {
  const prefix = 'expressjs-cli'

  try {
    fs.mkdirSync(projectPath)
    logger(prefix, `Successfully created directory ${projectName}`)
  } catch (err) {
    if (err.code === 'EEXIST') {
      const message = `The file ${projectName} already exists in the current directory, please give it another name.`
      errorLogger(prefix, message)
    } else {
      errorLogger(prefix, err.message)
    }
    process.exit(1)
  }
}

/**
 * Install project dependencies
 * @param {string} packageManager
 */
function installDependencies(packageManager) {
  const prefix = 'expressjs-cli'
  logger(prefix, 'Installing dependencies...')

  try {
    switch (packageManager) {
      case 'yarn':
        execSync('yarn')
        break
      case 'pnpm':
        execSync('pnpm install')
        break
      default:
        execSync('npm install')
    }
  } catch (err) {
    errorLogger(prefix, err.message)
    process.exit(1)
  }
}

/**
 * Setup project
 * @param {string} templateChoice
 * @param {string} projectPath
 * @param {string} packageManager
 */
function setupProject(templateChoice, projectPath, packageManager) {
  const prefix = 'expressjs-cli'

  try {
    const repoURL = `${originGitRepo}/${templateChoice}`

    logger(prefix, 'Cloning repository...')
    execSync(`git clone --depth 1 ${repoURL} ${projectPath}`)

    process.chdir(projectPath)

    installDependencies(packageManager)
    logger(prefix, 'Dependencies installed successfully')

    logger(prefix, 'Removing useless files')
    execSync('npx rimraf ./.git')

    logger(prefix, 'The installation is done, this is ready to use!')
  } catch (err) {
    errorLogger(prefix, err.message)
    process.exit(1)
  }
}

// Main execution
validateNodeVersion()
validateArgs()

inquirer
  .prompt([
    {
      name: 'templateChoice',
      type: 'list',
      message: 'What project template would you like to generate?',
      choices: selectRepositories,
    },
    {
      name: 'projectName',
      type: 'input',
      message: 'Project name:',
      validate: function (input) {
        return (
          /^([A-Za-z\-\_\d\.]+)$/.test(input) ||
          'Project name may only include letters, numbers, underscores and hashes.'
        )
      },
      default: defaultProjectName,
    },
    {
      name: 'packageManager',
      type: 'list',
      message: 'Prefer to install dependencies with:',
      choices: selectPackageManagers,
    },
  ])
  .then((answers) => {
    const { templateChoice, projectName, packageManager } = answers
    const projectPath = path.join(currentPath, projectName)

    createProjectDirectory(projectPath, projectName)
    setupProject(templateChoice, projectPath, packageManager)
  })
  .catch((error) => {
    const prefix = 'expressjs-cli'
    errorLogger(prefix, error.message)
    process.exit(1)
  })
