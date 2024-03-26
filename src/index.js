import { marked } from 'marked'
import fs from 'fs/promises'
import core from '@actions/core'
import github from '@actions/github'
import handlebars from 'handlebars'
import path from 'path'
import config from '../blog-config.js'

// register handlebar helpers from config
Object.entries(config.handlebarsHelpers).forEach(([name, fn]) => handlebars.registerHelper(name, fn))

// save this to switch between the two
const defaultHandlebarsEscapeExpression = handlebars.Utils.escapeExpression;

const templateData = config.staticData

// 1. pick up and parse all of the issues files
// TODO probably want to migrate the issues to a different branch or something?

let issuesAsJsonFilenames = []
try {
  issuesAsJsonFilenames = await fs.readdir(path.resolve(config.issuesDir))
} catch (e) {
  // TODO output this warning to the job summary/warnings
  console.warn(`Cannot read issues directory '${path.resolve(config.issuesDir)}'. No issues will be templated.`)
}

templateData.issues = []
for (const issuesAsJsonFilename of issuesAsJsonFilenames) {
  const issueAsJson = JSON.parse(await fs.readFile(path.resolve(config.issuesDir, issuesAsJsonFilename), 'utf8'))
  // TODO be more careful here as marked is particular about the input
  if (issueAsJson.body) templateData.issues.push(issueAsJson)
}
console.log(`Parsed ${templateData.issues.length} issues.`)
// TODO where do we handle the closed/vs open logic? still want to use labels for something


// 3. ingest all of the templates into a heirarchy

const walkFs = async (dir, relative=false) => (
  await Promise.all((await fs.readdir(path.resolve(dir))).map(async (file) => {
    file = path.resolve(dir, file)
    const stat = await fs.stat(file)
    if (stat && stat.isDirectory()) return await walkFs(file, relative)
    if (relative) return path.relative(relative, file)
    return file
  }))
).flat(Infinity)

let rawFilepaths = []
try {
  rawFilepaths = await walkFs(config.templateDir, config.templateDir)
} catch (e) {
  // TODO output this error to the job summary/error
  console.error(`Cannot read templates directory '${path.resolve(config.templateDir)}'`)
  throw e
}


// matches handlebar opening tags in the filepaths
const openBlockRe = /\{\{#(\w+)\s*(.*?)\}\}/g

// transform the templates
const outputFiles = []
for (const rawFilepath of rawFilepaths) {
  const template = await fs.readFile(path.resolve(config.templateDir, rawFilepath), 'utf8')

  /* NOTE Ok, so time for a hacky solution.
          We want to be able to template the file structure AND the files themselves.
          If we just template the file structure and the files separately, when we template the files
          they won't be properly scoped for the file structure's implied templates.
          So the solution here is to template the file path and the file itself together, compile,
          and split them back apart. This requires some nasty string parsing on my part.
  */

  /* TODO this whole section is kinda nasty: the block regexes, string interps, etc.
          could use a second pass for refinement and robustness
  */

  /* NOTE because we can't have / in a filename, blocks in filenames only have opening tags
          this extracts them and prepends them to the entire filepath and appends the closing tags
  */
  const templateBlocks = Array.from(rawFilepath.matchAll(openBlockRe))
  const preppedFilepath = rawFilepath.replace(openBlockRe, '')

  const combinedTemplate =
    templateBlocks.map(b => `{{#${b[1]} ${b[2]}}}`).join()
    + `<%%%%>${preppedFilepath}<%%%%>${template}<%%%%>`
    + templateBlocks.map(b => `{{/${b[1]}}}`).join()

  /* We compile and evaluate the template that includes the filepaths and directives as well as the file content.
     Then we split this back apart into potentially more than one file and write that out.
  */
  Array.from(
    handlebars
      .compile(combinedTemplate)(templateData)
      .matchAll(/<%%%%>(?<filepath>(?:\s|.)*?)<%%%%>(?<content>(?:\s|.)*?)<%%%%>/g)
  ).forEach(match => outputFiles.push({ ...match.groups }))
}

// write out the files
const OUTPUT_DIR = `build`

outputFiles.forEach(async ({ filepath, content }) => {
  filepath = path.resolve(OUTPUT_DIR, filepath)
  await fs.mkdir(path.dirname(filepath), { recursive: true })
  await fs.writeFile(filepath, content)
})

// TODO maybe make this a workflow step
// copy public files to output directory
await fs.cp(path.resolve(config.publicDir), path.resolve(OUTPUT_DIR), { recursive: true })

// TODO need to figure out how to template files to be able to nest

// TODO need to figure out how to go over the files one by one when theyre being templated


// core.setOutput("commit-message", "Generated blog posts from issues")