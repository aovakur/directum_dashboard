import html2canvas from "html2canvas";
import { useEffect, useMemo, useRef, useState } from "react";
import DATA from "./../../data.json";
import "./OverdueTasks.css";

const DEPARTMENT_ICONS = {
  treasury: "💰",
  accounting: "📊",
  finance: "🏦",
  audit: "🔍",
};

// Helper to get all employees from a department (including subDepartments)
function getAllEmployees(dept) {
  if (dept.subDepartments) {
    return dept.subDepartments.flatMap((sub) => sub.employees || []);
  }
  return dept.employees || [];
}

// Helper to get total count for a department (real task count)
function getDeptTotal(dept) {
  const employees = getAllEmployees(dept);
  return employees.reduce((sum, e) => sum + getEmployeeTaskCount(e), 0);
}

// Helper to get total employee count for a department
function getDeptEmpCount(dept) {
  return getAllEmployees(dept).length;
}

// Helper to match tasks to an employee by abbreviated name (e.g. "Васильев М.А.")
function getEmployeeTasks(employee) {
  const pattern = `${employee.lastName} ${employee.firstName[0]}.${employee.middleName[0]}.`;
  return DATA.tasks.filter(
    (task) => task.executor.includes(pattern) || task.initiator === pattern,
  );
}

// Helper to get real task count for an employee
function getEmployeeTaskCount(employee) {
  return getEmployeeTasks(employee).length;
}

// Get all curators from tasks (by task.curator field)
function getAllCurators() {
  const curatorMap = new Map();

  // First pass: collect all departments per curator
  DATA.tasks.forEach((task) => {
    if (!task.curator) return;

    if (!curatorMap.has(task.curator)) {
      curatorMap.set(task.curator, {
        fullName: task.curator,
        position: task.curatorPosition || "",
        deptCounts: {},
        taskCount: 0,
      });
    }

    const c = curatorMap.get(task.curator);
    c.taskCount++;

    // Find department
    const dept = DATA.departments.find(
      (d) => d.shortName === task.dept || d.name === task.supervisingDept,
    );
    if (dept) {
      const key = `${dept.name}|${dept.shortName}|${dept.icon}`;
      c.deptCounts[key] = (c.deptCounts[key] || 0) + 1;
    }
  });

  // Second pass: pick the most common department and finalize
  const result = [];
  curatorMap.forEach((c, name) => {
    let bestDept = { name: "", shortName: "", icon: "📋" };
    let bestCount = 0;

    Object.entries(c.deptCounts).forEach(([key, count]) => {
      if (count > bestCount) {
        bestCount = count;
        const [name, shortName, icon] = key.split("|");
        bestDept = { name, shortName, icon };
      }
    });

    result.push({
      fullName: c.fullName,
      position: c.position,
      department: bestDept.name,
      departmentShort: bestDept.shortName,
      departmentIcon: bestDept.icon,
      hierarchy: [bestDept.shortName],
      taskCount: c.taskCount,
    });
  });

  return result;
}

// Get tasks for a curator by matching curator name
function getCuratorTasks(curator) {
  return DATA.tasks.filter((task) => task.curator === curator.fullName);
}

