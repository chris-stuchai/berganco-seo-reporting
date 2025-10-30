# 🔑 How to Get Google Refresh Token

The refresh token lets the app automatically authenticate with Google Search Console API.

---

## Step-by-Step Process

### 1. Make Sure Client ID is Real

Open your `.env` file and verify:
```env
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
```
(Must NOT say "your-client-id")

If it's still a placeholder:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Copy it
4. Update `.env`

### 2. Run Setup Script

```bash
npm run setup
```

### 3. Visit the Authorization URL

The script will show you a URL like:
```
https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=...
```

**Do this:**
1. Copy the entire URL
2. Paste it in your browser
3. Sign in with the Google account that has access to BerganCo's Search Console
4. Click "Allow" or "Continue"
5. You might see "Unverified app" warning → Click "Advanced" → "Go to BerganCo SEO Reporter (unsafe)"

### 4. Get the Authorization Code

After authorizing, Google will try to redirect to:
```
http://localhost:3000/oauth2callback?code=4/0AeanRr...
```

**The page will show "can't connect" - THAT'S OK!**

**Important:** Look at your browser's address bar. You'll see something like:
```
http://localhost:3000/oauth2callback?code=4/0AeanRrAbCdEfGhIjKlMnOpQrStUvWxYz
```

### 5. Copy the Code

**Copy everything after `code=`**

For example, if the URL is:
```
http://localhost:3000/oauth2callback?code=4/0AeanRrAbCdEfGhIjKlMnOpQrStUvWxYz
```

Copy: `4/0AeanRrAbCdEfGhIjKlMnOpQrStUvWxYz`

### 6. Paste Back in Terminal

Go back to your terminal where `npm run setup` is waiting.

It will say:
```
Step 2: Enter the authorization code from the redirect URL:
```

Paste the code you copied and press Enter.

### 7. Get Your Refresh Token

The script will exchange the code for tokens and show:
```
✅ Success! Add this to your .env file:

GOOGLE_REFRESH_TOKEN="1//0gxxxxxxxxxxxxxxxxxxxxxxxxxxxxx..."
```

### 8. Add to .env

Open your `.env` file and update:
```env
GOOGLE_REFRESH_TOKEN="1//0gxxxxxxxxxxxxxxxxxxxxxxxxxxxxx..."
```
(Paste the actual token it gives you)

---

## 🆘 Troubleshooting

### "Invalid redirect URI"
- Make sure you added `http://localhost:3000/oauth2callback` in Google Cloud Console
- Go to: https://console.cloud.google.com/apis/credentials
- Edit your OAuth client
- Add the redirect URI

### "Access blocked"
- Make sure your Google account is added as a test user
- Go to: https://console.cloud.google.com/apis/credentials/consent
- Add your email to "Test users"

### Can't see the code in URL
- Check the full address bar (not just the page content)
- The URL might be very long - that's normal
- Copy everything after `code=`

### "Invalid grant"
- The code expires after a few minutes
- Run `npm run setup` again to get a new code
- Paste the code quickly

---

## ✅ Success!

Once you add the refresh token to `.env`, you're done! The app will automatically authenticate using this token.

---

**Ready?** Make sure your Client ID is real, then run:
```bash
npm run setup
```

