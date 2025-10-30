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
 * Generates HTML email content for the weekly report (professional UX design)
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
<body style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif; line-height: 1.47; color: #FFFFFF; max-width: 800px; margin: 0 auto; padding: 32px 24px; background-color: #1C1C1E;">
  
  <!-- Main Container -->
  <div style="background-color: #2C2C2E; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); border: 1px solid #48484A;">
    
    <!-- Header -->
    <div style="margin-bottom: 40px;">
      <h1 style="margin: 0 0 8px 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2;">Weekly SEO Report</h1>
      <p style="margin: 0; color: #98989D; font-size: 17px; font-weight: 400;">
        ${format(weekStartDate, 'MMMM d')} - ${format(weekEndDate, 'MMMM d, yyyy')}
      </p>
    </div>

    <!-- Key Metrics -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin-bottom: 24px; letter-spacing: -0.01em;">Key Metrics</h2>
      
      <table style="width: 100%; border-collapse: separate; border-spacing: 0 16px;">
        <tr>
          <!-- Clicks Card -->
          <td style="width: 50%; padding-right: 12px; vertical-align: top;">
            <div style="background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; border-radius: 20px; background: rgba(10, 132, 255, 0.15); display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                  <svg width="20" height="20" fill="none" stroke="#0A84FF" stroke-width="2" viewBox="0 0 24 24" style="display: block;">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                </div>
                <div style="flex: 1;">
                  <div style="color: #98989D; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Clicks</div>
                </div>
              </div>
              <div style="font-size: 48px; font-weight: 700; color: #FFFFFF; line-height: 1.2; margin-bottom: 8px; letter-spacing: -0.02em;">
                ${formatNumber(currentMetrics.totalClicks)}
              </div>
              <div style="font-size: 12px; color: #E5E5EA; display: flex; align-items: center; gap: 4px;">
                ${formatChange(data.clicksChange)}
                <span style="color: #98989D;">vs last week</span>
              </div>
            </div>
          </td>
          
          <!-- Impressions Card -->
          <td style="width: 50%; padding-left: 12px; vertical-align: top;">
            <div style="background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; border-radius: 20px; background: rgba(175, 82, 222, 0.15); display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                  <svg width="20" height="20" fill="none" stroke="#AF52DE" stroke-width="2" viewBox="0 0 24 24" style="display: block;">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div style="flex: 1;">
                  <div style="color: #98989D; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Impressions</div>
                </div>
              </div>
              <div style="font-size: 48px; font-weight: 700; color: #FFFFFF; line-height: 1.2; margin-bottom: 8px; letter-spacing: -0.02em;">
                ${formatNumber(currentMetrics.totalImpressions)}
              </div>
              <div style="font-size: 12px; color: #E5E5EA; display: flex; align-items: center; gap: 4px;">
                ${formatChange(data.impressionsChange)}
                <span style="color: #98989D;">vs last week</span>
              </div>
            </div>
          </td>
        </tr>
        
        <tr>
          <!-- CTR Card -->
          <td style="width: 50%; padding-right: 12px; vertical-align: top;">
            <div style="background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; border-radius: 20px; background: rgba(48, 209, 88, 0.15); display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                  <svg width="20" height="20" fill="none" stroke="#30D158" stroke-width="2" viewBox="0 0 24 24" style="display: block;">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div style="flex: 1;">
                  <div style="color: #98989D; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Average CTR</div>
                </div>
              </div>
              <div style="font-size: 48px; font-weight: 700; color: #FFFFFF; line-height: 1.2; margin-bottom: 8px; letter-spacing: -0.02em;">
                ${(currentMetrics.averageCtr * 100).toFixed(2)}%
              </div>
              <div style="font-size: 12px; color: #E5E5EA; display: flex; align-items: center; gap: 4px;">
                ${formatChange(data.ctrChange)}
                <span style="color: #98989D;">vs last week</span>
              </div>
            </div>
          </td>
          
          <!-- Position Card -->
          <td style="width: 50%; padding-left: 12px; vertical-align: top;">
            <div style="background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; border-radius: 20px; background: rgba(255, 159, 10, 0.15); display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                  <svg width="20" height="20" fill="none" stroke="#FF9F0A" stroke-width="2" viewBox="0 0 24 24" style="display: block;">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div style="flex: 1;">
                  <div style="color: #98989D; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Average Position</div>
                </div>
              </div>
              <div style="font-size: 48px; font-weight: 700; color: #FFFFFF; line-height: 1.2; margin-bottom: 8px; letter-spacing: -0.02em;">
                ${currentMetrics.averagePosition.toFixed(1)}
              </div>
              <div style="font-size: 12px; color: #E5E5EA; display: flex; align-items: center; gap: 4px;">
                ${formatChange(data.positionChange, true)}
                <span style="color: #98989D;">vs last week</span>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Insights -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin-bottom: 24px; letter-spacing: -0.01em;">Key Insights</h2>
      <div style="background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);">
        <pre style="white-space: pre-wrap; margin: 0; font-family: inherit; font-size: 17px; line-height: 1.6; color: #E5E5EA;">${insights}</pre>
      </div>
    </div>

    <!-- Top Pages -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin-bottom: 24px; letter-spacing: -0.01em;">Top Performing Pages</h2>
      <div style="background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; padding: 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 17px;">
          <thead>
            <tr style="background-color: #2C2C2E; border-bottom: 1px solid #48484A;">
              <th style="padding: 16px; text-align: left; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Page</th>
              <th style="padding: 16px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Clicks</th>
              <th style="padding: 16px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Impressions</th>
              <th style="padding: 16px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">CTR</th>
            </tr>
          </thead>
          <tbody>
            ${topPages.slice(0, 10).map((page, idx) => `
              <tr style="${idx % 2 === 0 ? 'background-color: #2C2C2E;' : 'background-color: #1C1C1E;'} border-bottom: 1px solid #48484A;">
                <td style="padding: 16px; color: #E5E5EA; font-size: 17px;">
                  <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${page.page.replace('https://www.berganco.com', '')}
                  </div>
                </td>
                <td style="padding: 16px; text-align: right; font-weight: 600; color: #0A84FF; font-size: 17px;">
                  ${formatNumber(page.clicks)}
                </td>
                <td style="padding: 16px; text-align: right; color: #E5E5EA; font-size: 17px;">
                  ${formatNumber(page.impressions)}
                </td>
                <td style="padding: 16px; text-align: right; color: #E5E5EA; font-size: 17px;">
                  ${(page.ctr * 100).toFixed(2)}%
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Top Queries -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin-bottom: 24px; letter-spacing: -0.01em;">Top Search Queries</h2>
      <div style="background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; padding: 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 17px;">
          <thead>
            <tr style="background-color: #2C2C2E; border-bottom: 1px solid #48484A;">
              <th style="padding: 16px; text-align: left; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Query</th>
              <th style="padding: 16px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Clicks</th>
              <th style="padding: 16px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Position</th>
              <th style="padding: 16px; text-align: right; color: #98989D; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">CTR</th>
            </tr>
          </thead>
          <tbody>
            ${topQueries.slice(0, 10).map((query, idx) => `
              <tr style="${idx % 2 === 0 ? 'background-color: #2C2C2E;' : 'background-color: #1C1C1E;'} border-bottom: 1px solid #48484A;">
                <td style="padding: 16px; color: #E5E5EA; font-weight: 400; font-size: 17px;">
                  ${query.query}
                </td>
                <td style="padding: 16px; text-align: right; font-weight: 600; color: #0A84FF; font-size: 17px;">
                  ${formatNumber(query.clicks)}
                </td>
                <td style="padding: 16px; text-align: right; color: #E5E5EA; font-size: 17px;">
                  ${query.position.toFixed(1)}
                </td>
                <td style="padding: 16px; text-align: right; color: #E5E5EA; font-size: 17px;">
                  ${(query.ctr * 100).toFixed(2)}%
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recommendations -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin-bottom: 24px; letter-spacing: -0.01em;">Action Items & Recommendations</h2>
      <div style="background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);">
        <pre style="white-space: pre-wrap; margin: 0; font-family: inherit; font-size: 17px; line-height: 1.6; color: #E5E5EA;">${recommendations}</pre>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #48484A; padding-top: 32px; margin-top: 40px;">
      <table style="width: 100%;">
        <tr>
          <td style="text-align: center;">
            <p style="margin: 0 0 8px 0; color: #98989D; font-size: 13px; font-weight: 400;">This report was automatically generated by the BerganCo SEO Monitoring System.</p>
            <p style="margin: 0 0 8px 0; color: #98989D; font-size: 13px; font-weight: 400;">Data source: Google Search Console | www.berganco.com</p>
            <p style="margin: 0; color: #98989D; font-size: 13px; font-weight: 400;">Powered by Stuchai LLC</p>
          </td>
        </tr>
      </table>
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

  const subject = `Weekly SEO Report: ${format(reportData.weekStartDate, 'MMM d')} - ${format(reportData.weekEndDate, 'MMM d, yyyy')} | ${reportData.clicksChange >= 0 ? '+' : ''}${reportData.clicksChange.toFixed(1)}% clicks`;

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

