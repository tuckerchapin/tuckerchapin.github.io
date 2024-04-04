import path from 'path'
import fs from 'fs/promises'

export const walkFs = async (dir, relative=false) => (
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

// this is all just to pretty print the resulting files in the output summary
// takes a list of paths and converts each path chunk to a nested object of files and dirs
export const pathListToHierarchy = (arr) => arr.reduce((a, c) => {
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

// prints out the file hierarchy without the full path and indented to indicate dir membership
export const prettyPrintNestedObject = (tree, fixedIndent=false, indent=0) => Object
  .entries(tree)
  .sort(([k1], [k2]) => k1 < k2 ? -1 : 1)
  .map(([pathSegment, children], i, a) => {
    const path = `${fixedIndent ? fixedIndent(indent, i, a) : ' '.repeat(indent)}${pathSegment}`
    if (Object.keys(children).length === 0) return path
    const nextIndent = fixedIndent ? indent + 1 : indent + pathSegment.length + 1
    return `${path}/\n${prettyPrintNestedObject(children, fixedIndent, nextIndent)}`
  })
  .join('\n')