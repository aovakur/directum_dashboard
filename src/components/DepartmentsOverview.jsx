import { useEffect, useState } from "react";
import DATA from "./../../data.json";
import "./DepartmentsOverview.css";

/* ===== TOP EMPLOYEES MODAL ===== */
function TopEmployeesModal({ onClose }) {
  const allEmployees = DATA.departments
    .flatMap((dept) =>
      dept.employees.map((emp) => ({
        ...emp,
        deptName: dept.name,
        deptShort: dept.shortName,
      })),
    )
    .sort((a, b) => b.count - a.count);

  const top20 = allEmployees.slice(0, 20);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-large"
        onClick={(e) => e.stopPropagation()}
      >
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
                      className={`emp-badge-count ${emp.count >= 8 ? "critical" : emp.count >= 5 ? "high" : emp.count >= 3 ? "medium" : "low"}`}
                    >
                      {emp.count}
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
  const allEmployees = DATA.departments
    .flatMap((dept) =>
      dept.employees.map((emp) => ({ ...emp, deptName: dept.name })),
    )
    .sort((a, b) => b.count - a.count);

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
        <div className="top-employee-content">
          {allEmployees.slice(0, 10).map((emp, i) => (
            <div
              key={i}
              className={`top-emp-row ${i === 0 ? "top-emp-first" : ""}`}
            >
              <div className="top-emp-rank">{i + 1}</div>
              <div className="top-emp-info">
                <div className="top-emp-name">{emp.fullName}</div>
                <div className="top-emp-dept">
                  {emp.deptName} · {emp.department}
                </div>
              </div>
              <div className="top-emp-count">{emp.count}</div>
            </div>
          ))}
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
      total: d.employees.reduce((s, e) => s + e.count, 0),
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-medium"
        onClick={(e) => e.stopPropagation()}
      >
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
                  {dept.icon} {dept.name}
                </div>
                <div className="top-dept-sub">
                  {dept.employees.length} сотрудников · {dept.total} задач
                </div>
              </div>
              <div className="top-dept-count">{dept.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DepartmentSection({ department, globalMax, sectionIndex }) {
  const totalTasks = department.employees.reduce((sum, e) => sum + e.count, 0);
  const localMax = Math.max(...department.employees.map((e) => e.count));

  const sortedEmployees = [...department.employees].sort(
    (a, b) => b.count - a.count,
  );

  return (
    <div
      className="dept-section"
      style={{ animationDelay: `${sectionIndex * 0.15}s` }}
    >
      <div className="dept-section-header">
        <span className="dept-section-icon">{department.icon}</span>
        <div className="dept-section-title-group">
          <h2 className="dept-section-title">{department.shortName}</h2>
          <p className="dept-section-subtitle">{department.name}</p>
        </div>
        <div className="dept-section-total">
          <span className="dept-section-total-number">{totalTasks}</span>
          <span className="dept-section-total-label">просрочено</span>
        </div>
      </div>

      <div className="dept-employees">
        {sortedEmployees.map((employee, index) => (
          <EmployeeRow
            key={employee.fullName}
            employee={employee}
            index={index}
            maxValue={localMax}
          />
        ))}
      </div>
    </div>
  );
}

function EmployeeRow({ employee, index, maxValue }) {
  const percentage = (employee.count / maxValue) * 100;
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setAnimatedWidth(percentage),
      200 + index * 150,
    );
    return () => clearTimeout(timer);
  }, [percentage, index]);

  const barColor =
    employee.count >= 6
      ? "linear-gradient(90deg, #ff416c, #ff4b2b)"
      : "linear-gradient(90deg, #f7971e, #ffd200)";

  const initials = `${employee.lastName[0]}${employee.firstName[0]}`;

  return (
    <div
      className="employee-row"
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
        <span className="employee-row-count-number">{employee.count}</span>
        <span className="employee-row-count-label">задач</span>
      </div>
    </div>
  );
}

export default function DepartmentsOverview() {
  const [visible, setVisible] = useState(false);
  const [showTopEmployees, setShowTopEmployees] = useState(false);
  const [showTopEmployee, setShowTopEmployee] = useState(false);
  const [showTopDept, setShowTopDept] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const grandTotal = DATA.departments.reduce(
    (sum, d) => sum + d.employees.reduce((s, e) => s + e.count, 0),
    0,
  );
  const totalEmployees = DATA.departments.reduce(
    (sum, d) => sum + d.employees.length,
    0,
  );
  const avg = (grandTotal / totalEmployees).toFixed(1);

  // Find department with max overdue
  const maxDept = DATA.departments.reduce((best, d) => {
    const t = d.employees.reduce((s, e) => s + e.count, 0);
    return t > best.total ? { name: d.shortName, total: t } : best;
  }, { name: "", total: 0 });

  return (
    <div className={`departments-overview ${visible ? "visible" : ""}`}>
      <div className="overview-header">
        <h1 className="overview-title">Просроченные задачи по отделам</h1>
        <p className="overview-subtitle">
          Данные обновлены:{" "}
          {new Date().toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="overview-summary">
        <div className="summary-item clickable" onClick={() => setShowTopEmployees(true)}>
          <span className="summary-item-number">{grandTotal}</span>
          <span className="summary-item-label">Всего просрочено</span>
        </div>
        <div className="summary-item clickable" onClick={() => setShowTopEmployees(true)}>
          <span className="summary-item-number">{totalEmployees}</span>
          <span className="summary-item-label">Сотрудников</span>
        </div>
        <div className="summary-item clickable" onClick={() => setShowTopEmployee(true)}>
          <span className="summary-item-number">{avg}</span>
          <span className="summary-item-label">В среднем на сотрудника</span>
        </div>
        <div className="summary-item clickable" onClick={() => setShowTopDept(true)}>
          <span className="summary-item-number">{maxDept.name}</span>
          <span className="summary-item-label">
            Больше всего ({maxDept.total})
          </span>
        </div>
      </div>

      <div className="overview-departments">
        {DATA.departments.map((dept, index) => (
          <DepartmentSection
            key={dept.id}
            department={dept}
            sectionIndex={index}
          />
        ))}
      </div>

      {showTopEmployees && (
        <TopEmployeesModal onClose={() => setShowTopEmployees(false)} />
      )}
      {showTopEmployee && (
        <TopEmployeeDropdown onClose={() => setShowTopEmployee(false)} />
      )}
      {showTopDept && (
        <TopDeptDropdown onClose={() => setShowTopDept(false)} />
      )}
    </div>
  );
}
