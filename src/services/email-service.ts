/**
 * Email Service
 * 
 * Sends weekly SEO reports via email using Gmail/Google Workspace SMTP
 */

import nodemailer from 'nodemailer';
import { format } from 'date-fns';

// Create reusable transporter using Gmail/Google Workspace SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Your Gmail or Google Workspace email
    pass: process.env.SMTP_PASSWORD, // App Password (not regular password)
  },
});

interface ReportData {
  weekStartDate: Date;
  weekEndDate: Date;
  currentMetrics: {
    totalClicks: number;
    totalImpressions: number;
    averageCtr: number;
    averagePosition: number;
  };
  previousMetrics: {
    totalClicks: number;
    totalImpressions: number;
    averageCtr: number;
    averagePosition: number;
  };
  clicksChange: number;
  impressionsChange: number;
  ctrChange: number;
  positionChange: number;
  topPages: any[];
  topQueries: any[];
  insights: string;
  recommendations: string;
}

/**
 * Formats a number with commas for readability
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Formats a percentage change with color indicator
 */
function formatChange(change: number, invertColors: boolean = false): string {
  const isPositive = invertColors ? change < 0 : change > 0;
  const color = isPositive ? '#16a34a' : '#dc2626';
  const arrow = change > 0 ? '↑' : '↓';
  return `<span style="color: ${color}; font-weight: 600;">${arrow} ${Math.abs(change).toFixed(1)}%</span>`;
}

/**
 * Generates HTML email content for the weekly report
 */
