import { marked } from 'marked'
import fs from 'fs'

const issues = fs.readdirSync('issues')
for (issue of issues) {
  const content = fs.readFileSync(`issues/${issue}`, 'utf8')
  const html = marked(content)
  console.log('issue', html)
}