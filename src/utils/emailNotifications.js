/**
 * Email Notification System
 * Send email notifications for important events
 */

/**
 * Email Templates
 */
const EMAIL_TEMPLATES = {
  ROLE_CHANGED: {
    subject: (data) => `Your role has been updated to ${data.newRole}`,
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Role Update</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #333;">Hi ${data.userName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Your role has been updated in the Incrix Studios OS system.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 10px; color: #999;">Previous Role:</td>
                <td style="padding: 10px; font-weight: bold; color: #333;">${data.oldRole}</td>
              </tr>
              <tr>
                <td style="padding: 10px; color: #999;">New Role:</td>
                <td style="padding: 10px; font-weight: bold; color: #667eea;">${data.newRole}</td>
              </tr>
              <tr>
                <td style="padding: 10px; color: #999;">Updated By:</td>
                <td style="padding: 10px; color: #333;">${data.updatedBy}</td>
              </tr>
            </table>
          </div>
          <p style="color: #666; line-height: 1.6;">
            This change may affect your permissions and access to certain features. Please log in to view your updated permissions.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Log In to Dashboard
            </a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Incrix Studios OS | Team Management System</p>
          <p>If you have questions, contact your administrator.</p>
        </div>
      </div>
    `
  },

  USER_CREATED: {
    subject: (data) => `Welcome to Incrix Studios OS!`,
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to the Team! 🎉</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #333;">Hi ${data.userName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Your account has been created in Incrix Studios OS. Here are your account details:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 10px; color: #999;">Email:</td>
                <td style="padding: 10px; font-weight: bold; color: #333;">${data.email}</td>
              </tr>
              <tr>
                <td style="padding: 10px; color: #999;">Role:</td>
                <td style="padding: 10px; font-weight: bold; color: #667eea;">${data.role}</td>
              </tr>
              <tr>
                <td style="padding: 10px; color: #999;">Created By:</td>
                <td style="padding: 10px; color: #333;">${data.createdBy}</td>
              </tr>
            </table>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Please set up your password and complete your profile to get started.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.setupUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Set Up Account
            </a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Incrix Studios OS | Team Management System</p>
        </div>
      </div>
    `
  },

  TASK_ASSIGNED: {
    subject: (data) => `New task assigned: ${data.taskTitle}`,
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Task Assigned 📋</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #333;">Hi ${data.userName},</h2>
          <p style="color: #666; line-height: 1.6;">
            You have been assigned a new task:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #333;">${data.taskTitle}</h3>
            ${data.taskDescription ? `<p style="color: #666;">${data.taskDescription}</p>` : ''}
            <table style="width: 100%; margin-top: 15px;">
              <tr>
                <td style="padding: 5px; color: #999;">Priority:</td>
                <td style="padding: 5px; font-weight: bold; color: #333;">${data.priority}</td>
              </tr>
              <tr>
                <td style="padding: 5px; color: #999;">Due Date:</td>
                <td style="padding: 5px; font-weight: bold; color: #f59e0b;">${data.dueDate}</td>
              </tr>
              <tr>
                <td style="padding: 5px; color: #999;">Assigned By:</td>
                <td style="padding: 5px; color: #333;">${data.assignedBy}</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.taskUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Task
            </a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Incrix Studios OS | Task Management</p>
        </div>
      </div>
    `
  },

  ACCOUNT_DEACTIVATED: {
    subject: (data) => `Your account has been deactivated`,
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Account Deactivated</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #333;">Hi ${data.userName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Your account in Incrix Studios OS has been deactivated by ${data.deactivatedBy}.
          </p>
          <p style="color: #666; line-height: 1.6;">
            You will no longer have access to the system. If you believe this is a mistake, please contact your administrator.
          </p>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Incrix Studios OS | Team Management System</p>
        </div>
      </div>
    `
  },

  WEEKLY_REPORT: {
    subject: (data) => `Weekly Report - ${data.weekRange}`,
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Weekly Performance Report 📊</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #333;">Week of ${data.weekRange}</h2>
          <p style="color: #666; line-height: 1.6;">
            Here's a summary of your team's performance this week:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Key Metrics</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 10px; color: #999;">Projects Completed:</td>
                <td style="padding: 10px; font-weight: bold; color: #10b981;">${data.completedProjects}</td>
              </tr>
              <tr>
                <td style="padding: 10px; color: #999;">Tasks Completed:</td>
                <td style="padding: 10px; font-weight: bold; color: #10b981;">${data.completedTasks}</td>
              </tr>
              <tr>
                <td style="padding: 10px; color: #999;">Team Activity:</td>
                <td style="padding: 10px; font-weight: bold; color: #667eea;">${data.totalActivities} actions</td>
              </tr>
              <tr>
                <td style="padding: 10px; color: #999;">Active Users:</td>
                <td style="padding: 10px; font-weight: bold; color: #333;">${data.activeUsers}</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Report
            </a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>Incrix Studios OS | Analytics Dashboard</p>
        </div>
      </div>
    `
  }
};

/**
 * Send email (mock implementation)
 * Replace with actual email service (SendGrid, AWS SES, etc.)
 */
const sendEmail = async (to, subject, html) => {
  console.log('[Email] Sending to:', to);
  console.log('[Email] Subject:', subject);

  // TODO: Integrate with actual email service
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to, from: 'noreply@incrixstudios.com', subject, html });

  // For now, just log
  return {
    success: true,
    messageId: `mock-${Date.now()}`
  };
};

/**
 * Send role change notification
 */
export const notifyRoleChange = async (user, oldRole, newRole, updatedBy) => {
  const template = EMAIL_TEMPLATES.ROLE_CHANGED;
  const data = {
    userName: user.name,
    oldRole,
    newRole,
    updatedBy: updatedBy.name,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
  };

  return sendEmail(
    user.email,
    template.subject(data),
    template.html(data)
  );
};

/**
 * Send welcome email for new user
 */
export const notifyUserCreated = async (user, createdBy) => {
  const template = EMAIL_TEMPLATES.USER_CREATED;
  const data = {
    userName: user.name,
    email: user.email,
    role: user.role,
    createdBy: createdBy.name,
    setupUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup-account?token=${user.id}`
  };

  return sendEmail(
    user.email,
    template.subject(data),
    template.html(data)
  );
};

