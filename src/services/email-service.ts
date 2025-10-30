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
 * Formats a percentage change with color indicator (matching website design)
 */
function formatChange(change: number, invertColors: boolean = false): string {
  const isPositive = invertColors ? change < 0 : change > 0;
  const color = isPositive ? '#30D158' : '#FF453A';
  const arrow = change > 0 ? '↑' : '↓';
  return `<span style="color: ${color}; font-weight: 600;">${arrow} ${Math.abs(change).toFixed(1)}%</span>`;
}

/**
 * Generates HTML email content for the weekly report (matching website dark theme)
 */
function generateEmailHTML(data: ReportData): string {
  const { weekStartDate, weekEndDate, currentMetrics, topPages, topQueries, insights, recommendations } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Weekly SEO Report - BerganCo</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif; line-height: 1.47; color: #FFFFFF; max-width: 800px; margin: 0 auto; padding: 24px; background-color: #1C1C1E;">
  
  <div style="background-color: #2C2C2E; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); border: 0.5px solid #48484A;">
    
    <!-- Header -->
    <div style="border-bottom: 1px solid #48484A; padding-bottom: 24px; margin-bottom: 32px;">
      <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">📊 Weekly SEO Report</h1>
      <p style="margin: 8px 0 0 0; color: #98989D; font-size: 17px;">
        ${format(weekStartDate, 'MMMM d')} - ${format(weekEndDate, 'MMMM d, yyyy')}
      </p>
    </div>

    <!-- Key Metrics -->
    <div style="margin-bottom: 32px;">
      <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 600; margin-bottom: 20px; letter-spacing: -0.01em;">📈 Key Metrics</h2>
      
      <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 16px;">
        
        <!-- Clicks Card -->
        <div style="display: table-cell; width: 50%; background-color: #3A3A3C; border-radius: 12px; padding: 20px; border-left: 4px solid #0A84FF; vertical-align: top;">
          <div style="color: #98989D; font-size: 13px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.02em;">Clicks</div>
          <div style="font-size: 32px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px; letter-spacing: -0.02em;">
            ${formatNumber(currentMetrics.totalClicks)}
          </div>
          <div style="font-size: 13px; color: #E5E5EA;">
            ${formatChange(data.clicksChange)}
            vs last week
          </div>
        </div>

        <!-- Impressions Card -->
        <div style="display: table-cell; width: 50%; background-color: #3A3A3C; border-radius: 12px; padding: 20px; border-left: 4px solid #0A84FF; vertical-align: top;">
          <div style="color: #98989D; font-size: 13px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.02em;">Impressions</div>
          <div style="font-size: 32px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px; letter-spacing: -0.02em;">
            ${formatNumber(currentMetrics.totalImpressions)}
          </div>
          <div style="font-size: 13px; color: #E5E5EA;">
            ${formatChange(data.impressionsChange)}
            vs last week
          </div>
        </div>

      </div>
      
      <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 16px; margin-top: 16px;">
        
        <!-- CTR Card -->
        <div style="display: table-cell; width: 50%; background-color: #3A3A3C; border-radius: 12px; padding: 20px; border-left: 4px solid #30D158; vertical-align: top;">
          <div style="color: #98989D; font-size: 13px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.02em;">Average CTR</div>
          <div style="font-size: 32px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px; letter-spacing: -0.02em;">
            ${(currentMetrics.averageCtr * 100).toFixed(2)}%
          </div>
          <div style="font-size: 13px; color: #E5E5EA;">
            ${formatChange(data.ctrChange)}
            vs last week
          </div>
        </div>

        <!-- Position Card -->
        <div style="display: table-cell; width: 50%; background-color: #3A3A3C; border-radius: 12px; padding: 20px; border-left: 4px solid #FF9F0A; vertical-align: top;">
          <div style="color: #98989D; font-size: 13px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.02em;">Average Position</div>
          <div style="font-size: 32px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px; letter-spacing: -0.02em;">
            ${currentMetrics.averagePosition.toFixed(1)}
          </div>
          <div style="font-size: 13px; color: #E5E5EA;">
            ${formatChange(data.positionChange, true)}
            vs last week
          </div>
        </div>

      </div>
    </div>

    <!-- Insights -->
    <div style="margin-bottom: 32px;">
      <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 600; margin-bottom: 16px; letter-spacing: -0.01em;">🔍 Key Insights</h2>
      <div style="background-color: #3A3A3C; border-left: 4px solid #FF9F0A; padding: 16px; border-radius: 8px;">
        <pre style="white-space: pre-wrap; margin: 0; font-family: inherit; font-size: 17px; line-height: 1.47; color: #E5E5EA;">${insights}</pre>
      </div>
    </div>

    <!-- Top Pages -->
    <div style="margin-bottom: 32px;">
      <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 600; margin-bottom: 16px; letter-spacing: -0.01em;">🏆 Top Performing Pages</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 17px; background-color: #3A3A3C; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #3A3A3C; border-bottom: 1px solid #48484A;">
            <th style="padding: 12px; text-align: left; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.02em;">Page</th>
            <th style="padding: 12px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.02em;">Clicks</th>
            <th style="padding: 12px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.02em;">Impressions</th>
            <th style="padding: 12px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.02em;">CTR</th>
          </tr>
        </thead>
        <tbody>
          ${topPages.slice(0, 10).map((page, idx) => `
            <tr style="border-bottom: 1px solid #48484A;">
              <td style="padding: 12px; color: #E5E5EA;">
                <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${page.page.replace('https://www.berganco.com', '')}
                </div>
              </td>
              <td style="padding: 12px; text-align: right; font-weight: 600; color: #0A84FF;">
                ${formatNumber(page.clicks)}
              </td>
              <td style="padding: 12px; text-align: right; color: #E5E5EA;">
                ${formatNumber(page.impressions)}
              </td>
              <td style="padding: 12px; text-align: right; color: #E5E5EA;">
                ${(page.ctr * 100).toFixed(2)}%
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Top Queries -->
    <div style="margin-bottom: 32px;">
      <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 600; margin-bottom: 16px; letter-spacing: -0.01em;">🔎 Top Search Queries</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 17px; background-color: #3A3A3C; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #3A3A3C; border-bottom: 1px solid #48484A;">
            <th style="padding: 12px; text-align: left; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.02em;">Query</th>
            <th style="padding: 12px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.02em;">Clicks</th>
            <th style="padding: 12px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.02em;">Position</th>
            <th style="padding: 12px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.02em;">CTR</th>
          </tr>
        </thead>
        <tbody>
          ${topQueries.slice(0, 10).map((query, idx) => `
            <tr style="border-bottom: 1px solid #48484A;">
              <td style="padding: 12px; color: #E5E5EA; font-weight: 500;">
                "${query.query}"
              </td>
              <td style="padding: 12px; text-align: right; font-weight: 600; color: #0A84FF;">
                ${formatNumber(query.clicks)}
              </td>
              <td style="padding: 12px; text-align: right; color: #E5E5EA;">
                ${query.position.toFixed(1)}
              </td>
              <td style="padding: 12px; text-align: right; color: #E5E5EA;">
                ${(query.ctr * 100).toFixed(2)}%
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Recommendations -->
    <div style="margin-bottom: 32px;">
      <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 600; margin-bottom: 16px; letter-spacing: -0.01em;">💡 Action Items & Recommendations</h2>
      <div style="background-color: #3A3A3C; border-left: 4px solid #0A84FF; padding: 16px; border-radius: 8px;">
        <pre style="white-space: pre-wrap; margin: 0; font-family: inherit; font-size: 17px; line-height: 1.47; color: #E5E5EA;">${recommendations}</pre>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #48484A; padding-top: 24px; margin-top: 40px; text-align: center; color: #98989D; font-size: 13px;">
      <p style="margin: 0; color: #98989D;">This report was automatically generated by the BerganCo SEO Monitoring System.</p>
      <p style="margin-top: 8px; color: #98989D;">Data source: Google Search Console | www.berganco.com</p>
      <p style="margin-top: 8px; color: #98989D;">Powered by Stuchai LLC</p>
    </div>

  </div>

</body>
</html>
  `;
}

/**
 * Generates email HTML for preview purposes
 */
export function getEmailPreview(reportData: ReportData): string {
  return generateEmailHTML(reportData);
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

