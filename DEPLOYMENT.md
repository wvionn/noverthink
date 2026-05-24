# Deployment Guide

## Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)

### Steps

1. **Push your code to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables (Optional)**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add these if you want accurate sunrise/sunset times:
     - `NEXT_PUBLIC_LAT` - Your latitude (e.g., -6.2088)
     - `NEXT_PUBLIC_LON` - Your longitude (e.g., 106.8456)
   - If not set, the app will use browser time for day/night detection

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Automatic Deployments
- Every push to `main` branch will automatically deploy to production
- Pull requests will create preview deployments

## Audio Recommendations

The app currently uses Google's ocean waves sound. Here are better alternatives:

### Free Ambient Audio Sources

1. **Freesound.org** (Creative Commons)
   - Ocean waves: https://freesound.org/search/?q=ocean+waves
   - Rain sounds: https://freesound.org/search/?q=rain
   - Wind chimes: https://freesound.org/search/?q=wind+chimes

2. **YouTube Audio Library** (Royalty-free)
   - https://studio.youtube.com/channel/UC.../music
   - Download ambient tracks for free

3. **Incompetech** (Kevin MacLeod)
   - https://incompetech.com/music/royalty-free/music.html
   - Filter by "Ambient" genre

### Recommended Calming Sounds

For a meditation/release app, consider:

1. **Ocean Waves** (current) - Good for release/letting go
2. **Gentle Rain** - Calming, introspective
3. **Tibetan Singing Bowls** - Meditative, spiritual
4. **Soft Piano** - Emotional, reflective
5. **Forest Ambience** - Natural, grounding
6. **White Noise** - Neutral, focusing

### How to Change Audio

Replace the audio URL in `app/page.tsx`:

```typescript
// Find this line (around line 550):
audioRef.current = new Audio('YOUR_AUDIO_URL_HERE.ogg');
```

**Recommended format:** OGG or MP3, 128kbps, loopable (no fade in/out)

### Self-Hosting Audio

1. Add audio file to `/public/audio/` folder
2. Update the code:
   ```typescript
   audioRef.current = new Audio('/audio/ocean-waves.ogg');
   ```

## Security Check ✅

- ✅ No API keys or secrets in code
- ✅ `.env*` files are gitignored
- ✅ Only public environment variables used (NEXT_PUBLIC_*)
- ✅ No sensitive data in commits
- ✅ Safe to deploy publicly

## Performance Tips

- Audio file should be < 5MB for fast loading
- Consider using a CDN for audio files
- Enable Vercel Analytics for monitoring