function DepartmentSection({
  department,
  sectionIndex,
  onEmployeeClick,
  searchQuery,
}) {
  const [expanded, setExpanded] = useState(false);
  const [expandedSubs, setExpandedSubs] = useState({});

  // Flatten all employees from subDepartments or direct employees
  const allEmployees = useMemo(() => {
    if (department.subDepartments) {
      return department.subDepartments.flatMap((sub) => sub.employees || []);
    }
    return department.employees || [];
  }, [department.subDepartments, department.employees]);

  // Calculate real task counts for employees
  const employeesWithRealCount = useMemo(() => {
    return allEmployees.map((emp) => ({
      ...emp,
      realCount: getEmployeeTaskCount(emp),
    }));
  }, [allEmployees]);

  const totalCount = employeesWithRealCount.reduce(
    (sum, e) => sum + e.realCount,
    0,
  );
  const maxCount = Math.max(
    ...employeesWithRealCount.map((e) => e.realCount),
    1,
  );

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employeesWithRealCount;
    const q = searchQuery.toLowerCase();
    return employeesWithRealCount.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.realCount.toString().includes(q),
    );
  }, [employeesWithRealCount, searchQuery]);

  const toggleSub = (subId) => {
    setExpandedSubs((prev) => ({ ...prev, [subId]: !prev[subId] }));
  };

  return (
    <div
      className="dept-section"
      style={{ animationDelay: `${sectionIndex * 0.15}s` }}
    >
      <div
        className="dept-section-header"
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: "pointer" }}
      >
        <span className="dept-section-icon">
          {DEPARTMENT_ICONS[department.id] || "🏢"}
        </span>
        <div className="dept-section-title-group">
          <h2 className="dept-section-title">{department.shortName}</h2>
          <p className="dept-section-subtitle">{department.name}</p>
        </div>
        <div className="dept-section-total">
          <span className="dept-section-total-number">{totalCount}</span>
          <span className="dept-section-total-label">просрочено</span>
        </div>
        <span className="dept-section-toggle">{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded && (
        <div className="dept-employees">
          <div
            className="dept-section-total"
            style={{ marginBottom: "1rem", textAlign: "center" }}
          >
            <span style={{ color: "#667eea", fontWeight: "bold" }}>
              Выберите департамент или отдел
            </span>
          </div>
          {department.subDepartments
            ? department.subDepartments.map((sub, subIndex) => {
                const subEmployees = sub.employees || [];
                const subTotal = subEmployees.reduce((s, e) => s + e.count, 0);
                const subMax = Math.max(...subEmployees.map((e) => e.count), 1);
                const isSubExpanded = expandedSubs[sub.id] !== false;

                // Filter sub-department employees by search
                const filteredSubEmployees = filteredEmployees.filter(
                  (emp) => emp.department === sub.name,
                );

                return (
                  <div key={sub.id} className="sub-department">
                    <div
                      className="sub-department-header"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSub(sub.id);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="sub-department-icon">
                        {DEPARTMENT_ICONS[department.id] || "🏢"}
                      </span>
                      <div className="sub-department-info">
                        <div className="sub-department-title">{sub.name}</div>
                        <div className="sub-department-count">
                          {subTotal} просрочено · {subEmployees.length}{" "}
                          сотрудников
                          {searchQuery && (
                            <span className="sub-dept-filtered">
                              · Найдено: {filteredSubEmployees.length}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="sub-department-toggle">
                        {isSubExpanded ? "▼" : "▶"}
                      </span>
                    </div>

                    {isSubExpanded && (
                      <div className="sub-department-employees">
                        {filteredSubEmployees.length > 0
                          ? filteredSubEmployees
                              .sort((a, b) => b.realCount - a.realCount)
                              .map((employee, index) => (
                                <EmployeeRow
                                  key={employee.fullName}
                                  employee={employee}
                                  index={index}
                                  maxValue={subMax}
                                  onClick={onEmployeeClick}
                                />
                              ))
                          : searchQuery && (
                              <div className="no-employees">
                                Сотрудники не найдены
                              </div>
                            )}
                      </div>
                    )}
                  </div>
                );
              })
            : filteredEmployees.length > 0
              ? filteredEmployees.map((employee, index) => (
                  <EmployeeRow
                    key={employee.fullName}
                    employee={employee}
                    index={index}
                    maxValue={maxCount}
                    onClick={onEmployeeClick}
                  />
                ))
              : searchQuery && (
                  <div className="no-employees">Сотрудники не найдены</div>
                )}
        </div>
      )}
    </div>
  );
}

function EmployeeRow({ employee, index, maxValue, onClick }) {
  const count = employee.realCount || employee.count;
  const percentage = (count / maxValue) * 100;
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setAnimatedWidth(percentage),
      100 + index * 100,
    );
    return () => clearTimeout(timer);
  }, [percentage, index]);

  const barColor =
    count >= 6
      ? "linear-gradient(90deg, #ff416c, #ff4b2b)"
      : "linear-gradient(90deg, #f7971e, #ffd200)";

  const initials = `${employee.lastName[0]}${employee.firstName[0]}`;

  return (
    <div
      className="employee-row clickable"
      onClick={() => onClick && onClick(employee)}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="employee-row-avatar">{initials}</div>
      <div className="employee-row-info">
        <span className="employee-row-name">
          {employee.lastName} {employee.firstName}
        </span>
        <span className="employee-row-dept">{employee.department}</span>
      </div>
      <div className="employee-row-bar-container">
        <div className="employee-row-bar-track">
          <div
            className="employee-row-bar-fill"
            style={{
              width: `${animatedWidth}%`,
              background: barColor,
            }}
          />
        </div>
      </div>
      <div className="employee-row-count">
        <span className="employee-row-count-number">{count}</span>
        <span className="employee-row-count-label">задач</span>
      </div>
    </div>
  );
}

