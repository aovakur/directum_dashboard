import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = 'C:\\GIT_REPOS\\digram';

// Чтение файлов в UTF-8
const cssMain = fs.readFileSync(path.join(projectRoot, 'src', 'index.css'), 'utf-8');
const cssComponents = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'OverdueTasks.css'), 'utf-8');
const jsx = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'OverdueTasks.jsx'), 'utf-8');
const data = fs.readFileSync(path.join(projectRoot, 'data.json'), 'utf-8');

// Strip import statements and export from JSX
let jsxClean = jsx;

jsxClean = jsxClean.replace(/import html2canvas from "html2canvas";\r?\n/g, '');
jsxClean = jsxClean.replace(/import \{ [^}]+ \} from "react";\r?\n/g, '');
jsxClean = jsxClean.replace(/import DATA from "[^"]+";\r?\n/g, '');
jsxClean = jsxClean.replace(/import "[^"]+";\r?\n/g, '');
jsxClean = jsxClean.replace(/export default /g, '');

// Translate Russian strings to English
const replacements = [
 
];

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const [oldStr, newStr] of replacements) {
  jsxClean = jsxClean.replace(new RegExp(escapeRegExp(oldStr), 'g'), newStr);
}

// Безопасное встраивание данных через JSON.stringify
// Превращаем весь data.json в валидную JS-строку,
// затем в браузере парсим через JSON.parse — никаких проблем с экранированием
const dataStringified = JSON.stringify(data);

const jsxWrapped = `
    // Embedded data (fallback for file:// protocol)
    const EMBEDDED_DATA_STRING = ${dataStringified};

    // Fetch data.json and render
    async function init() {
      try {
        const resp = await fetch('data.json');
        if (resp.ok) {
          DATA = await resp.json();
        } else {
          DATA = JSON.parse(EMBEDDED_DATA_STRING);
        }
      } catch(e) {
        console.warn('fetch data.json failed, using embedded data:', e.message);
        DATA = JSON.parse(EMBEDDED_DATA_STRING);
      }
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(React.Fragment, null, React.createElement(OverdueTasksDashboard, null)));
    }

    init();
`;

// Combine CSS
const allCss = cssMain + '\n' + cssComponents;

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Просроченные задачи - Дашборд</title>
  <script src="./libs/react.production.min.js"></script>
  <script src="./libs/react-dom.production.min.js"></script>
  <script src="./libs/babel.min.js"></script>
  <script src="./libs/html2canvas.min.js"></script>
  <style>
${allCss}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useEffect, useMemo, useRef, useState } = React;
    let DATA = { departments: [], tasks: [] };

${jsxClean}
${jsxWrapped}
  </script>
</body>
</html>`;

// Запись в UTF-8 с BOM (как в оригинальном PowerShell-скрипте)
const BOM = '\uFEFF';
fs.writeFileSync(path.join(projectRoot,'html','standalone.html'), BOM + html, 'utf-8');

console.log('standalone.html created successfully');

const stats = fs.statSync(path.join(projectRoot, 'standalone.html'));
console.log(`File size: ${stats.size} bytes`);

