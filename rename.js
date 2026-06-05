const fs = require('fs');
const path = require('path');

const DIRECTORIES = ['app', 'components', 'lib', 'public'];
const FILES = ['package.json'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css'];

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  
  newContent = newContent.replace(/AstroLens/g, 'Astroneo');
  newContent = newContent.replace(/Astrolense/g, 'Astroneo');
  newContent = newContent.replace(/astrolens\.space/g, 'astroneo.space');
  newContent = newContent.replace(/astrolens/g, 'astroneo');
  newContent = newContent.replace(/astrolense/g, 'astroneo');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else {
      const ext = path.extname(filePath);
      if (EXTENSIONS.includes(ext)) {
        replaceInFile(filePath);
      }
    }
  }
}

console.log('Starting rename process...');
for (const file of FILES) {
  replaceInFile(path.join(process.cwd(), file));
}
for (const dir of DIRECTORIES) {
  walkDir(path.join(process.cwd(), dir));
}
console.log('Done.');
