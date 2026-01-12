/**
 * Employee/Admin Email Service
 * 
 * Sends weekly task summaries to employees/admins about their clients' tasks
 */

import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const prisma = new PrismaClient();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmployeeEmailRecipient {
  name: string;
  email: string;
}

/**
 * Generates HTML email for employee/admin weekly task summary
 */
function generateEmployeeWeeklyEmail(tasks: any[], weekStart: Date, weekEnd: Date): string {
  // Group tasks by client
  const tasksByClient = tasks.reduce((acc, task) => {
    const clientName = task.user.businessName || task.user.name || task.user.email;
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  const clientCount = Object.keys(tasksByClient).length;
  const totalTasks = tasks.length;
  const urgentTasks = tasks.filter(t => t.priority === 'URGENT').length;
  const highTasks = tasks.filter(t => t.priority === 'HIGH').length;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Tasks Summary - BerganCo SEO</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif; line-height: 1.6; color: #FFFFFF; max-width: 800px; margin: 0 auto; padding: 32px 24px; background-color: #1C1C1E;">
  
  <div style="background-color: #2C2C2E; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); border: 1px solid #48484A;">
    
    <!-- Logo Header -->
    <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #48484A; padding-bottom: 24px;">
      <img src="https://framerusercontent.com/images/AhyGPdkv1Kr9JeLtiQvJBU0uJE.png?scale-down-to=1024&width=2088&height=518" alt="StuchAI Logo" style="max-width: 200px; height: auto;" />
    </div>
    
    <!-- Header -->
    <div style="margin-bottom: 32px;">
      <h1 style="margin: 0 0 8px 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Weekly Tasks Summary</h1>
      <p style="margin: 0; color: #98989D; font-size: 17px;">
        Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}
      </p>
    </div>
    
    <!-- Summary Stats -->
    <div style="margin-bottom: 40px; padding: 20px; background: #1C1C1E; border: 1px solid #48484A; border-radius: 12px;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        <div>
          <div style="font-size: 13px; color: #98989D; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Clients</div>
          <div style="font-size: 32px; font-weight: 700; color: #0A84FF;">${clientCount}</div>
        </div>
        <div>
          <div style="font-size: 13px; color: #98989D; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Total Tasks</div>
          <div style="font-size: 32px; font-weight: 700; color: #FFFFFF;">${totalTasks}</div>
        </div>
        ${urgentTasks > 0 ? `
        <div>
          <div style="font-size: 13px; color: #98989D; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Urgent</div>
          <div style="font-size: 32px; font-weight: 700; color: #FF453A;">${urgentTasks}</div>
        </div>
        ` : ''}
        ${highTasks > 0 ? `
        <div>
          <div style="font-size: 13px; color: #98989D; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">High Priority</div>
          <div style="font-size: 32px; font-weight: 700; color: #FF9F0A;">${highTasks}</div>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Tasks by Client -->
    <h2 style="font-size: 22px; font-weight: 600; color: #FFFFFF; margin-bottom: 24px;">Tasks by Client</h2>
    
    ${Object.entries(tasksByClient).map(([clientName, clientTasks]) => {
      const pendingCount = clientTasks.filter(t => t.status === 'PENDING').length;
      const inProgressCount = clientTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const completedCount = clientTasks.filter(t => t.status === 'COMPLETED').length;
      
      return `
        <div style="margin-bottom: 32px; padding: 24px; background: #1C1C1E; border: 1px solid #48484A; border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 20px; font-weight: 600; color: #FFFFFF; margin: 0;">${clientName}</h3>
            <div style="display: flex; gap: 8px;">
              ${pendingCount > 0 ? `<span style="padding: 4px 8px; background: rgba(152, 152, 157, 0.2); color: #98989D; border-radius: 6px; font-size: 12px; font-weight: 600;">${pendingCount} Pending</span>` : ''}
              ${inProgressCount > 0 ? `<span style="padding: 4px 8px; background: rgba(10, 132, 255, 0.2); color: #0A84FF; border-radius: 6px; font-size: 12px; font-weight: 600;">${inProgressCount} In Progress</span>` : ''}
              ${completedCount > 0 ? `<span style="padding: 4px 8px; background: rgba(48, 209, 88, 0.2); color: #30D158; border-radius: 6px; font-size: 12px; font-weight: 600;">${completedCount} Completed</span>` : ''}
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${clientTasks.map(task => {
              const priorityColors = {
                LOW: '#98989D',
                MEDIUM: '#0A84FF',
                HIGH: '#FF9F0A',
                URGENT: '#FF453A'
              };
              const priorityColor = priorityColors[task.priority as keyof typeof priorityColors] || '#98989D';
              const isAI = task.isAiGenerated;
              
              return `
                <div style="padding: 16px; background: #2C2C2E; border: 1px solid #48484A; border-radius: 8px; ${isAI ? 'border-left: 3px solid #0A84FF;' : ''}">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div style="flex: 1;">
                      <div style="font-size: 17px; font-weight: 600; color: #FFFFFF; margin-bottom: 4px;">
                        ${task.title}
                        ${isAI ? '<span style="margin-left: 8px; padding: 2px 6px; background: rgba(10, 132, 255, 0.2); color: #0A84FF; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">AI</span>' : ''}
                      </div>
                      <div style="font-size: 14px; color: #98989D; line-height: 1.5;">${task.description}</div>
                    </div>
                    <span style="padding: 4px 8px; background: rgba(${priorityColor === '#FF453A' ? '255, 69, 58' : priorityColor === '#FF9F0A' ? '255, 159, 10' : priorityColor === '#0A84FF' ? '10, 132, 255' : '152, 152, 157'}, 0.2); color: ${priorityColor}; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; white-space: nowrap; margin-left: 12px;">
                      ${task.priority}
                    </span>
                  </div>
                  <div style="font-size: 13px; color: #98989D;">
                    Due: <strong style="color: #E5E5EA;">${format(new Date(task.dueDate), 'MMM d, yyyy')}</strong>
                    <span style="margin: 0 8px;">•</span>
                    Status: <strong style="color: #E5E5EA;">${task.status.replace('_', ' ')}</strong>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('')}

    <!-- Quick Actions -->
    <div style="margin-top: 40px; padding: 24px; background: #1C1C1E; border: 1px solid #0A84FF; border-radius: 12px;">
      <h3 style="font-size: 18px; font-weight: 600; color: #FFFFFF; margin-bottom: 12px;">Quick Access</h3>
      <p style="font-size: 15px; color: #E5E5EA; margin-bottom: 16px;">Manage all tasks in your employee portal:</p>
      <a href="${process.env.APP_URL || 'https://berganco-seo-reporting-production.up.railway.app'}/employee" style="display: inline-block; padding: 12px 24px; background: #0A84FF; color: #FFFFFF; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 17px;">
        Go to Employee Portal →
      </a>
    </div>
    
    <!-- Footer -->
    <div style="border-top: 1px solid #48484A; padding-top: 24px; margin-top: 32px; text-align: center;">
      <p style="margin: 0; color: #98989D; font-size: 13px;">This email was automatically sent by BerganCo SEO Monitoring System</p>
      <p style="margin: 8px 0 0 0; color: #98989D; font-size: 13px;">Powered by Stuchai LLC</p>
    </div>

  </div>

</body>
</html>
  `;
}

/**
 * Sends weekly task summary to employees/admins
 */
export async function sendEmployeeWeeklySummary(recipients: EmployeeEmailRecipient[]) {
  const emailFrom = process.env.SMTP_USER || process.env.REPORT_EMAIL_FROM;
  
  if (!emailFrom || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('SMTP configuration missing. Cannot send employee email.');
  }

  if (!recipients || recipients.length === 0) {
    throw new Error('No recipients provided for employee weekly summary.');
  }

  // Get current week's date range
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

  // Fetch all tasks for the current week
  const tasks = await prisma.task.findMany({
    where: {
      weekStartDate: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          businessName: true,
        },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
    ],
  });

  if (tasks.length === 0) {
    console.log('No tasks found for this week, skipping employee email');
    return;
  }

  const subject = `Weekly Tasks Summary - Week of ${format(weekStart, 'MMM d, yyyy')} (${tasks.length} tasks)`;
  const html = generateEmployeeWeeklyEmail(tasks, weekStart, weekEnd);

  try {
    await transporter.verify();
    console.log('✓ SMTP server ready for employee email');

    // Send to all recipients
    for (const recipient of recipients) {
      try {
        const result = await transporter.sendMail({
          from: `"BerganCo SEO Monitor" <${emailFrom}>`,
          to: recipient.email,
          subject,
          html,
        });

        console.log(`✓ Employee weekly summary sent to ${recipient.name} (${recipient.email}):`, result.messageId);
      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error);
      }
    }

    return { success: true, taskCount: tasks.length };
  } catch (error) {
    console.error('Error sending employee weekly summary:', error);
    throw error;
  }
}
