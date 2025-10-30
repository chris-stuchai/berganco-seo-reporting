/**
 * Shared Layout HTML Generator
 * 
 * Generates consistent sidebar and layout structure for all pages
 */

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  businessName?: string | null;
  logoUrl?: string | null;
}

export function generateSidebar(activePage: string, user?: UserProfile, isImpersonating: boolean = false): string {
  const logoIcon = user?.logoUrl 
    ? `<img src="${user.logoUrl}" alt="${user.businessName || 'Logo'}" style="width: 32px; height: 32px; border-radius: 8px; object-fit: cover;">`
    : `<div class="sidebar-brand-icon">${(user?.businessName || user?.name || 'B')[0].toUpperCase()}</div>`;
  
  const brandText = user?.businessName || user?.name || 'BerganCo';
  const tagline = user?.role === 'CLIENT' && user.businessName 
    ? `${user.businessName} SEO Analytics`
    : 'SEO Analytics';

  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          ${logoIcon}
          <div class="sidebar-brand-text">${brandText}</div>
        </div>
        <div class="sidebar-tagline">${tagline}</div>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Main</div>
          <a href="/" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
            <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11V6a2 2 0 00-2-2h-4M9 21h6"/>
            </svg>
            <span>Dashboard</span>
          </a>
          <a href="/analytics" class="nav-item ${activePage === 'analytics' ? 'active' : ''}">
            <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <span>Analytics</span>
          </a>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">SEO</div>
          <a href="/pages" class="nav-item ${activePage === 'pages' ? 'active' : ''}">
            <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            <span>Pages</span>
          </a>
          <a href="/queries" class="nav-item ${activePage === 'queries' ? 'active' : ''}">
            <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span>Queries</span>
          </a>
        </div>
        
        ${user && user.role !== 'CLIENT' ? `
        <div class="nav-section">
          <div class="nav-section-title">Admin</div>
          <a href="/employee" class="nav-item ${activePage === 'employee' ? 'active' : ''}">
            <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>Admin</span>
          </a>
        </div>
        ` : ''}
        
        ${user && user.role === 'CLIENT' ? `
        <div class="nav-section">
          <div class="nav-section-title">Account</div>
          <a href="/settings" class="nav-item ${activePage === 'settings' ? 'active' : ''}">
            <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>Settings</span>
          </a>
        </div>
        ` : ''}
        
        ${isImpersonating ? `
        <div class="nav-section" style="margin-top: auto; padding-top: var(--spacing-6); border-top: 1px solid var(--color-separator);">
          <a href="#" onclick="stopImpersonation()" class="nav-item" style="background: rgba(255, 159, 10, 0.15); color: var(--color-orange);">
            <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span>Stop Viewing As</span>
          </a>
        </div>
        ` : ''}
        
        <div class="nav-section" style="margin-top: auto; padding-top: var(--spacing-6); border-top: 1px solid var(--color-separator);">
          <a href="#" onclick="handleLogout()" class="nav-item">
            <svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Sign Out</span>
          </a>
        </div>
      </nav>
    </aside>
  `;
}

export function generateImpersonationBar(adminName: string, clientName: string): string {
  return `
    <div id="impersonationBar" style="background: #FF453A; color: white; padding: var(--spacing-2) var(--spacing-4); display: flex; align-items: center; justify-content: center; gap: var(--spacing-3); font-size: var(--font-footnote); font-weight: 500; z-index: 1000; position: relative;">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <span>You are viewing as <strong>${clientName}</strong>. <a href="#" onclick="stopImpersonation(); return false;" style="color: white; text-decoration: underline; font-weight: 600;">Stop viewing as</a></span>
    </div>
  `;
}