/**
 * Send task assignment notification
 */
export const notifyTaskAssigned = async (user, task, assignedBy) => {
  const template = EMAIL_TEMPLATES.TASK_ASSIGNED;
  const data = {
    userName: user.name,
    taskTitle: task.title || task.task,
    taskDescription: task.description || '',
    priority: task.priority || 'Medium',
    dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set',
    assignedBy: assignedBy.name,
    taskUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasks`
  };

  return sendEmail(
    user.email,
    template.subject(data),
    template.html(data)
  );
};

/**
 * Send account deactivation notification
 */
export const notifyAccountDeactivated = async (user, deactivatedBy) => {
  const template = EMAIL_TEMPLATES.ACCOUNT_DEACTIVATED;
  const data = {
    userName: user.name,
    deactivatedBy: deactivatedBy.name
  };

  return sendEmail(
    user.email,
    template.subject(data),
    template.html(data)
  );
};

/**
 * Send weekly report to super admins
 */
export const sendWeeklyReport = async (adminUsers, reportData) => {
  const template = EMAIL_TEMPLATES.WEEKLY_REPORT;

  const promises = adminUsers.map(admin => {
    const data = {
      ...reportData,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/dashboard`
    };

    return sendEmail(
      admin.email,
      template.subject(data),
      template.html(data)
    );
  });

  return Promise.all(promises);
};

export default {
  notifyRoleChange,
  notifyUserCreated,
  notifyTaskAssigned,
  notifyAccountDeactivated,
  sendWeeklyReport,
  sendEmail
};
