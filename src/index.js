import fs from 'fs/promises'
import * as core from '@actions/core'
import * as github from '@actions/github'
import handlebars from 'handlebars'
import path from 'path'

/*=============================================*/
// TODO make this more like a normal config where it's overrideable/zippable with a default
// TODO currently this is getting build in ncc so we need to make it standalone and imported in the workflow
// TODO move config into separate file and support stuff
// import config from '../blog-config.js'
import slugify from 'slugify'
import { marked } from 'marked'

const config = {
  templateDir: `template`,
  issuesDir: `issues`,
  publicDir: `public`,
  handlebarsHelpers: {
    helperMissing: (...args) => {
      // TODO optionally fail the task on failed handlebar evaluation
      core.warning(`Handlebars helper missing: ${JSON.stringify(args)}`, { title: github.job?.name })
      // core.warning(`Handlebars helper missing: ${args.reduce((a, c) => a || c.name)}`, { title: github.job?.name })
    },
    urlencode: encodeURIComponent,
    slugify: (value) => slugify(value, {
      lower: true,
      strict: true
    }),
    md: marked,
    'inline-md': marked.parseInline
    // file: (relPath) => {
    //   // TODO stubbed
    // }
  },
  staticData: {
    title: `My Blog`,
    description: `A blog about things.`
  }
}
/*=============================================*/

// register handlebar helpers from config
Object.entries(config.handlebarsHelpers).forEach(([name, fn]) => handlebars.registerHelper(name, fn))

// get list of issue files
const issueJsonFilenames = await fs.readdir(path.resolve(config.issuesDir)).catch(e => {
  core.warning(`Cannot read issues directory`, { title: github.job?.name })
  console.error(e)
  return []
})

const templateData = config.staticData

// read issue files
const issueFiles = issueJsonFilenames
  .filter((filename) => filename.endsWith('.json'))
  .map(filename => fs.readFile(path.resolve(config.issuesDir, filename), 'utf8'))

// parse issue files
templateData.issues =
  (await Promise.all(issueFiles)
    .catch(e => {
      core.warning(`Cannot read issue files`, { title: github.job?.name })
      console.error(e)
      return []
    }))
    .map(file => JSON.parse(file))
    .filter(f => f)

const publishableIssueLog = `Parsed ${templateData.issues.length} issue${templateData.issues.length === 1 ? 's' : ''} to publish.`
templateData.issues.length ? core.notice(publishableIssueLog) : core.warning(publishableIssueLog)

const walkFs = async (dir, relative=false) => (
  await Promise.all(
    (await fs.readdir(path.resolve(dir)))
      .map(async (file) => {
        file = path.resolve(dir, file)
        const stat = await fs.stat(file)
        if (stat && stat.isDirectory()) return await walkFs(file, relative)
        if (relative) return path.relative(relative, file)
        return file
      })
  )
).flat(Infinity)

// discover site template
const rawFilepaths = await walkFs(config.templateDir, config.templateDir).catch(() => {
  core.setFailed(`Cannot read templates directory '${config.templateDir}'`)
})

// TODO i don't really like this
if (process.exitCode) {
  process.exit(process.exitCode)
}

// matches handlebar opening tags in the filepaths
const openBlockRe = /\{\{#(\w+)\s*(.*?)\}\}/g

/* TODO this whole section is kinda nasty: the block regexes, string interps, etc.
        could use a second pass for refinement and robustness
*/
// transform the templates
const outputFiles = []
for (const rawFilepath of rawFilepaths) {
  const template = await fs.readFile(path.resolve(config.templateDir, rawFilepath), 'utf8')

  /* NOTE because we can't have / in a filename, blocks in filenames only have opening tags
          this extracts them and prepends them to the entire filepath and appends the closing tags
  */
  const templateBlocks = Array.from(rawFilepath.matchAll(openBlockRe))
  const preppedFilepath = rawFilepath.replace(openBlockRe, '')


  /* NOTE Ok, so time for a hacky solution.
          We want to be able to template the file structure AND the files themselves.
          If we just template the file structure and the files separately, when we template the files
          they won't be properly scoped for the file structure's implied templates.
          So the solution here is to template the file path and the file itself together, compile,
          and split them back apart. This requires some nasty string parsing on my part.
  */
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

// default directory for upload-pages-artifact, why not
const OUTPUT_DIR = `_site`

// write out the resulting compiled files
outputFiles.forEach(async ({ filepath, content }) => {
  filepath = path.resolve(OUTPUT_DIR, filepath)
  await fs.mkdir(path.dirname(filepath), { recursive: true })
  await fs.writeFile(filepath, content)
})

// copy public files to output directory
await fs.cp(path.resolve(config.publicDir), path.resolve(OUTPUT_DIR), { recursive: true })

// TODO need to figure out how to template files to be able to nest