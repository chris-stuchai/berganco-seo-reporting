/**
 * Shared Layout JavaScript
 * Provides consistent sidebar and layout for all pages
 */

let currentUser = null;
let isImpersonating = false;

// Initialize page with auth check and sidebar
async function initPage(pageName) {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' });
    if (!response.ok) {
      window.location.href = '/login';
      return;
    }
    
    const data = await response.json();
    currentUser = data.user;
    
    // Check if impersonating
    const originalAdminToken = getCookie('originalAdminToken');
    if (originalAdminToken && currentUser.role === 'CLIENT') {
      isImpersonating = true;
      showImpersonationBar();
    }
    
    // Update sidebar with user info
    updateSidebar(pageName);
    
    // Show admin section if needed
    if (currentUser.role !== 'CLIENT') {
      document.getElementById('adminNavSection')?.style.setProperty('display', 'block');
    }
    
    // Show settings for clients
    if (currentUser.role === 'CLIENT') {
      document.getElementById('settingsNavSection')?.style.setProperty('display', 'block');
    }
  } catch (error) {
    window.location.href = '/login';
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function updateSidebar(activePage) {
  // Update brand with user's logo/business name
  const brandIcon = document.querySelector('.sidebar-brand-icon');
  const brandText = document.querySelector('.sidebar-brand-text');
  const tagline = document.querySelector('.sidebar-tagline');
  
  if (currentUser?.logoUrl) {
    brandIcon.innerHTML = `<img src="${currentUser.logoUrl}" alt="${currentUser.businessName || currentUser.name}" style="width: 32px; height: 32px; border-radius: 8px; object-fit: cover;">`;
  } else {
    const initial = (currentUser?.businessName || currentUser?.name || 'B')[0].toUpperCase();
    brandIcon.innerHTML = initial;
  }
  
  if (brandText) {
    brandText.textContent = currentUser?.businessName || currentUser?.name || 'BerganCo';
  }
  
  if (tagline) {
    tagline.textContent = currentUser?.role === 'CLIENT' && currentUser?.businessName
      ? `${currentUser.businessName} SEO Analytics`
      : 'SEO Analytics';
  }
  
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeMap = {
    'dashboard': '/',
    'analytics': '/analytics',
    'pages': '/pages',
    'queries': '/queries',
    'employee': '/employee',
    'settings': '/settings'
  };
  
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('href') === activeMap[activePage]) {
      item.classList.add('active');
    }
  });
}

function showImpersonationBar() {
  // Create impersonation bar
  const bar = document.createElement('div');
  bar.id = 'impersonationBar';
  bar.style.cssText = 'background: #FF453A; color: white; padding: var(--spacing-2) var(--spacing-4); display: flex; align-items: center; justify-content: center; gap: var(--spacing-3); font-size: var(--font-footnote); font-weight: 500; z-index: 1000; position: relative;';
  bar.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
    <span>You are viewing as <strong>${currentUser?.name}</strong>. <a href="#" onclick="stopImpersonation(); return false;" style="color: white; text-decoration: underline; font-weight: 600; margin-left: 8px;">Stop viewing as</a></span>
  `;
  
  document.body.insertBefore(bar, document.body.firstChild);
}

async function stopImpersonation() {
  const res = await fetch('/api/auth/stop-impersonate', {
    method: 'POST',
    credentials: 'include'
  });
  
  if (res.ok) {
    window.location.href = '/employee';
  } else {
    alert('Failed to stop impersonation');
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    });
    window.location.href = '/login';
  } catch (error) {
    window.location.href = '/login';
  }
}

