import path from 'path'
import globby from 'globby'
import fs from 'fs-extra'
import { transform, map } from 'lodash'
const root = path.resolve(__dirname, '../')
const run = async () => {
  const basePath = `${root}/packages`
  const paths = await globby(`${basePath}/**/**/*.md`)
  console.log(paths)
  const readmes = paths.filter(p => !p.match(/node_modules/gim))
  const filemap = transform(readmes, (agg, fp) => {
    const name = fp.replace(basePath, '')
    agg[fp] = name.replace('README', 'index')
  }, {})
  map(filemap, (name, location) => {
    const to = `docs/packages${name}`
    console.log(`Coppying ${location} to ${to}`)
    fs.copy(location, to)
  })
}

run()