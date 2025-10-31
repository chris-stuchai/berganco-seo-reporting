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
  periodType?: 'week' | 'month' | 'custom';
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
  aiSummary?: {
    executiveSummary: string;
    wins?: string[];
    awareness?: string[];
    nextSteps?: string[];
  };
  trendsData?: Array<{
    date: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  websiteDomain?: string;
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
 * Generates a simple SVG trend chart for email
 */
function generateTrendChart(trendsData: ReportData['trendsData'], metric: 'clicks' | 'impressions'): string {
  if (!trendsData || trendsData.length === 0) return '';
  
  const width = 600;
  const height = 200;
  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  
  const values = trendsData.map(d => metric === 'clicks' ? d.clicks : d.impressions);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;
  
  const points = trendsData.map((d, i) => {
    const x = padding + (i / (trendsData.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((values[i] - minValue) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  
  const color = metric === 'clicks' ? '#0A84FF' : '#AF52DE';
  
  return `
    <svg width="${width}" height="${height}" style="display: block; margin: 0 auto;">
      <polyline
        fill="none"
        stroke="${color}"
        stroke-width="3"
        points="${points}"
      />
      ${trendsData.map((d, i) => {
        const x = padding + (i / (trendsData.length - 1 || 1)) * chartWidth;
        const y = padding + chartHeight - ((values[i] - minValue) / range) * chartHeight;
        return `<circle cx="${x}" cy="${y}" r="4" fill="${color}"/>`;
      }).join('')}
      <text x="${width / 2}" y="${height - 10}" text-anchor="middle" fill="#98989D" font-size="12" fill="#98989D">${metric === 'clicks' ? 'Clicks' : 'Impressions'} Over Time</text>
    </svg>
  `;
}

/**
 * Generates HTML email content for the weekly report (professional UX design)
 */
function generateEmailHTML(data: ReportData): string {
  const { weekStartDate, weekEndDate, periodType = 'week', currentMetrics, topPages, topQueries, insights, recommendations, aiSummary, trendsData, websiteDomain = 'www.berganco.com' } = data;
  
  const periodLabel = periodType === 'week' ? 'Weekly' : periodType === 'month' ? 'Monthly' : 'Custom';
  const reportTitle = `${periodLabel} SEO Report`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <title>${reportTitle} - BerganCo</title>
  <style>
    @media (prefers-color-scheme: light) {
      .dark-mode-bg { background-color: #1C1C1E !important; }
      .dark-mode-card { background-color: #2C2C2E !important; }
      .dark-mode-text { color: #FFFFFF !important; }
      .dark-mode-text-secondary { color: #E5E5EA !important; }
      .dark-mode-text-tertiary { color: #98989D !important; }
      .dark-mode-border { border-color: #48484A !important; }
    }
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #1C1C1E !important; }
      .dark-mode-card { background-color: #2C2C2E !important; }
      .dark-mode-text { color: #FFFFFF !important; }
      .dark-mode-text-secondary { color: #E5E5EA !important; }
      .dark-mode-text-tertiary { color: #98989D !important; }
      .dark-mode-border { border-color: #48484A !important; }
    }
    details summary::-webkit-details-marker { display: none; }
    details summary { list-style: none; cursor: pointer; }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif; line-height: 1.47; color: #FFFFFF; max-width: 800px; margin: 0 auto; padding: 32px 24px; background-color: #1C1C1E;" class="dark-mode-bg">
  
  <!-- Main Container -->
  <div style="background-color: #2C2C2E; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); border: 1px solid #48484A;" class="dark-mode-card dark-mode-border">
    
    <!-- Logo Header -->
    <div style="margin-bottom: 32px; text-align: center; border-bottom: 1px solid #48484A; padding-bottom: 24px;">
      <img src="https://framerusercontent.com/images/AhyGPdkv1Kr9JeLtiQvJBU0uJE.png?scale-down-to=1024&width=2088&height=518" alt="StuchAI Logo" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
    </div>
    
    <!-- Header -->
    <div style="margin-bottom: 40px;">
      <h1 style="margin: 0 0 8px 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2;" class="dark-mode-text">${reportTitle}</h1>
      <p style="margin: 0; color: #98989D; font-size: 17px; font-weight: 400;" class="dark-mode-text-tertiary">
        ${format(weekStartDate, 'MMMM d')} - ${format(weekEndDate, 'MMMM d, yyyy')}
      </p>
      <p style="margin: 8px 0 0 0; color: #98989D; font-size: 15px; font-weight: 400;" class="dark-mode-text-tertiary">
        ${websiteDomain}
      </p>
    </div>
    
    <!-- Executive Summary / Introduction -->
    ${aiSummary?.executiveSummary ? `
    <div style="margin-bottom: 40px; padding: 24px; background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; border-left: 4px solid #0A84FF;" class="dark-mode-card dark-mode-border">
      <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 600; margin-bottom: 16px; letter-spacing: -0.01em;" class="dark-mode-text">Executive Summary</h2>
      <p style="color: #E5E5EA; font-size: 17px; line-height: 1.6; margin: 0;" class="dark-mode-text-secondary">
        ${aiSummary.executiveSummary}
      </p>
    </div>
    ` : `
    <div style="margin-bottom: 40px; padding: 24px; background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; border-left: 4px solid #0A84FF;" class="dark-mode-card dark-mode-border">
      <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 600; margin-bottom: 16px; letter-spacing: -0.01em;" class="dark-mode-text">About This Report</h2>
      <p style="color: #E5E5EA; font-size: 17px; line-height: 1.6; margin: 0;" class="dark-mode-text-secondary">
        This ${periodLabel.toLowerCase()} SEO report provides comprehensive insights into the search engine performance of <strong>${websiteDomain}</strong>. The report includes key metrics, trending data, top-performing pages and queries, and actionable recommendations to improve search visibility and drive more qualified traffic.
      </p>
    </div>
    `}

    <!-- Key Metrics -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin-bottom: 24px; letter-spacing: -0.01em;">Key Metrics</h2>
      
      <table style="width: 100%; border-collapse: separate; border-spacing: 0 16px;">
        <tr>
          <!-- Clicks Card -->
          <td style="width: 50%; padding-right: 12px; vertical-align: top;">
            <div style="background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 40px; height: 40px; border-radius: 20px; background: rgba(10, 132, 255, 0.2); display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; border: 1px solid rgba(10, 132, 255, 0.3);">
                  <svg width="22" height="22" fill="none" stroke="#0A84FF" stroke-width="2.5" viewBox="0 0 24 24" style="display: block;">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
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
                <div style="width: 40px; height: 40px; border-radius: 20px; background: rgba(175, 82, 222, 0.2); display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; border: 1px solid rgba(175, 82, 222, 0.3);">
                  <svg width="22" height="22" fill="none" stroke="#AF52DE" stroke-width="2.5" viewBox="0 0 24 24" style="display: block;">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
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
                <div style="width: 40px; height: 40px; border-radius: 20px; background: rgba(48, 209, 88, 0.2); display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; border: 1px solid rgba(48, 209, 88, 0.3);">
                  <svg width="22" height="22" fill="none" stroke="#30D158" stroke-width="2.5" viewBox="0 0 24 24" style="display: block;">
                    <path d="M18 20V10"/>
                    <path d="M12 20V4"/>
                    <path d="M6 20v-6"/>
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
                <div style="width: 40px; height: 40px; border-radius: 20px; background: rgba(255, 159, 10, 0.2); display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; border: 1px solid rgba(255, 159, 10, 0.3);">
                  <svg width="22" height="22" fill="none" stroke="#FF9F0A" stroke-width="2.5" viewBox="0 0 24 24" style="display: block;">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
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
    
    <!-- Trend Chart -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin-bottom: 24px; letter-spacing: -0.01em;" class="dark-mode-text">Performance Trends</h2>
      <div style="background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);" class="dark-mode-card dark-mode-border">
        ${trendsData && trendsData.length > 0 ? `
          ${generateTrendChart(trendsData, 'clicks')}
          <div style="margin-top: 24px;">
            ${generateTrendChart(trendsData, 'impressions')}
          </div>
        ` : `
          <div style="text-align: center; padding: 40px 20px; color: #98989D;">
            <p style="margin: 0; font-size: 17px;">Trend data will appear here once daily metrics are collected.</p>
            <p style="margin: 8px 0 0 0; font-size: 15px;">Please ensure daily data collection is running.</p>
          </div>
        `}
      </div>
    </div>
    
    <!-- AI Summary: Wins, Awareness, Next Steps (Collapsible) -->
    ${aiSummary && (aiSummary.wins?.length || aiSummary.awareness?.length || aiSummary.nextSteps?.length) ? `
    <div style="margin-bottom: 40px;">
      <details style="margin-bottom: 16px;" open>
        <summary style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin-bottom: 24px; letter-spacing: -0.01em; cursor: pointer; list-style: none; padding: 12px; background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;" class="dark-mode-text dark-mode-card dark-mode-border">
          <span>Market-Aware Analysis</span>
          <span style="font-size: 18px; color: #98989D;">▼</span>
        </summary>
        <div style="margin-top: 16px;">
          ${aiSummary.wins && aiSummary.wins.length > 0 ? `
          <div style="margin-bottom: 24px; padding: 24px; background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; border-left: 4px solid #30D158;" class="dark-mode-card dark-mode-border">
            <h3 style="color: #FFFFFF; font-size: 18px; font-weight: 600; margin-bottom: 12px;" class="dark-mode-text">Key Wins</h3>
            <ul style="margin: 0; padding-left: 20px; color: #E5E5EA; font-size: 17px; line-height: 1.6;" class="dark-mode-text-secondary">
              ${aiSummary.wins.map(win => `<li style="margin-bottom: 8px;">${win}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          ${aiSummary.awareness && aiSummary.awareness.length > 0 ? `
          <div style="margin-bottom: 24px; padding: 24px; background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; border-left: 4px solid #FF9F0A;" class="dark-mode-card dark-mode-border">
            <h3 style="color: #FFFFFF; font-size: 18px; font-weight: 600; margin-bottom: 12px;" class="dark-mode-text">What We're Tracking</h3>
            <ul style="margin: 0; padding-left: 20px; color: #E5E5EA; font-size: 17px; line-height: 1.6;" class="dark-mode-text-secondary">
              ${aiSummary.awareness.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          ${aiSummary.nextSteps && aiSummary.nextSteps.length > 0 ? `
          <div style="margin-bottom: 24px; padding: 24px; background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; border-left: 4px solid #0A84FF;" class="dark-mode-card dark-mode-border">
            <h3 style="color: #FFFFFF; font-size: 18px; font-weight: 600; margin-bottom: 12px;" class="dark-mode-text">Next Steps</h3>
            <ul style="margin: 0; padding-left: 20px; color: #E5E5EA; font-size: 17px; line-height: 1.6;" class="dark-mode-text-secondary">
              ${aiSummary.nextSteps.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      </details>
    </div>
    ` : ''}

    <!-- Insights -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: 600; margin-bottom: 24px; letter-spacing: -0.01em;" class="dark-mode-text">Key Insights</h2>
      <div style="background-color: #2C2C2E; border: 1px solid #48484A; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);" class="dark-mode-card dark-mode-border">
        <pre style="white-space: pre-wrap; margin: 0; font-family: inherit; font-size: 17px; line-height: 1.6; color: #E5E5EA;" class="dark-mode-text-secondary">${insights}</pre>
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

  const periodLabel = reportData.periodType === 'week' ? 'Weekly' : reportData.periodType === 'month' ? 'Monthly' : 'Custom';
  const subject = `${periodLabel} SEO Report: ${format(reportData.weekStartDate, 'MMM d')} - ${format(reportData.weekEndDate, 'MMM d, yyyy')} | ${reportData.clicksChange >= 0 ? '+' : ''}${reportData.clicksChange.toFixed(1)}% clicks`;

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
      if (error.message.includes('Invalid login') || error.message.includes('Username and Password not accepted') || (error as any).code === 'EAUTH') {
        const errorMsg = `SMTP Authentication Failed:

The email address or App Password is incorrect. Please verify:

1. SMTP_USER should be your full email: ${smtpUser || 'NOT SET'}
2. SMTP_PASSWORD should be a Gmail App Password (not your regular password)
3. Generate a new App Password at: https://myaccount.google.com/apppasswords
4. Make sure 2-Step Verification is enabled on your Google account
5. Copy the 16-character App Password exactly (with or without spaces)

Current SMTP_USER: ${smtpUser || 'NOT SET'}
SMTP_PASSWORD: ${smtpPassword ? '[SET]' : 'NOT SET'}`;
        throw new Error(errorMsg);
      } else if (error.message.includes('Connection')) {
        throw new Error('Cannot connect to SMTP server. Check SMTP_HOST and SMTP_PORT.');
      }
    }
    
    throw error;
  }
}

