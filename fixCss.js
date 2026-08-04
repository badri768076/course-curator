const fs = require('fs');

let css = fs.readFileSync('app/globals.css', 'utf8');

// Replace .content-grid columns
css = css.replace(
    /\.content-grid\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*1fr;/,
    `.content-grid {
  display: grid;
  grid-template-columns: 300px 1fr;`
);

fs.writeFileSync('app/globals.css', css);
console.log('Fixed CSS');
