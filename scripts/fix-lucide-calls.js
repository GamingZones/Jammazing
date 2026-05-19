const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'Pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let total = 0;
for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  let count = 0;

  // Add lucide.createIcons() after themeLightDarkBtn.innerHTML = ... lines that don't already have it
  content = content.replace(
    /(themeLightDarkBtn\.innerHTML\s*=\s*[^;]+;)(\s*\n)(?!\s*lucide\.createIcons\(\))/g,
    (m, stmt, nl) => {
      count++;
      return stmt + nl + '            lucide.createIcons();\n';
    }
  );

  // quiz-interface.html: add lucide.createIcons() after nextBtn.innerHTML assignments
  content = content.replace(
    /(nextBtn\.innerHTML\s*=\s*[^;]+;)(\s*\n)(?!\s*lucide\.createIcons\(\))/g,
    (m, stmt, nl) => {
      count++;
      return stmt + nl + '                lucide.createIcons();\n';
    }
  );

  if (count > 0) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(file + ': +' + count + ' lucide.createIcons()');
    total += count;
  }
}
console.log('Total: ' + total);
