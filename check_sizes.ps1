$css = Get-Content "C:\GIT_REPOS\digram\src\components\OverdueTasks.css" -Raw
$data = Get-Content "C:\GIT_REPOS\digram\data.json" -Raw
Write-Host "CSS: $($css.Length) chars"
Write-Host "Data: $($data.Length) chars"
