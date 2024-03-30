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
]

const filePathList = files.sort()
let fileTree = filePathList.reduce((a, c) => {
  const parts = path.dirname(c).split(path.sep)
  const file = path.basename(c)

  let obj = a
  let i = 0
  while (i < parts.length) {
    if (!(parts[i] in obj)) obj[parts[i]] = {}
    obj = obj[parts[i++]]
  }
  // console.log(a)
  obj[file] = {}
  // const removeParts = a.prev
  // console.log(thisParts, baseName)
  return a
  // const sharedParts = []

  // console.log('removeParts', removeParts)
  // console.log('thisParts', thisParts)

  // let i = 0
  // while (removeParts[i] && removeParts[i] === thisParts[i]) {
  //   console.log(i, removeParts[i], thisParts[i])
  //   sharedParts.push(removeParts[i++])
  // }

  // console.log('sharedParts', sharedParts)

  // const remainingPath = []

  // ${path.join(...thisParts.slice(i))}/

  // if (sharedParts.length === 0) {
  //   a.lines.push(`${' '.repeat(path.join(...sharedParts).length - 1)}${baseName}`)
  //   a.prev = thisParts
  // } else {
  //   a.lines.push(`${' '.repeat(path.join(...sharedParts).length - 1)}${baseName}`)
  //   a.prev = thisParts
  // }
  // // for (let i = 0; i < removeParts.length; i++) {
  // //   if (removeParts[i] !== thisParts[i]) break
  // //   thisParts.shift()
  // // }

  // return a
}, {})

console.log(fileTree)