function generateEmailHTML(data: ReportData): string {
  const { weekStartDate, weekEndDate, currentMetrics, topPages, topQueries, insights, recommendations } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly SEO Report - BerganCo</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
      <h1 style="margin: 0; color: #1e293b; font-size: 28px;">📊 Weekly SEO Report</h1>
      <p style="margin: 8px 0 0 0; color: #64748b; font-size: 16px;">
        ${format(weekStartDate, 'MMMM d')} - ${format(weekEndDate, 'MMMM d, yyyy')}
      </p>
    </div>

    <!-- Key Metrics -->
    <div style="margin-bottom: 32px;">
      <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 20px;">📈 Key Metrics</h2>
      
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        
        <!-- Clicks Card -->
        <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; border-left: 4px solid #2563eb;">
          <div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Clicks</div>
          <div style="font-size: 32px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
            ${formatNumber(currentMetrics.totalClicks)}
          </div>
          <div style="font-size: 14px;">
            ${formatChange(data.clicksChange)}
            vs last week
          </div>
        </div>

        <!-- Impressions Card -->
        <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; border-left: 4px solid #8b5cf6;">
          <div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Impressions</div>
          <div style="font-size: 32px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
            ${formatNumber(currentMetrics.totalImpressions)}
          </div>
          <div style="font-size: 14px;">
            ${formatChange(data.impressionsChange)}
            vs last week
          </div>
        </div>

        <!-- CTR Card -->
        <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; border-left: 4px solid #10b981;">
          <div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Average CTR</div>
          <div style="font-size: 32px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
            ${(currentMetrics.averageCtr * 100).toFixed(2)}%
          </div>
          <div style="font-size: 14px;">
            ${formatChange(data.ctrChange)}
            vs last week
          </div>
        </div>

        <!-- Position Card -->
        <div style="background-color: #f8fafc; border-radius: 6px; padding: 20px; border-left: 4px solid #f59e0b;">
          <div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Average Position</div>
          <div style="font-size: 32px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
            ${currentMetrics.averagePosition.toFixed(1)}
          </div>
          <div style="font-size: 14px;">
            ${formatChange(data.positionChange, true)}
            vs last week
          </div>
        </div>

      </div>
    </div>

    <!-- Insights -->
    <div style="margin-bottom: 32px;">
      <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">🔍 Key Insights</h2>
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px;">
        <pre style="white-space: pre-wrap; margin: 0; font-family: inherit; font-size: 14px; line-height: 1.6;">${insights}</pre>
      </div>
    </div>

    <!-- Top Pages -->
    <div style="margin-bottom: 32px;">
      <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">🏆 Top Performing Pages</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left; color: #64748b; font-weight: 600;">Page</th>
            <th style="padding: 12px; text-align: right; color: #64748b; font-weight: 600;">Clicks</th>
            <th style="padding: 12px; text-align: right; color: #64748b; font-weight: 600;">Impressions</th>
            <th style="padding: 12px; text-align: right; color: #64748b; font-weight: 600;">CTR</th>
          </tr>
        </thead>
        <tbody>
          ${topPages.slice(0, 10).map((page, idx) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; color: #1e293b;">
                <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${page.page.replace('https://www.berganco.com', '')}
                </div>
              </td>
              <td style="padding: 12px; text-align: right; font-weight: 600; color: #2563eb;">
                ${formatNumber(page.clicks)}
              </td>
              <td style="padding: 12px; text-align: right; color: #64748b;">
                ${formatNumber(page.impressions)}
              </td>
              <td style="padding: 12px; text-align: right; color: #64748b;">
                ${(page.ctr * 100).toFixed(2)}%
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Top Queries -->
    <div style="margin-bottom: 32px;">
      <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">🔎 Top Search Queries</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 12px; text-align: left; color: #64748b; font-weight: 600;">Query</th>
            <th style="padding: 12px; text-align: right; color: #64748b; font-weight: 600;">Clicks</th>
            <th style="padding: 12px; text-align: right; color: #64748b; font-weight: 600;">Position</th>
            <th style="padding: 12px; text-align: right; color: #64748b; font-weight: 600;">CTR</th>
          </tr>
        </thead>
        <tbody>
          ${topQueries.slice(0, 10).map((query, idx) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; color: #1e293b; font-weight: 500;">
                "${query.query}"
              </td>
              <td style="padding: 12px; text-align: right; font-weight: 600; color: #2563eb;">
                ${formatNumber(query.clicks)}
              </td>
              <td style="padding: 12px; text-align: right; color: #64748b;">
                ${query.position.toFixed(1)}
              </td>
              <td style="padding: 12px; text-align: right; color: #64748b;">
                ${(query.ctr * 100).toFixed(2)}%
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Recommendations -->
    <div style="margin-bottom: 32px;">
      <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">💡 Action Items & Recommendations</h2>
      <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px;">
        <pre style="white-space: pre-wrap; margin: 0; font-family: inherit; font-size: 14px; line-height: 1.8;">${recommendations}</pre>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 2px solid #e2e8f0; padding-top: 20px; margin-top: 40px; text-align: center; color: #64748b; font-size: 13px;">
      <p>This report was automatically generated by the BerganCo SEO Monitoring System.</p>
      <p style="margin-top: 8px;">Data source: Google Search Console | www.berganco.com</p>
    </div>

  </div>

</body>
</html>
  `;
}

/**
 * Sends the weekly report via email using Gmail/Google Workspace SMTP
 */
export async function sendWeeklyReport(reportData: ReportData) {
  const emailTo = process.env.REPORT_EMAIL_TO;
  const emailFrom = process.env.REPORT_EMAIL_FROM || process.env.SMTP_USER;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!emailTo || !emailFrom) {
    throw new Error('Email configuration missing. Please set REPORT_EMAIL_TO and REPORT_EMAIL_FROM in .env');
  }

  if (!smtpUser || !smtpPassword) {
    throw new Error('SMTP configuration missing. Please set SMTP_USER and SMTP_PASSWORD in .env');
  }

  const subject = `Weekly SEO Report: ${format(reportData.weekStartDate, 'MMM d')} - ${format(reportData.weekEndDate, 'MMM d, yyyy')} | ${reportData.clicksChange >= 0 ? '📈' : '📉'} ${Math.abs(reportData.clicksChange).toFixed(1)}% clicks`;

  const html = generateEmailHTML(reportData);

  try {
    // Verify SMTP connection
    await transporter.verify();
    console.log('✓ SMTP server is ready to send emails');

    // Send email
    const result = await transporter.sendMail({
      from: `"BerganCo SEO Monitor" <${emailFrom}>`,
      to: emailTo,
      subject,
      html,
    });

    console.log('✓ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        throw new Error('Invalid SMTP credentials. Check SMTP_USER and SMTP_PASSWORD. For Gmail, make sure you\'re using an App Password, not your regular password.');
      } else if (error.message.includes('Connection')) {
        throw new Error('Cannot connect to SMTP server. Check SMTP_HOST and SMTP_PORT.');
      }
    }
    
    throw error;
  }
}

