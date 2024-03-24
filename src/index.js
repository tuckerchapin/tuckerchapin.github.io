import { marked } from 'marked'
import fs from 'fs'
import core from '@actions/core'
// import github from '@actions/github'
import slugify from 'slugify'

// TODO handle startup, no issues folder

if (!fs.existsSync('issues')) {
  console.log('No issues/ folder found. Exiting.')
  process.exit()
}

// if the blog folder doesn't exit, create it
if (!fs.existsSync('blog')) fs.mkdirSync('blog')
const blogFiles = fs.readdirSync('blog')
const issueFiles = fs.readdirSync('issues')

for (const issueFile of issueFiles) {
  // read in the issue file
  const issue = JSON.parse(fs.readFileSync(`issues/${issueFile}`, 'utf8'))

  // clean up other conflicting files sharing this post id
  for (const blogFile of blogFiles) {
    if (blogFile.startsWith(`${issue.number}-`)) {
      fs.unlinkSync(`blog/${blogFile}`);
    }
  }

  // if there's no body issue, skip and don't produce html output
  if (issue.body) {
    // TODO shite templating
    const html = `<html><body>${marked(issue.body)}</body></html>`

    // slugify and create the post title
    const slug = slugify(issue.title, {
      lower: true,
      strict: true
    })

    // write out the blog post
    const fileName = `${issue.number}-${slug}.html`
    fs.writeFileSync(`blog/${fileName}`, html)
    console.log(`issue ${('#' + issue.number).padStart(4)} -> blog/${fileName} created`)
  } else {
    console.log(`issue ${('#' + issue.number).padStart(4)} -> has no body, no output`)
  }
}

core.setOutput("commit-message", "Generated blog posts from issues");