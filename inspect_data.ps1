$data = Get-Content 'C:\GIT_REPOS\digram\data.json' -Raw | ConvertFrom-Json
Write-Host "departments: $($data.departments.Count)"
$d = $data.departments[0]
Write-Host "dept name: $($d.name)"
Write-Host "shortName: $($d.shortName)"
if ($d.subDepartments) {
    $s = $d.subDepartments[0]
    Write-Host "subDept: $($s.name)"
    if ($s.employees) {
        $e = $s.employees[0]
        Write-Host "emp: $($e.fullName) dept: $($e.department)"
    }
}
if ($data.tasks) {
    Write-Host "tasks: $($data.tasks.Count)"
    $t = $data.tasks[0]
    $t.PSObject.Properties.Name -join ', '
    Write-Host "topic: $($t.topic)"
    Write-Host "executor: $($t.executor)"
    Write-Host "initiator: $($t.initiator)"
    Write-Host "curator: $($t.curator)"
    Write-Host "curatorPosition: $($t.curatorPosition)"
    Write-Host "dept: $($t.dept)"
    Write-Host "initiatorDept: $($t.initiatorDept)"
    Write-Host "executorDept: $($t.executorDept)"
    Write-Host "supervisingDept: $($t.supervisingDept)"
}
