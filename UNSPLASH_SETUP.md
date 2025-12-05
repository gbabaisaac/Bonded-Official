# Unsplash API Setup Guide

## Quick Answer: You Only Need the **Access Key** (NOT the Secret)

Unsplash API only requires an **Access Key** - you don't need the Secret Key.

## Setup Steps

1. **Go to Unsplash Developers**
   - Visit: https://unsplash.com/developers
   - Sign up or log in (free account)

2. **Create a New Application**
   - Click "New Application"
   - Fill in the application details:
     - Name: "Bonded Yearbook" (or any name)
     - Description: "College student yearbook demo"
     - Accept the API Use and Access Agreement

3. **Get Your Access Key**
   - After creating the application, you'll see:
     - **Application ID** (you don't need this)
     - **Access Key** ← **This is what you need!**
     - **Secret** (you don't need this)

4. **Add to Your Project**
   - Create a `.env` file in the `Bonded/` directory (if it doesn't exist)
   - Add this line:
     ```
     EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_access_key_here
     ```
   - Replace `your_access_key_here` with your actual Access Key

5. **Restart Your Dev Server**
   ```bash
   npx expo start --clear
   ```

## Example .env File

```
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=abc123xyz456789
```

## What If I Don't Set It Up?

**No problem!** The app will automatically use **Picsum Photos** as a fallback:
- ✅ Free, no API key needed
- ✅ Works immediately
- ⚠️ Less curated photos (random stock photos)
- ⚠️ Not specifically college-aged portraits

## Free Tier Limits

Unsplash free tier includes:
- 50 requests per hour
- Perfect for demos and development
- No credit card required

## Troubleshooting

- **Photos not loading?** Check that your `.env` file is in the `Bonded/` directory
- **Still not working?** The app will automatically fall back to Picsum Photos
- **Need more requests?** Upgrade to Unsplash+ (paid) or use the fallback

---

**TL;DR:** Just get the **Access Key** from Unsplash, add it to `.env` as `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_key`, and restart. That's it! 🎉

