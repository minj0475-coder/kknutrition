const fs = require('fs');
let css = fs.readFileSync('assets/site.css', 'utf8');
css = css.replace(/#344054/g, 'var(--text)');
fs.writeFileSync('assets/site.css', css, 'utf8');
console.log('done');
