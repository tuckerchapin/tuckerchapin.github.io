import slugify from 'slugify'

export default {
  templateDir: `template`,
  issuesDir: `issues`,
  handlebarsHelpers: {
    helperMissing: (value, helper) => {
      // this just passes through the raw arg and logs a warning
      console.warn(`Handlebars helper missing: ${helper.name}`)
      return value
    },
    slugify: (value) => slugify(value, {
      lower: true,
      strict: true
    }),
  },
  staticData: {
    title: `My Blog`,
    description: `A blog about things.`
  }
}
// TODO make this more like a normal config where it's overrideable/zippable with a default