/* ===== EMPLOYEE DETAIL MODAL ===== */
function EmployeeDetailModal({ employee, onClose }) {
  const [expandedTasks, setExpandedTasks] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const employeeTasks = getEmployeeTasks(employee);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return employeeTasks;
    const q = searchQuery.toLowerCase();
    return employeeTasks.filter(
      (task) =>
        task.topic.toLowerCase().includes(q) ||
        task.id.toLowerCase().includes(q) ||
        task.executor.toLowerCase().includes(q) ||
        task.initiator.toLowerCase().includes(q) ||
        task.deadline.includes(q) ||
        task.dept.toLowerCase().includes(q),
    );
  }, [employeeTasks, searchQuery]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{employee.fullName}</h2>
            <div className="modal-subtitle">
              {employee.department} ·{" "}
              <strong style={{ color: "#ff416c" }}>
                {employee.realCount || employee.count}
              </strong>{" "}
              просроченных задач
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Employee card */}
          <div className="top-employee-detail">
            <div className="top-emp-detail-header">
              <div className="top-emp-detail-avatar">
                {employee.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)}
              </div>
              <div className="top-emp-detail-info">
                <div className="top-emp-detail-name">{employee.fullName}</div>
                <div className="top-emp-detail-dept">{employee.department}</div>
                <div className="top-emp-detail-count">
                  {employee.realCount || employee.count} задач
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="task-search">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Поиск по задачам (ID, тема, исполнитель, срок)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Expandable tasks */}
            <button
              className="expand-tasks-btn"
              onClick={() => setExpandedTasks(!expandedTasks)}
            >
              {expandedTasks ? "▼" : "▶"} Показать задачи (
              {filteredTasks.length}
              {searchQuery ? ` из ${employeeTasks.length}` : ""})
            </button>

            {expandedTasks && (
              <div className="employee-tasks-list">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task, i) => (
                    <div key={i} className="employee-task-item">
                      <div className="task-item-header">
                        <span className="task-id-badge">{task.id}</span>
                        <span className="task-deadline-badge">
                          {task.deadline}
                        </span>
                      </div>
                      <div className="task-topic">{task.topic}</div>
                      <div className="task-meta">
                        <span>Исполнитель: {task.executor}</span>
                        <span>•</span>
                        <span>Срок: {task.deadline}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-tasks">
                    {searchQuery ? "Ничего не найдено" : "Задачи не найдены"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== CURATOR SELECTOR ===== */
function CuratorSelector({ selectedCurator, onSelect }) {
  const curatorsWithCount = useMemo(() => {
    return getAllCurators()
      .filter((c) => (c.taskCount || 0) > 0)
      .sort((a, b) => (b.taskCount || 0) - (a.taskCount || 0));
  }, []);

  return (
    <div className="department-selector">
      <div className="selector-label">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>Выберите куратора</span>
      </div>
      <div
        className="selector-buttons"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
      >
        {curatorsWithCount.map((curator) => {
          const isActive = selectedCurator?.fullName === curator.fullName;
          return (
            <button
              key={curator.fullName}
              className={`dept-button ${isActive ? "active" : ""}`}
              onClick={() => onSelect(isActive ? null : curator)}
            >
              <span className="dept-icon">👤</span>
              <span className="dept-name">{curator.fullName}</span>
              <span
                className="dept-count"
                style={{ color: isActive ? "#fff" : undefined }}
              >
                {curator.taskCount} задач
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== CURATOR SIDEBAR ===== */
function CuratorSidebar({ curator, onClose }) {
  const [expandedTasks, setExpandedTasks] = useState(false);
  const curatorTasks = getCuratorTasks(curator);

  return (
    <div className="curator-sidebar-overlay" onClick={onClose}>
      <div className="curator-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="curator-sidebar-header">
          <div>
            <h2>{curator.fullName}</h2>
            <div className="modal-subtitle">
              {curator.position} · {curator.departmentIcon} {curator.department}{" "}
              ·{" "}
              <strong style={{ color: "#ff416c" }}>
                {curatorTasks.length}
              </strong>{" "}
              просроченных задач
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="curator-sidebar-body">
          {/* Hierarchy */}
          <div className="hierarchy-chain">
            {curator.hierarchy.map((level, i) => (
              <>
                <div className="hierarchy-level" key={i}>
                  <span className="hierarchy-label">
                    {level.split(":")[0].trim()}
                  </span>
                  <span className="hierarchy-name">
                    {level.split(":")[1]?.trim() || level}
                  </span>
                </div>
                {i < curator.hierarchy.length - 1 && (
                  <div className="hierarchy-arrow">↓</div>
                )}
              </>
            ))}
          </div>

          {/* Tasks */}
          <button
            className="expand-tasks-btn"
            onClick={() => setExpandedTasks(!expandedTasks)}
          >
            {expandedTasks ? "▼" : "▶"} Показать задачи ({curatorTasks.length})
          </button>

          {expandedTasks && (
            <div className="employee-tasks-list">
              {curatorTasks.length > 0 ? (
                curatorTasks.map((task, i) => (
                  <div key={i} className="employee-task-item">
                    <div className="task-item-header">
                      <span className="task-id-badge">{task.id}</span>
                      <span className="task-deadline-badge">
                        {task.deadline}
                      </span>
                    </div>
                    <div className="task-topic">{task.topic}</div>
                    <div className="task-meta">
                      <span>Инициатор: {task.initiator}</span>
                      <span>•</span>
                      <span>Исполнитель: {task.executor}</span>
                      <span>•</span>
                      <span>Срок: {task.deadline}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-tasks">Задачи не найдены</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DepartmentSelector({ departments, selectedId, onSelect }) {
  return (
    <div className="department-selector">
      <div className="selector-label">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <path d="M8 7h8M8 11h8M8 15h4" />
        </svg>
        <span>Выберите департамент или отдел</span>
      </div>
      <div className="selector-buttons">
        {departments.map((dept) => {
          const totalTasks = getDeptTotal(dept);
          const isActive = dept.id === selectedId;

          return (
            <button
              key={dept.id}
              className={`dept-button ${isActive ? "active" : ""}`}
              onClick={() => onSelect(dept.id)}
            >
              <span className="dept-icon">
                {DEPARTMENT_ICONS[dept.id] || "🏢"}
              </span>
              <div>
                <span className="dept-name">{dept.shortName}</span>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    marginTop: "0.25rem",
                  }}
                >
                  {dept.name}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: isActive ? "#fff" : "#ff416c",
                    marginTop: "0.25rem",
                  }}
                >
                  {totalTasks} просрочено
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===== TOP EMPLOYEES MODAL ===== */
function TopEmployeesModal({ onClose }) {
  const allEmployees = DATA.departments
    .flatMap((dept) =>
      getAllEmployees(dept).map((emp) => ({
        ...emp,
        deptName: dept.name,
        deptShort: dept.shortName,
        realCount: getEmployeeTaskCount(emp),
      })),
    )
    .sort((a, b) => b.realCount - a.realCount);

  const top20 = allEmployees.slice(0, 20);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Топ сотрудников по просроченным задачам</h2>
            <div className="modal-subtitle">
              Всего:{" "}
              <strong style={{ color: "#ff416c" }}>
                {allEmployees.length}
              </strong>{" "}
              сотрудников
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-table-wrapper">
          <table className="modal-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Сотрудник</th>
                <th>Подразделение</th>
                <th>Департамент</th>
                <th>Просрочено</th>
              </tr>
            </thead>
            <tbody>
              {top20.map((emp, i) => (
                <tr key={i}>
                  <td className="modal-row-num">{i + 1}</td>
                  <td className="modal-emp-name">{emp.fullName}</td>
                  <td>{emp.department}</td>
                  <td>{emp.deptName}</td>
                  <td>
                    <span
                      className={`emp-badge-count ${emp.realCount >= 8 ? "critical" : emp.realCount >= 5 ? "high" : emp.realCount >= 3 ? "medium" : "low"}`}
                    >
                      {emp.realCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===== TOP EMPLOYEE DROPDOWN ===== */
function TopEmployeeDropdown({ onClose }) {
  const [expandedTasks, setExpandedTasks] = useState(false);

  // Find top employee from departments hierarchy
  const findTopEmployee = () => {
    let topEmp = null;
    let maxCount = 0;

    DATA.departments.forEach((dept) => {
      const findInLeadership = (leaders) => {
        if (!leaders) return;
        leaders.forEach((leader) => {
          if (leader.subordinates) {
            leader.subordinates.forEach((sub) => {
              const realCount = getEmployeeTaskCount(sub);
              if (realCount > maxCount) {
                maxCount = realCount;
                topEmp = {
                  ...sub,
                  deptName: dept.name,
                  deptShort: dept.shortName,
                  deptIcon: dept.icon,
                  leaderName: leader.fullName,
                  leaderPosition: leader.position,
                  directorName: leader.subordinates?.[0]?.fullName || "",
                  realCount: realCount,
                };
              }
            });
            findInLeadership([leader]);
          }
        });
      };

      if (dept.leadership) {
        findInLeadership(dept.leadership);
      }
    });

    return { employee: topEmp, maxCount };
  };

  const { employee, maxCount } = findTopEmployee();

  // Get tasks for the top employee
  const employeeTasks = employee ? getEmployeeTasks(employee) : [];

  if (!employee) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal modal-medium"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <h2>Сотрудник с максимальной просрочкой</h2>
            </div>
            <button className="modal-close" onClick={onClose}>
              ✕
            </button>
          </div>
          <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
            Данные не найдены
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Сотрудник с максимальной просрочкой</h2>
            <div className="modal-subtitle">
              <strong style={{ color: "#ff416c" }}>{maxCount}</strong>{" "}
              просроченных задач
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Hierarchy */}
          <div className="hierarchy-chain">
            <div className="hierarchy-level">
              <span className="hierarchy-label">Правление</span>
              <span className="hierarchy-name">Правление банка</span>
            </div>
            <div className="hierarchy-arrow">↓</div>
            <div className="hierarchy-level">
              <span className="hierarchy-label">Первый заместитель</span>
              <span className="hierarchy-name">{employee.leaderName}</span>
            </div>
            <div className="hierarchy-arrow">↓</div>
            <div className="hierarchy-level">
              <span className="hierarchy-label">Руководство</span>
              <span className="hierarchy-name">{employee.fullName}</span>
            </div>
            <div className="hierarchy-arrow">↓</div>
            <div className="hierarchy-level">
              <span className="hierarchy-label">Департамент</span>
              <span className="hierarchy-name">
                {employee.deptIcon} {employee.deptName}
              </span>
            </div>
          </div>

          {/* Employee card */}
          <div className="top-employee-detail">
            <div className="top-emp-detail-header">
              <div className="top-emp-detail-avatar">
                {employee.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)}
              </div>
              <div className="top-emp-detail-info">
                <div className="top-emp-detail-name">{employee.fullName}</div>
                <div className="top-emp-detail-dept">{employee.department}</div>
                <div className="top-emp-detail-count">{maxCount} задач</div>
              </div>
            </div>

            {/* Expandable tasks */}
            <button
              className="expand-tasks-btn"
              onClick={() => setExpandedTasks(!expandedTasks)}
            >
              {expandedTasks ? "▼" : "▶"} Показать задачи (
              {employeeTasks.length})
            </button>

            {expandedTasks && (
              <div className="employee-tasks-list">
                {employeeTasks.length > 0 ? (
                  employeeTasks.map((task, i) => (
                    <div key={i} className="employee-task-item">
                      <div className="task-item-header">
                        <span className="task-id-badge">{task.id}</span>
                        <span className="task-deadline-badge">
                          {task.deadline}
                        </span>
                      </div>
                      <div className="task-topic">{task.topic}</div>
                      <div className="task-meta">
                        <span>Исполнитель: {task.executor}</span>
                        <span>•</span>
                        <span>Срок: {task.deadline}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-tasks">Задачи не найдены</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== TOP DEPARTMENT DROPDOWN ===== */
function TopDeptDropdown({ onClose }) {
  const deptTotals = DATA.departments
    .map((d) => ({
      ...d,
      total: getDeptTotal(d),
    }))
    .sort((a, b) => b.total - a.total);

  const topDept = deptTotals[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Подразделение с максимальной просрочкой</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="top-dept-content">
          {deptTotals.map((dept, i) => (
            <div
              key={i}
              className={`top-dept-row ${i === 0 ? "top-dept-first" : ""}`}
            >
              <div className="top-dept-rank">{i + 1}</div>
              <div className="top-dept-info">
                <div className="top-dept-name">
                  {DEPARTMENT_ICONS[dept.id] || "🏢"} {dept.name}
                </div>
                <div className="top-dept-sub">
                  {getDeptEmpCount(dept)} сотрудников · {dept.total} задач
                </div>
              </div>
              <div className="top-dept-count">{dept.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== TASK TABLE MODAL ===== */
function TaskTableModal({ onClose }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return DATA.tasks;
    const q = searchQuery.toLowerCase();
    return DATA.tasks.filter(
      (task) =>
        task.topic.toLowerCase().includes(q) ||
        task.id.toLowerCase().includes(q) ||
        task.executor.toLowerCase().includes(q) ||
        task.initiator.toLowerCase().includes(q) ||
        task.curator.toLowerCase().includes(q) ||
        task.deadline.includes(q) ||
        task.dept.toLowerCase().includes(q) ||
        task.initiatorDept.toLowerCase().includes(q) ||
        task.executorDept.toLowerCase().includes(q) ||
        task.supervisingDept.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-task" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Все просроченные задачи</h2>
            <div className="modal-subtitle">
              Всего:{" "}
              <strong style={{ color: "#ff416c" }}>{DATA.tasks.length}</strong>{" "}
              задач
              {searchQuery && (
                <span>
                  {" "}
                  · Найдено:{" "}
                  <strong style={{ color: "#667eea" }}>
                    {filteredTasks.length}
                  </strong>
                </span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="task-search task-search-table">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Поиск по всем полям (ID, тема, исполнитель, инициатор, куратор, подразделение, срок)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>

        <div className="modal-table-wrapper">
          <table className="modal-table modal-table-tasks">
            <thead>
              <tr>
                <th>Дата старта</th>
                <th>Инициатор</th>
                <th>Подразделение инициатора</th>
                <th>Срок</th>
                <th>Исполнитель</th>
                <th>Подразделение исполнителя</th>
                <th>Вышестоящее подразделение</th>
                <th>Должность куратора</th>
                <th>Куратор</th>
                <th>Подразделение</th>
                <th>Тема задания</th>
                <th>Ссылка</th>
                <th>Ид задачи</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, i) => (
                <tr key={i}>
                  <td>{task.startDate}</td>
                  <td>{task.initiator}</td>
                  <td>{task.initiatorDept}</td>
                  <td>
                    <span className="overdue-badge">{task.deadline}</span>
                  </td>
                  <td>{task.executor}</td>
                  <td>{task.executorDept}</td>
                  <td>{task.supervisingDept}</td>
                  <td>{task.curatorPosition}</td>
                  <td>{task.curator}</td>
                  <td>{task.dept}</td>
                  <td className="modal-topic-cell">{task.topic}</td>
                  <td>
                    <a
                      href={task.link}
                      className="task-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Перейти →
                    </a>
                  </td>
                  <td>
                    <span className="task-id">{task.id}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function OverdueTasksDashboard() {
  const [visible, setVisible] = useState(false);
  const [selectedDept, setSelectedDept] = useState("treasury");
  const [downloading, setDownloading] = useState(false);
  const [showTopEmployees, setShowTopEmployees] = useState(false);
  const [showTopEmployee, setShowTopEmployee] = useState(false);
  const [showTopDept, setShowTopDept] = useState(false);
  const [showTaskTable, setShowTaskTable] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedCurator, setSelectedCurator] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const dashboardRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    const el = dashboardRef.current;
    if (!el) return;

    try {
      const canvas = await html2canvas(el, {
        backgroundColor: "#1a1640",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `overdue-tasks-${currentDept.shortName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // fallback
    } finally {
      setDownloading(false);
    }
  };

  const currentDept = useMemo(
    () =>
      DATA.departments.find((d) => d.id === selectedDept) ||
      DATA.departments[0],
    [selectedDept],
  );

  const employees = getAllEmployees(currentDept);
  const totalCount = employees.reduce(
    (sum, e) => sum + getEmployeeTaskCount(e),
    0,
  );
  const MAX_COUNT = Math.max(
    ...employees.map((e) => getEmployeeTaskCount(e)),
    1,
  );

  // Global stats

  const grandTotal = DATA.departments.reduce((s, d) => s + getDeptTotal(d), 0);
  const totalEmp = DATA.departments.reduce((s, d) => s + getDeptEmpCount(d), 0);
  const avg = (grandTotal / totalEmp).toFixed(1);
  const maxDept = DATA.departments.reduce(
    (best, d) => {
      const t = getDeptTotal(d);
      return t > best.total ? { name: d.shortName, total: t } : best;
    },
    { name: "", total: 0 },
  );

  // Find employee with max overdue across all departments
  const allEmployeesGlobal = DATA.departments.flatMap((d) =>
    getAllEmployees(d),
  );
  const topEmployee = allEmployeesGlobal.sort(
    (a, b) => getEmployeeTaskCount(b) - getEmployeeTaskCount(a),
  )[0];

  /**
   * Суммирует поле count для всех subDepartments.
   * @param {Object} data - объект с departments
   * @returns {number} суммарный count по всем subDepartments
   */
  function sumSubdepartmentCounts(data) {
    const departments = data?.departments || [];
    let total = 0;

    departments.forEach((dept) => {
      const subDepts = dept?.subDepartments || [];
      subDepts.forEach((sub) => {
        const count = sub?.count;
        if (typeof count === "number" && Number.isFinite(count)) {
          total += count;
        }
        // Если count отсутствует или не число — можно логировать, если нужно для мониторинга
        // console.warn('Missing or invalid count in subDepartment:', sub.id);
      });
    });

    return total;
  }

  return (
    <div className={`dashboard ${visible ? "visible" : ""}`} ref={dashboardRef}>
      {/* Modals at top */}
      {showTopEmployees && (
        <TopEmployeesModal onClose={() => setShowTopEmployees(false)} />
      )}
      {showTopEmployee && (
        <TopEmployeeDropdown onClose={() => setShowTopEmployee(false)} />
      )}
      {showTopDept && <TopDeptDropdown onClose={() => setShowTopDept(false)} />}
      {showTaskTable && (
        <TaskTableModal onClose={() => setShowTaskTable(false)} />
      )}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
      {selectedCurator && (
        <CuratorSidebar
          curator={selectedCurator}
          onClose={() => setSelectedCurator(null)}
        />
      )}

      <div className="dashboard-header">
        <div className="header-top">
          <div className="department-badge">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <path d="M8 7h8M8 11h8M8 15h4" />
            </svg>
            <span>Просроченные задачи</span>
          </div>
        </div>
        <div className="summary-cards">
          <div
            className="summary-card total clickable"
            onClick={() => setShowTaskTable(true)}
          >
            <div className="summary-icon">📋</div>
            <div className="summary-text">
              <span className="summary-number">{DATA.tasks.length}</span>
              <span className="summary-label">Всего просрочено</span>
            </div>
          </div>
          <div
            className="summary-card employees clickable"
            onClick={() => setShowTopEmployees(true)}
          >
            <div className="summary-icon">👥</div>
            <div className="summary-text">
              <span className="summary-number">{totalEmp}</span>
              <span className="summary-label">Сотрудников</span>
            </div>
          </div>
          <div
            className="summary-card average clickable"
            onClick={() => setShowTopEmployee(true)}
          >
            <div className="summary-icon">📊</div>
            <div className="summary-text">
              <span
                className="summary-number"
                style={{ fontSize: "0.85rem", textAlign: "center" }}
              >
                {topEmployee
                  ? topEmployee.fullName.split(" ").slice(0, 2).join(" ")
                  : "—"}
              </span>
              <span className="summary-label">
                {topEmployee ? `${topEmployee.count} просрочено` : "В среднем"}
              </span>
            </div>
          </div>
          <div
            className="summary-card maxdept clickable"
            onClick={() => setShowTopDept(true)}
          >
            <div className="summary-icon">🏆</div>
            <div className="summary-text">
              <span className="summary-number">{maxDept.name}</span>
              <span className="summary-label">
                Больше всего ({maxDept.total})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Search */}
      <div className="global-search">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Поиск сотрудника по ФИО, отделу или задачам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery("")}>
            ✕
          </button>
        )}
      </div>

      <CuratorSelector
        selectedCurator={selectedCurator}
        onSelect={setSelectedCurator}
      />

      <div className="department-selector">
        <div className="dept-sections-grid">
          <div className="selector-label">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Выберите департамент</span>
          </div>

          {DATA.departments.map((dept, index) => (
            <DepartmentSection
              key={dept.id}
              department={dept}
              sectionIndex={index}
              onEmployeeClick={setSelectedEmployee}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      </div>

      <div className="footer-note">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <span>
          Данные обновлены:{" "}
          {new Date().toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
