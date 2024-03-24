import { marked } from 'marked'
import fs from 'fs'
import core from '@actions/core'
import github from '@actions/github'

// TODO handle startup, no issues folder

if (!fs.existsSync('issues')) {
  console.log('No issues/ folder found. Exiting.')
  process.exit()
}

const issueFiles = fs.readdirSync('issues')
for (const issueFile of issueFiles) {
  const content = JSON.parse(fs.readFileSync(`issues/${issueFile}`, 'utf8'))
  if (content.body) {
    const html = `<html><body>${marked(content.body)}</body></html>`
    if (!fs.existsSync('blog')) fs.mkdirSync('blog')
    fs.writeFileSync(`blog/${issueFile}.html`, html)
    console.log(issueFile, `blog/${issueFile}.html`)
  } else {
    console.log(issueFile, 'no body')
  }
}

core.setOutput("commit-message", "Generated blog posts from issues");