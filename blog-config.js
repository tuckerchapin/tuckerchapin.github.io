import slugify from 'slugify'
import { marked } from 'marked'

export default {
  templateDir: `template`,
  issuesDir: `issues`,
  publicDir: `public`,
  handlebarsHelpers: {
    helperMissing: (...a) => {
      console.warn(`Handlebars helper missing: ${JSON.stringify(a)}`)
    },
    urlencode: encodeURIComponent,
    slugify: (value) => slugify(value, {
      lower: true,
      strict: true
    }),
    md: marked,
    // file: (relPath) => {
    //   // TODO stubbed
    // }
  },
  staticData: {
    title: `My Blog`,
    description: `A blog about things.`
  }
}
// TODO make this more like a normal config where it's overrideable/zippable with a default
// TODO currently this is getting build in ncc so we need to make it standalone and imported in the workflow