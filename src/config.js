import path from 'path'
import slugify from 'slugify'
import { marked } from 'marked'
import * as core from '@actions/core'

// TODO need to figure out how to make this publishable
// breaking out this config is a big part of that

// TODO marked extensions
// https://marked.js.org/using_pro#use
// marked.use(config.marked)

export const makeConfig = (handlebars) => ({
  TEMPLATE_DIR: `template`,
  ISSUES_DIR: `issues`,
  PUBLIC_DIR: `public`,
  BUILD_DIR: `_site`,
  handlebarsHelpers: {
    // essential helpers
    helperMissing: (...args) => {
      console.error(`missing helper`, JSON.stringify(args)) // full context in the logs
      core.setFailed(`Missing Handlebars helper ${args.reduce((a, c) => a?.name || c?.name, {})} in ${args.reverse()[0].data.root.__templatePath}`)
    },
    blockHelperMissing: (...args) => {
      console.error(`missing block helper`, JSON.stringify(args)) // full context in the logs
      core.setFailed(`Missing Handlebars block helper ${args.reduce((a, c) => a?.name || c?.name, {})} in ${args.reverse()[0].data.root.__templatePath}`)
    },
    resolve: (...args) => {
      // Resolves paths to partials based on the current template's path
      const [context, pathToResolve ] = args.reverse()
      const templatePath = context.data.root.__templatePath
      const errorMessage = `Couldn't resolve partial '${pathToResolve}' from '${templatePath}`

      // assemble the relative path for the reference based on the rendering template's path
      const targetPartialKey = path.join(path.dirname(templatePath), pathToResolve)
      if (targetPartialKey in handlebars.partials) {
        return targetPartialKey
      }

      if (!pathToResolve) {
        core.setFailed(errorMessage)
      }

      // if the resolved path isn't found, just pass through the raw input
      return pathToResolve
    },

    // general helpers
    urlencode: encodeURIComponent,
    slugify: value => slugify(value, {
      lower: true,
      strict: true
    }),
    marked: value => value ? marked.parse(value) : value,
    'inline-marked': value => value ? marked.parseInline(value) : value,
    length: value => value?.length || 0,
    'format-date': dateString => new Date(dateString).toLocaleDateString(`en-US`),
  },
  templateData: {
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
        label: `BetterVRV`,
        description: `A suite of improvements to the VRV player and experience`,
        url: `https://tuckerchap.in/BetterVRV/`
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
})