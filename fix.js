const fs = require('fs');
let code = fs.readFileSync('src/data/videos.ts', 'utf8');
code = code.replace(/title:\s*\".*/gm, 'title: "Untitled",');
fs.writeFileSync('src/data/videos.ts', code, 'utf8');
console.log('Fixed quotes.');
