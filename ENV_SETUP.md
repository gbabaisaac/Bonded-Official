# Environment Variables Setup

## Creating the .env File

1. **Create the file in the correct location:**
   - File path: `Bonded/.env` (in the Bonded directory, same level as package.json)
   - NOT in the root `Official-Bond` directory

2. **Add your Unsplash Access Key:**
   ```
   EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your_actual_access_key_here
   ```

3. **Important Notes:**
   - The variable MUST start with `EXPO_PUBLIC_` for Expo to read it
   - No quotes around the value
   - No spaces around the `=` sign
   - Restart your dev server after creating/updating the file

## Example .env File

```
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=abc123xyz456789def
```

## Verify It's Working

After adding the key and restarting:
1. Check the console logs - you should see:
   - "Unsplash API Key loaded: Yes"
   - "📸 Fetching 200 photos from Unsplash..."
   - "✅ Successfully fetched 200 photos from Unsplash"

2. If you see "⚠️ No Unsplash API key found", check:
   - File is named exactly `.env` (not `.env.txt` or `.env.local`)
   - File is in the `Bonded/` directory
   - Variable name is exactly `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY`
   - You restarted the dev server with `npx expo start --clear`

## Troubleshooting

**Still not working?**
1. Make sure the file is in `Bonded/.env` (not `Official-Bond/.env`)
2. Restart with: `npx expo start --clear`
3. Check console for error messages
4. The app will automatically use Picsum Photos if Unsplash fails

