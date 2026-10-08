$projectRoot = "C:\GIT_REPOS\digram"
$cssMain = Get-Content "$projectRoot\src\index.css" -Raw
$cssComponents = Get-Content "$projectRoot\src\components\OverdueTasks.css" -Raw
$jsx = Get-Content "$projectRoot\src\components\OverdueTasks.jsx" -Raw
$data = Get-Content "$projectRoot\data.json" -Raw

# Strip import statements and export from JSX
$jsxClean = $jsx -replace 'import html2canvas from "html2canvas";\r?\n', ''
$jsxClean = $jsxClean -replace 'import \{ [^}]+ \} from "react";\r?\n', ''
$jsxClean = $jsxClean -replace 'import DATA from "[^"]+";\r?\n', ''
$jsxClean = $jsxClean -replace 'import "[^"]+";\r?\n', ''
$jsxClean = $jsxClean -replace 'export default ', ''

# Translate Russian strings to English
$replacements = @(
  @{old='просрочено'; new='overdue'},
  @{old='сотрудников'; new='employees'},
  @{old='Найдено:'; new='Found:'},
  @{old='Сотрудники не найдены'; new='No employees found'},
  @{old='задач'; new='tasks'},
  @{old='Просроченные задачи'; new='Overdue Tasks'},
  @{old='Всего просрочено'; new='Total overdue'},
  @{old='Сотрудников'; new='Employees'},
  @{old='В среднем'; new='On average'},
  @{old='Больше всего'; new='Most'},
  @{old='Выберите куратора'; new='Select curator'},
  @{old='Показать задачи'; new='Show tasks'},
  @{old='из'; new='of'},
  @{old='Исполнитель:'; new='Executor:'},
  @{old='Срок:'; new='Deadline:'},
  @{old='Ничего не найдено'; new='Nothing found'},
  @{old='Задачи не найдены'; new='No tasks found'},
  @{old='Инициатор:'; new='Initiator:'},
  @{old='Выберите департамент'; new='Select department'},
  @{old='Топ сотрудников по просроченным задачам'; new='Top employees by overdue tasks'},
  @{old='Всего:'; new='Total:'},
  @{old='Сотрудник'; new='Employee'},
  @{old='Подразделение'; new='Division'},
  @{old='Департамент'; new='Department'},
  @{old='Просрочено'; new='Overdue'},
  @{old='Сотрудник с максимальной просрочкой'; new='Employee with max overdue'},
  @{old='Данные не найдены'; new='No data found'},
  @{old='Правление'; new='Board'},
  @{old='Правление банка'; new='Bank Board'},
  @{old='Первый заместитель'; new='First Deputy'},
  @{old='Руководство'; new='Management'},
  @{old='Подразделение с максимальной просрочкой'; new='Department with max overdue'},
  @{old='Все просроченные задачи'; new='All overdue tasks'},
  @{old='Поиск по всем полям'; new='Search all fields'},
  @{old='Дата старта'; new='Start date'},
  @{old='Подразделение инициатора'; new='Initiator division'},
  @{old='Исполнитель'; new='Executor'},
  @{old='Подразделение исполнителя'; new='Executor division'},
  @{old='Вышестоящее подразделение'; new='Supervising division'},
  @{old='Должность куратора'; new='Curator position'},
  @{old='Куратор'; new='Curator'},
  @{old='Тема задания'; new='Topic'},
  @{old='Ссылка'; new='Link'},
  @{old='Ид задачи'; new='Task ID'},
  @{old='Перейти'; new='Go'},
  @{old='Поиск сотрудника по ФИО, отделу или задачам'; new='Search employee by name, division or tasks'},
  @{old='Сохранение'; new='Saving'},
  @{old='Скачать PNG'; new='Download PNG'},
  @{old='Данные обновлены'; new='Data updated'},
  @{old='Поиск по задачам'; new='Search tasks'},
  @{old='Поиск сотрудника'; new='Search employee'},
)

foreach ($r in $replacements) {
  $jsxClean = $jsxClean -replace [regex]::Escape($r.old), $r.new
}

# Escape data for embedding in JS
$dataEscaped = $data -replace '\\', '\\\\'
$dataEscaped = $dataEscaped -replace "'", "\\'"

# Wrap JSX in a fetch-based data loader with fallback to embedded data
$jsxWrapped = @"

    // Embedded data (fallback for file:// protocol)
    const EMBEDDED_DATA = $dataEscaped;

    // Fetch data.json and render
    async function init() {
      try {
        const resp = await fetch('data.json');
        if (resp.ok) {
          DATA = await resp.json();
        } else {
          DATA = EMBEDDED_DATA;
        }
      } catch(e) {
        console.warn('fetch data.json failed, using embedded data:', e.message);
        DATA = EMBEDDED_DATA;
      }
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(React.Fragment, null, React.createElement(OverdueTasksDashboard, null)));
    }

    init();
"@

# Combine CSS
$allCss = $cssMain + "`n" + $cssComponents

$html = @"
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Просроченные задачи - Дашборд</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
  <style>
$allCss
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useEffect, useMemo, useRef, useState } = React;
    let DATA = { departments: [], tasks: [] };

$jsxClean$jsxWrapped
  </script>
</body>
</html>
"@

$utf8BOM = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText("$projectRoot\standalone.html", $html, $utf8BOM)
Write-Host "standalone.html created successfully" -ForegroundColor Green
$bytes = [System.IO.File]::ReadAllBytes("$projectRoot\standalone.html")
Write-Host "File size: $($bytes.Length) bytes"
