# Translation map for Russian -> English
$translations = @{
    # Departments
    'Департамент казначейства' = 'Treasury Department'
    'Казначейство' = 'Treasury'
    'Отдел казначейства' = 'Treasury Division'
    'Отдел операционных платежей' = 'Payment Operations Division'
    'Департамент бухгалтерского учета' = 'Accounting Department'
    'Бухгалтерский учет' = 'Accounting'
    'Отдел бухгалтерского учета' = 'Accounting Division'
    'Отдел учета и отчетности' = 'Accounting and Reporting Division'
    'Департамент финансового планирования' = 'Financial Planning Department'
    'Финансовое планирование' = 'Financial Planning'
    'Отдел финансового планирования' = 'Financial Planning Division'
    'Отдел бюджетирования' = 'Budgeting Division'
    'Департамент аудита' = 'Audit Department'
    'Аудит' = 'Audit'
    'Отдел внутреннего аудита' = 'Internal Audit Division'
    'Отдел аудита операций' = 'Operations Audit Division'
    'Правление' = 'Board'
    'Правление банка' = 'Bank Board'
    'Первый заместитель Председателя Правления' = 'First Deputy Chairman'
    'Заместитель Председателя Правления' = 'Deputy Chairman'
    'Руководитель' = 'Head'
    'Начальник отдела' = 'Division Head'
    'Начальник управления' = 'Department Head'
    'Руководитель подразделения' = 'Unit Head'
    'Заместитель начальника отдела' = 'Deputy Division Head'
    'Заместитель начальника управления' = 'Deputy Department Head'
    'Главный эксперт' = 'Lead Expert'
    'Ведущий эксперт' = 'Senior Expert'
    'Эксперт' = 'Expert'
    'Старший эксперт' = 'Senior Expert'
    'Младший эксперт' = 'Junior Expert'
    'Специалист' = 'Specialist'
    'Старший специалист' = 'Senior Specialist'
    'Ведущий специалист' = 'Lead Specialist'
    'Исполнитель' = 'Executor'
    'Инициатор' = 'Initiator'
    'Куратор' = 'Curator'
    'Должность' = 'Position'
    'Подразделение' = 'Division'
    'Департамент' = 'Department'
    'Срок' = 'Deadline'
    'Тема' = 'Topic'
    'Ссылка' = 'Link'
    'Дата старта' = 'Start Date'
    'Подразделение инициатора' = 'Initiator Division'
    'Подразделение исполнителя' = 'Executor Division'
    'Вышестоящее подразделение' = 'Supervising Division'
    'Должность куратора' = 'Curator Position'
    'Ид задачи' = 'Task ID'
    'Просрочено' = 'Overdue'
    'Всего' = 'Total'
    'Сотрудников' = 'Employees'
    'В среднем' = 'On average'
    'Больше всего' = 'Most'
    'Показать задачи' = 'Show tasks'
    'из' = 'of'
    'Сотрудник' = 'Employee'
    'Топ сотрудников по просроченным задачам' = 'Top employees by overdue tasks'
    'Сотрудник с максимальной просрочкой' = 'Employee with max overdue'
    'Подразделение с максимальной просрочкой' = 'Department with max overdue'
    'Все просроченные задачи' = 'All overdue tasks'
    'Поиск по всем полям' = 'Search all fields'
    'Перейти' = 'Go'
    'Сохранение' = 'Saving'
    'Скачать PNG' = 'Download PNG'
    'Данные обновлены' = 'Data updated'
    'Поиск сотрудника по ФИО, отделу или задачам' = 'Search employee by name, division or tasks'
    'Поиск по задачам (ID, тема, исполнитель, срок)' = 'Search tasks (ID, topic, executor, deadline)'
    'Показать задачи' = 'Show tasks'
    'Сотрудники не найдены' = 'No employees found'
    'Задачи не найдены' = 'No tasks found'
    'Ничего не найдено' = 'Nothing found'
    'просрочено' = 'overdue'
    'сотрудников' = 'employees'
    'задач' = 'tasks'
    'Найдено' = 'Found'
    'Всего просрочено' = 'Total overdue'
    'Выберите куратора' = 'Select curator'
    'Выберите департамент' = 'Select department'
}

# Read data
$data = Get-Content 'C:\GIT_REPOS\digram\data.json' -Raw -Encoding utf8

# Replace in order from longest to shortest to avoid partial replacements
$sortedKeys = $translations.Keys | Sort-Object Length -Descending

foreach ($key in $sortedKeys) {
    $val = $translations[$key]
    $data = $data -replace [regex]::Escape($key), $val
}

# Write back
$utf8 = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText('C:\GIT_REPOS\digram\data.json', $data, $utf8)
Write-Host "data.json translated to English successfully" -ForegroundColor Green
