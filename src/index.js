import fs from 'fs/promises'
import * as core from '@actions/core'
import * as github from '@actions/github'
import handlebars from 'handlebars'
import path from 'path'
import {
  walkFs,
  pathListToHierarchy,
  prettyPrintNestedObject,
} from './utils.js'
import { makeConfig } from './config.js'

const config = makeConfig(handlebars)

// register handlebar helpers from config
Object.entries(config.handlebarsHelpers).forEach(([name, fn]) => handlebars.registerHelper(name, fn))

// get list of issue files
const issueJsonFilenames = await fs.readdir(path.resolve(config.ISSUES_DIR)).catch(e => {
  core.warning(`Cannot read issues directory`, { title: github.job?.name })
  console.error(e) // full context in the logs
  return []
})

// read issue files
const issueFiles = issueJsonFilenames
  .filter((filename) => filename.endsWith(`.json`))
  .map(filename => fs.readFile(path.resolve(config.ISSUES_DIR, filename), `utf8`))

// parse issue files
const templateData = config.templateData
templateData.issues =
  (await Promise.all(issueFiles)
    .catch(e => {
      core.warning(`Cannot read issue files`, { title: github.job?.name })
      console.error(e) // full context in the logs
      return []
    }))
    .map(file => JSON.parse(file))
    .filter(f => f)

const publishableIssueLog = `${templateData.issues.length} publishable issue${templateData.issues.length === 1 ? '' : 's'}`
templateData.issues.length ? core.notice(publishableIssueLog) : core.warning(publishableIssueLog)

// discover site templates
const rawFilepaths = await walkFs(config.TEMPLATE_DIR, config.TEMPLATE_DIR).catch(() => {
  core.setFailed(`Cannot read templates directory '${config.TEMPLATE_DIR}'`)
  return []
})

// matches handlebar opening tags in the filepaths
const openBlockRe = /\{\{#(\w+)\s*(.*?)\}\}/g

/* TODO this section is a little nasty
        moving the opening tags, adding closing tags, combining the url and the content, the delimiter, etc.
        it works well so far, but I foresee it being a pain to maintain or causing weird edge cases
*/
// compile the templates and register them all as partials
const compiledTemplates = await Promise.all(rawFilepaths.map(async (rawFilepath) => {
  const template = await fs.readFile(path.resolve(config.TEMPLATE_DIR, rawFilepath), `utf8`)

  /* NOTE because we can't have / in a filename, so when using blocks in filenames we only have opening tags
          this moves opening tags to the start of the filepath and adds closing tags to the end
  */
  const templateBlocks = Array.from(rawFilepath.matchAll(openBlockRe))
  const preppedFilepath = rawFilepath.replace(openBlockRe, ``)

  /* NOTE Ok, time for a hacky solution.
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

  const compiledTemplate = handlebars.compile(combinedTemplate)

  // NOTE partials only template on their content, not their path, limitation?
  handlebars.registerPartial(rawFilepath, template)

  return [rawFilepath, compiledTemplate]
}))

const outputFiles = []
compiledTemplates.forEach(([ rawFilepath, compiledTemplate ]) => {
  /* We compile and evaluate the template that includes the filepaths and directives as well as the file content.
     Then we split this back apart into potentially more than one file and write that out.
     Files/directories that start with '__' are not rendered, so use these for internal partials
  */
  try {
    if (!rawFilepath.split(path.sep).some(s => s.startsWith(`__`))) {
      Array.from(
        compiledTemplate({ ...templateData, __templatePath: rawFilepath})
        .matchAll(/<%%%%>(?<filepath>(?:\s|.)*?)<%%%%>(?<content>(?:\s|.)*?)<%%%%>/g)
      ).forEach(match => outputFiles.push({ ...match.groups }))
    }
  } catch (e) {
    core.setFailed(`Error rendering '${rawFilepath}': ${e.message}`)
    console.error(e) // full context in the logs
  }
})

core.notice(`Rendered ${outputFiles.length} files`)

// write out the resulting compiled files
outputFiles.forEach(async ({ filepath, content }) => {
  filepath = path.resolve(config.BUILD_DIR, filepath)
  await fs.mkdir(path.dirname(filepath), { recursive: true })
  await fs.writeFile(filepath, content)
})

// copy public files to output directory
await fs.cp(path.resolve(config.PUBLIC_DIR), path.resolve(config.BUILD_DIR), { recursive: true })

// fancy file structure summary
if (!process.exitCode) {
  const publicFilepaths = await walkFs(config.PUBLIC_DIR, config.PUBLIC_DIR).catch(() => {
    core.setFailed(`Cannot read public directory '${config.PUBLIC_DIR}'`)
    return []
  })

  const formattedBuildOutput = prettyPrintNestedObject(
    pathListToHierarchy(
      Array.from(new Set([
        ...outputFiles.map(o => o.filepath + `*`),
        ...publicFilepaths
      ]))
    ),
    (indent, i, a) => {
      if (indent > 0) {
        if (i === a.length - 1) return `${'    '.repeat(indent - 1)}└── `
        return `${'    '.repeat(indent - 1)}└── `
      }
      return ``
    }
  )

  await core.summary
    .addCodeBlock(formattedBuildOutput)
    .write()
    .catch(e => {
      core.warning(`Error writing to job summary: ${e.message}`, { title: github.job?.name })
      console.log(`Build output:\n${formattedBuildOutput}`)
    })
}