const fs = require('fs');
const path = require('path');

const TARGET_DIRS = ['app', 'components'];
const EXTENSIONS = ['.ts', '.tsx'];

let failed = false;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else {
      const ext = path.extname(file);
      if (EXTENSIONS.includes(ext)) {
        checkFile(fullPath);
      }
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all em dashes (—) and en dashes (–)
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('—')) {
      console.error(`Error: Em-dash (—) found in ${filePath} at line ${index + 1}:`);
      console.error(`  > ${line.trim()}`);
      failed = true;
    }
    if (line.includes('–')) {
      console.error(`Error: En-dash (–) found in ${filePath} at line ${index + 1}:`);
      console.error(`  > ${line.trim()}`);
      failed = true;
    }
  });
}

console.log('Scanning for em-dashes and en-dashes across pages...');
TARGET_DIRS.forEach(dir => {
  const fullDir = path.resolve(__dirname, '..', dir);
  if (fs.existsSync(fullDir)) {
    scanDir(fullDir);
  }
});

if (failed) {
  console.error('\nScan failed: Em-dashes or en-dashes found. Replace them with standard hyphens (-).');
  process.exit(1);
} else {
  console.log('\nScan succeeded: No em-dashes or en-dashes found!');
  process.exit(0);
}
