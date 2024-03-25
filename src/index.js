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
  if (issueAsJson.body) {
    // TODO be more careful here as marked is particular about the input
    // TODO commented out to be written in helpers file
    // issueAsJson.bodyAsHtml = marked(issueAsJson.body)
    // TODO should the markdown be templated here as well? leaves the ability for local embeddings
    // could also be templated later, though that starts to make it challenging to sort out the root
    templateData.issues.push(issueAsJson)
  }
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

const rawFilepaths = await walkFs(config.templateDir, config.templateDir)
// TODO output this error to the job summary/error
// TODO handle this error better
// } catch (e) {
//   console.error(`Cannot read templates directory '${path.resolve(config.templateDir)}'`)
//   throw e
// }


// matches handlebar opening tags in the filepaths
const openBlockRe = /\{\{#(\w+)\s*(.*?)\}\}/g

// transform the template filepaths as templates themselves
// generate list of all files to be templated
const outputFiles = []
for (const rawFilepath of rawFilepaths) {
  /* NOTE this is hacky, but don't really see a better way to make it work
          we want to make the file names URL safe
          originally, I was going to insert sub-expressions to chain these with user-defined helpers
          https://handlebarsjs.com/guide/expressions.html#subexpressions
          e.g. user-defined          transformed
               {{title}}          => {{urlencode (title)}}
               {{slugify title}}  => {{urlencode (slugify (title))}}
          HOWEVER, Handlebars doesn't seem to support empty sub-expressions
          so I'm just overriding their internal escapeExpression function used for HTML-escaping
          ALSO using handlebars.create() does not stop it from polluting the global handlebars instance
          🫠
  */
  handlebars.Utils.escapeExpression = encodeURIComponent

  /* NOTE because we can't have / in a filename, blocks in filenames only have opening tags
          this extracts them and prepends them to the entire filepath and appends the closing tags
  */
  /* TODO this whole section is kinda nasty:
          insertion of the newline, the line splitting, the block regexes, etc.
          could use a second pass for refinement and robustness
  */
  const templateBlocks = Array.from(rawFilepath.matchAll(openBlockRe))
  const preppedFilepath =
    templateBlocks.map(b => `{{#${b[1]} ${b[2]}}}`).join()
    + rawFilepath.replace(openBlockRe, '')
    + '\n'
    + templateBlocks.map(b => `{{/${b[1]}}}`).join()

  const template = await fs.readFile(path.resolve(config.templateDir, rawFilepath), 'utf8')

  // reset the escapeExpression function
  handlebars.Utils.escapeExpression = defaultHandlebarsEscapeExpression

  handlebars
    .compile(preppedFilepath)(templateData)
    .trim()
    .split('\n')
    .forEach(filepath => outputFiles.push({
      filepath,
      template,
      content: handlebars.compile(template)(templateData)
    }))
}

// console.log(outputFiles)

const OUTPUT_DIR = `build`

outputFiles.forEach(async ({ filepath, content }) => {
  filepath = path.resolve(OUTPUT_DIR, filepath)
  await fs.mkdir(path.dirname(filepath), { recursive: true })
  await fs.writeFile(filepath, content)
})

// last step is to just copy over the public directory
await fs.cp(path.resolve(config.publicDir), path.resolve(OUTPUT_DIR), { recursive: true })

// TODO need to iterate over

// TODO need to figure out how to template files to be able to nest

// TODO need to figure out how to go over the files one by one when theyre being templated

// so first step is just to template out the files, without templating their urls
// THEN we template the urls? need to sync them, weird


core.setOutput("commit-message", "Generated blog posts from issues")