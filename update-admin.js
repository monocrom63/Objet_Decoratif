const fs = require('fs');

let content = fs.readFileSync('artifacts/objet-decoratif-store/src/App.tsx', 'utf8');

const adminContentOriginal = content.substring(content.indexOf('function AdminContent()'), content.indexOf('function App()'));
console.log(adminContentOriginal.length);
