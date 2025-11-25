const fs = require('fs')
const path = require('path')

function copyRecursive(src, dest){
  if (!fs.existsSync(src)) return false
  const stat = fs.statSync(src)
  if (stat.isDirectory()){
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, {recursive:true})
    for (const entry of fs.readdirSync(src)){
      copyRecursive(path.join(src,entry), path.join(dest,entry))
    }
  } else {
    fs.copyFileSync(src,dest)
  }
  return true
}

const pkgRoot = path.resolve(__dirname, '..')
const srcWeb = path.join(pkgRoot, 'node_modules', 'pdfjs-dist', 'web')
const srcBuild = path.join(pkgRoot, 'node_modules', 'pdfjs-dist', 'build')
const dest = path.join(pkgRoot, 'public', 'pdfjs')

try{
  if (!fs.existsSync(path.join(pkgRoot,'node_modules'))){
    console.error('node_modules not found — run `npm install` first')
    process.exit(0)
  }
  let copied = false
  if (fs.existsSync(srcWeb)){
    copyRecursive(srcWeb,dest)
    copied = true
  }
  if (fs.existsSync(srcBuild)){
    copyRecursive(srcBuild,path.join(dest,'build'))
    copied = true
  }
  if (copied) console.log('Copied pdfjs assets to public/pdfjs')
  else console.warn('pdfjs assets not found in node_modules/pdfjs-dist')
}catch(e){
  console.error('Error copying pdfjs web viewer:', e.message)
  process.exit(1)
}
