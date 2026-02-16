/**
 * Report Generation Utility
 * Generate PDF and CSV reports for analytics data
 */

/**
 * Generate CSV from data array
 * @param {Array} data - Array of objects to convert to CSV
 * @param {Array} columns - Column definitions [{key, label}]
 * @returns {string} CSV string
 */
export const generateCSV = (data, columns) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Header row
  const headers = columns.map(col => col.label || col.key).join(',');

  // Data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];

      // Format value
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (typeof value === 'string' && value.includes(',')) {
        value = `"${value}"`;
      }

      return value;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent, filename = 'report.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Generate Activity Report CSV
 */
export const generateActivityReportCSV = (activities) => {
  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'userName', label: 'User' },
    { key: 'userRole', label: 'Role' },
    { key: 'action', label: 'Action' },
    { key: 'entityType', label: 'Entity Type' },
    { key: 'entityTitle', label: 'Entity' }
  ];

  const formattedData = activities.map(activity => ({
    date: new Date(activity.timestamp).toLocaleString(),
    userName: activity.userName,
    userRole: activity.userRole,
    action: activity.action,
    entityType: activity.entityType,
    entityTitle: activity.entityTitle
  }));

  return generateCSV(formattedData, columns);
};

/**
 * Generate Project Report CSV
 */
export const generateProjectReportCSV = (projects) => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'stage', label: 'Stage' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'creator', label: 'Creator' },
    { key: 'editor', label: 'Editor' },
    { key: 'platform', label: 'Platform' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'lastUpdated', label: 'Last Updated' }
  ];

  const formattedData = projects.map(project => ({
    id: project.id,
    title: project.title,
    stage: project.stage,
    status: project.status,
    priority: project.priority,
    creator: project.creator,
    editor: project.editor,
    platform: project.platform,
    dueDate: project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '',
    lastUpdated: new Date(project.lastUpdated).toLocaleDateString()
  }));

  return generateCSV(formattedData, columns);
};

/**
 * Generate Task Report CSV
 */
export const generateTaskReportCSV = (tasks) => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'completed', label: 'Completed' },
    { key: 'createdAt', label: 'Created' }
  ];

  const formattedData = tasks.map(task => ({
    id: task.id,
    title: task.title || task.task,
    status: task.status,
    priority: task.priority,
    assignee: task.userName,
    dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
    completed: task.done || task.status === 'done' ? 'Yes' : 'No',
    createdAt: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ''
  }));

  return generateCSV(formattedData, columns);
};

/**
 * Generate User Report CSV
 */
export const generateUserReportCSV = (users) => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'isActive', label: 'Status' },
    { key: 'createdAt', label: 'Joined Date' }
  ];

  const formattedData = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber || '',
    isActive: user.isActive !== false ? 'Active' : 'Inactive',
    createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
  }));

  return generateCSV(formattedData, columns);
};

/**
 * Generate PDF Report (simplified version)
 * Note: For full PDF generation, consider using jsPDF or pdfmake library
 */
export const generatePDFReport = async (reportData) => {
  const {
    title = 'Report',
    timeRange = 'Last 7 Days',
    sections = []
  } = reportData;

  // Simple HTML-to-PDF approach
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          background: white;
          color: #333;
        }
        h1 {
          color: #6366f1;
          border-bottom: 3px solid #6366f1;
          padding-bottom: 10px;
        }
        h2 {
          color: #4f46e5;
          margin-top: 30px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .metric {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin: 10px 0;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #6366f1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 12px;
          text-align: left;
        }
        th {
          background: #f9fafb;
          font-weight: 600;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div>
          <strong>Period:</strong> ${timeRange}<br>
          <strong>Generated:</strong> ${new Date().toLocaleString()}
        </div>
      </div>

      ${sections.map(section => `
        <h2>${section.title}</h2>
        ${section.content}
      `).join('')}

      <div class="footer">
        Generated by Incrix Studios OS | Super Admin Dashboard
      </div>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_')}_${Date.now()}.html`;
  link.click();
  URL.revokeObjectURL(url);

  // Note: For actual PDF, use window.print() or integrate jsPDF
  return htmlContent;
};

/**
 * Generate comprehensive analytics report
 */
export const generateComprehensiveReport = (data) => {
  const { projects, tasks, users, activities, timeRange } = data;

  // Calculate metrics
  const completedProjects = projects.filter(p => p.stage === 'Done').length;
  const completedTasks = tasks.filter(t => t.done || t.status === 'done').length;
  const activeUsers = users.filter(u => u.isActive !== false).length;

  const sections = [
    {
      title: 'Executive Summary',
      content: `
        <div class="metric">
          <div>Total Projects: <span class="metric-value">${projects.length}</span></div>
          <div>Completed: ${completedProjects} (${((completedProjects/projects.length)*100).toFixed(1)}%)</div>
        </div>
        <div class="metric">
          <div>Total Tasks: <span class="metric-value">${tasks.length}</span></div>
          <div>Completed: ${completedTasks} (${((completedTasks/tasks.length)*100).toFixed(1)}%)</div>
        </div>
        <div class="metric">
          <div>Active Users: <span class="metric-value">${activeUsers}</span></div>
          <div>Total: ${users.length}</div>
        </div>
      `
    },
    {
      title: 'Project Breakdown',
      content: `
        <table>
          <tr>
            <th>Stage</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
          ${['Backlog', 'Scripting', 'Shooting', 'Editing', 'Review', 'Done'].map(stage => {
            const count = projects.filter(p => p.stage === stage).length;
            return `
              <tr>
                <td>${stage}</td>
                <td>${count}</td>
                <td>${((count/projects.length)*100).toFixed(1)}%</td>
              </tr>
            `;
          }).join('')}
        </table>
      `
    },
    {
      title: 'Team Activity',
      content: `
        <div>Total Activities: <strong>${activities.length}</strong></div>
        <div>Most active period: Last ${timeRange}</div>
      `
    }
  ];

  return {
    title: `Analytics Report - ${timeRange}`,
    timeRange,
    sections
  };
};

export default {
  generateCSV,
  downloadCSV,
  generateActivityReportCSV,
  generateProjectReportCSV,
  generateTaskReportCSV,
  generateUserReportCSV,
  generatePDFReport,
  generateComprehensiveReport
};
