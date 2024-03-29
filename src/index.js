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
      // why tf is handlebars so poorly documented? isn't this like widley used?
      console.error('missing helper', JSON.stringify(args))
      core.setFailed(`Missing Handlebars helper: ${args.reduce((a, c) => a?.name || c?.name, {})}`)
    },
    blockHelperMissing: (...args) => {
      // TODO optionally fail the task on failed handlebar evaluation
      console.error('missing block helper', JSON.stringify(args))
      core.setFailed(`Missing Handlebars block helper: ${args.reduce((a, c) => a?.name || c?.name, {})}`)
    },
    urlencode: encodeURIComponent, // TODO should this be safe string'd?
    slugify: (value) => slugify(value, {
      lower: true,
      strict: true
    }),
    marked: marked.parse,
    if: (value) => value || null
  },
  marked: {},
  staticData: {
    projects: [
      {
        label: `Keebhunter`,
        description: `Find your perfect keyboard`,
        url: `https://keebhunter.com/`
      },
      {
        label: `Easy CC Autofill`,
        description: `Prompt your browser's autofill for saved credit cards`,
        url: `https://tuckerchap.in/easy-cc-autofill/`
      },
      {
        label: 'BetterVRV',
        description: 'https://tuckerchap.in/BetterVRV/',
        url: 'A suite of improvements to the VRV player and experience'
      },
      {
        label: `Forza Horizon Season`,
        description: `What season is it in Edinburgh in Forza Horizon 4`,
        url: `https://whatseasonisitinhorizon.com/`
      },
      {
        label: `HoursWithoutYandi`,
        description: `How long since we were promised Yandhi`,
        url: `https://hourswithoutyandhi.com/`
      },
      {
        label: `Fake Album Cover Generator`,
        description: `Randomly generate a fake album`,
        url: `https://fakealbumart.com`
      },
      {
        label: `Clever Domain`,
        description: `Generate a trendy domain name with unusual TLDs`,
        disabled: true,
        url: `http://cleverdoma.in/`
      },
    ],
    work: [
      {
        name: `Staked`,
        description: `Compound your crypto`,
        url: `https://staked.us`
      },
      {
        name: `FitMango`,
        description: `On-demand personalized group training`,
        url: `http://fitmango.com/`
      },
      {
        name: `SideGuide`,
        description: `Mobile-optimized campus tours`,
        url: `https://side.guide`
      },
    ],
    contactLinks: [
      {
        label: `blog`,
        url: `/blog`
      },
      {
        label: `mail`,
        url: `mailto:site@tuckerchap.in`
      },
      {
        label: `github`,
        url: `https://github.com/tuckerchapin`
      },
      {
        label: `linkedin`,
        url: `https://www.linkedin.com/in/tuckerchapin`
      },
      {
        label: `imdb`,
        url: `https://www.imdb.com/name/nm5847740/`
      },
    ]
  },
}
/*=============================================*/

// register handlebar helpers from config
Object.entries(config.handlebarsHelpers).forEach(([name, fn]) => handlebars.registerHelper(name, fn))

// register marked extensions
// TODO do we need to do this? or should this be externalized?
// https://marked.js.org/using_pro#use
marked.use(config.marked)

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

const publishableIssueLog = `${templateData.issues.length} publishable issue${templateData.issues.length === 1 ? '' : 's'}`
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

// discover site templates
const rawFilepaths = await walkFs(config.templateDir, config.templateDir).catch(() => {
  core.setFailed(`Cannot read templates directory '${config.templateDir}'`)
  return []
})

console.log('all filepaths:', rawFilepaths)

// matches handlebar opening tags in the filepaths
const openBlockRe = /\{\{#(\w+)\s*(.*?)\}\}/g

/* TODO this whole section is kinda nasty: the block regexes, string interps, etc.
        could use a second pass for refinement and robustness
   TODO BIG FUCKING FAT TODO HERE: support partials in the filenames... that could get mindfucky as all hell, but also could be very powerful
        not sure how much use there is for that, but intriguing
*/
// compile the templates and register them all as partials
const compiledTemplates = await Promise.all(rawFilepaths.map(async (rawFilepath) => {
  const template = await fs.readFile(path.resolve(config.templateDir, rawFilepath), 'utf8')

  /* NOTE because we can't have / in a filename, so when using blocks in filenames we only have opening tags
          this moves opening tags to the start of the filepath and adds closing tags to the end
  */
  const templateBlocks = Array.from(rawFilepath.matchAll(openBlockRe))
  const preppedFilepath = rawFilepath.replace(openBlockRe, '')

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
  // what should we use as the partial's name?
  handlebars.registerPartial(rawFilepath, compiledTemplate)
  return compiledTemplate
}))

const outputFiles = []
compiledTemplates.forEach((compiledTemplate) => {
  /* We compile and evaluate the template that includes the filepaths and directives as well as the file content.
     Then we split this back apart into potentially more than one file and write that out.
  */
  Array.from(
    compiledTemplate(templateData)
    .matchAll(/<%%%%>(?<filepath>(?:\s|.)*?)<%%%%>(?<content>(?:\s|.)*?)<%%%%>/g)
  ).forEach(match => outputFiles.push({ ...match.groups }))
})

console.log('all output files:', outputFiles.map(o => o.filepath))

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