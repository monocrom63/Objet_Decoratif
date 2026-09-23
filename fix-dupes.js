const fs = require('fs');
const file = 'artifacts/objet-decoratif-store/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// There are two App() definitions. We want to remove the first one, which is just:
// function App() { ... } export default App; (the one that failed typecheck due to missing Router)
// Actually, let's just find the first `function App()` and remove it.

const firstAppIdx = content.indexOf('function App()');
const secondAppIdx = content.indexOf('function App()', firstAppIdx + 1);

// We want to delete from firstAppIdx up to (but not including) `function AdminPage()`
const adminPageIdx = content.indexOf('function AdminPage()');
if (adminPageIdx > firstAppIdx) {
    content = content.substring(0, firstAppIdx) + content.substring(adminPageIdx);
}

fs.writeFileSync(file, content);
