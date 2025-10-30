# User Setup Guide

This guide explains how to create users for the BerganCo SEO Reporting System.

## Initial Setup

After deployment, you need to create your first admin user. The database migration will run automatically on Railway.

### Option 1: Using Environment Variables (Recommended)

1. **Set environment variables in Railway:**
   - `ADMIN_EMAIL` = your email (e.g., `chris@stuchai.com`)
   - `ADMIN_PASSWORD` = a secure password
   - `ADMIN_NAME` = Your Name (e.g., `Chris`)

2. **Run the setup script:**
   ```bash
   railway run npx tsx src/scripts/create-admin.ts
   ```

### Option 2: Manual Database Entry

Use Railway's database console or Prisma Studio:

```bash
railway run npx prisma studio
```

Then manually insert a user with:
- Email: your email
- Password Hash: (use the auth service to hash a password)
- Name: Your Name
- Role: `ADMIN`

## Creating Users

### For Your Setup (2 Admins + 1 Client)

#### Admin Users (You + Employee)

1. **Login to Employee Portal** (`/employee.html`)
2. **Click "Create User"**
3. **Fill in details:**
   - Name: Full name
   - Email: Work email
   - Password: Secure password (share securely)
   - Role: **ADMIN** (for you and your employee)
4. **Click "Create"**

#### Client User

1. **Login to Employee Portal** (`/employee.html`)
2. **Click "Create User"**
3. **Fill in details:**
   - Name: Client's name
   - Email: Client's email
   - Password: Generate a secure password (share securely)
   - Role: **CLIENT**
4. **Click "Create"**

## User Roles

### ADMIN
- Full access to all features
- Can create/edit/delete users
- Can impersonate clients
- Can access Employee Portal

### EMPLOYEE
- Can view and manage users
- Can impersonate clients
- Can access Employee Portal
- Cannot delete admin users

### CLIENT
- View-only access to their SEO dashboard
- Can see Analytics, Pages, Queries
- Cannot see Employee Portal
- Cannot access user management

## Impersonation Feature

### How to Impersonate a Client

1. **Login as Admin/Employee** to `/employee.html`
2. **Find the client** in the user table
3. **Click "View As"** button next to their name
4. **You'll be redirected** to their dashboard view
5. **See exactly what they see** - helpful for troubleshooting

### Stop Impersonation

- **Click "Stop Viewing As"** in the navigation sidebar
- You'll be returned to the Employee Portal

## Security Notes

- All passwords are hashed using PBKDF2
- Sessions expire after 7 days
- Impersonation sessions are tracked
- Only admins/employees can impersonate clients
- Clients cannot see or access admin features

## Recommended Setup

For your specific case:

1. **Create Admin User #1** (You)
   - Email: `your@stuchai.com`
   - Role: `ADMIN`

2. **Create Admin User #2** (Employee)
   - Email: `employee@stuchai.com`
   - Role: `ADMIN` or `EMPLOYEE`

3. **Create Client User**
   - Email: `client@berganco.com`
   - Role: `CLIENT`

After creating these users, you can:
- Log in as admin and manage everything
- Impersonate the client to see their view
- The client can log in and see only their dashboard

## Troubleshooting

**"Can't create admin user"**
- Ensure database migrations have run
- Check Railway logs for errors
- Verify environment variables are set correctly

**"Can't login"**
- Verify user was created successfully
- Check email/password spelling
- Ensure user is active (isActive = true in database)

**"Can't impersonate"**
- Ensure you're logged in as ADMIN or EMPLOYEE
- Verify target user has CLIENT role
- Check browser cookies are enabled

