import path from 'path'

const files = [
'404.html',
'blog.html',
'blog/12.html',
'blog/12/index.html',
'blog/12/sample-markdown-file.html',
'blog/15.html',
'blog/15/bold-italics-formatted-title.html',
'blog/15/index.html',
'blog/16.html',
'blog/16/a-third-issue-to-test.html',
'blog/16/index.html',
'blog/index.html',
'blog/index.html',
'blog/index.html',
'index.html',
'zfolder/a.txt',
'zfolder/x/y/z/b.txt',
]

const filePathList = files.sort()
let fileTree = filePathList.reduce((a, c) => {
  const file = path.basename(c)
  const parts = file === c ? [] : path.dirname(c).split(path.sep)

  let obj = a
  let i = 0
  while (i < parts.length) {
    if (!(parts[i] in obj)) obj[parts[i]] = {}
    obj = obj[parts[i++]]
  }
  obj[file] = {}

  return a
}, {})

const prettyPrintNestedObject = (tree, fixedIndent=false, indent=0) => Object
  .entries(tree)
  .sort(([k1], [k2]) => k1 < k2 ? -1 : 1)
  .map(([pathSegment, children], i, a) => {
    const path = `${fixedIndent ? fixedIndent(indent, i, a) : ' '.repeat(indent)}${pathSegment}`
    if (Object.keys(children).length === 0) return path
    const nextIndent = fixedIndent ? indent + 1 : indent + pathSegment.length + 1
    return `${path}/\n${stringifyTree(children, fixedIndent, nextIndent)}`
  })
  .join('\n')

  // └──
  // ├──
console.log(stringifyTree(fileTree, (indent, i, a) => {
  if (indent > 0) {
    if (i === a.length - 1) return `${'    '.repeat(indent - 1)}└── `
    return `${'    '.repeat(indent - 1)}└── `
  }
  return ``
}))