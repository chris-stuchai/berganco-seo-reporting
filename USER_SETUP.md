# User Setup Guide

This guide explains how to create users for the BerganCo SEO Reporting System.

## Initial Setup - Automatic (No Local Commands!)

Your first admin user is created **automatically** when the service starts on Railway if you set these environment variables:

### Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Select your service
3. Go to the **Variables** tab
4. Add these variables:
   - `ADMIN_EMAIL` = your email (e.g., `chris@stuchai.com`)
   - `ADMIN_PASSWORD` = a secure password
   - `ADMIN_NAME` = Your Name (e.g., `Chris`)

5. **That's it!** The admin user will be created automatically when the service restarts.

**Note:** The admin user is only created if it doesn't already exist, so it's safe to set these variables. Once created, you can remove these variables or change the password through the Employee Portal.

## Creating Additional Users (All Through Web UI)

After your first admin is created automatically, you can create all other users through the web interface - **no local commands needed!**

### For Your Setup (2 Admins + 1 Client)

#### Step 1: Create Additional Admin (Your Employee)

1. **Login to Employee Portal** (`/employee.html`) using your auto-created admin account
2. **Click "Create User"** button
3. **Fill in details:**
   - Name: Employee's full name
   - Email: Employee's work email
   - Password: Secure password (share securely via password manager)
   - Role: **ADMIN** or **EMPLOYEE**
4. **Click "Create"**

#### Step 2: Create Client User

1. **Still in Employee Portal** (`/employee.html`)
2. **Click "Create User"** button again
3. **Fill in details:**
   - Name: Client's name (e.g., "BerganCo Client")
   - Email: Client's email
   - Password: Generate a secure password (share securely)
   - Role: **CLIENT**
4. **Click "Create"**

**That's it!** All done through the web interface - no local commands or Railway CLI needed.

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

**"Can't login after setting ADMIN_EMAIL"**
- Wait for Railway to restart the service (takes ~30 seconds)
- Check Railway logs - you should see: `✅ Admin user created: your@email.com`
- If you see `⚠️ Failed to create admin user`, check that ADMIN_PASSWORD is set
- Try logging in with the email/password you set

**"Admin user already exists" message in logs**
- This is normal! The system won't create duplicate users
- Just use your existing admin account to log in
- You can create additional admins through the Employee Portal

**"Can't login"**
- Double-check your email and password in Railway variables
- Ensure user is active (users are active by default)
- Check browser cookies are enabled
- Try clearing cookies and logging in again

**"Can't impersonate"**
- Ensure you're logged in as ADMIN or EMPLOYEE
- Verify target user has CLIENT role
- Check browser cookies are enabled

**"Service won't start"**
- Check Railway logs for database connection errors
- Verify DATABASE_URL is set correctly in Railway
- Ensure migrations completed successfully (check logs)

