# 🌊 Message in a Bottle

A calming web app for emotional release and gratitude. Write your thoughts, release them to the ocean, or send gratitude to the stars.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🌊 Release Mode
- Write down what's weighing on your mind
- Watch it transform into a bottle
- Release it into the ocean with a breathing exercise
- Let go of your worries

### ⭐ Gratitude Mode
- Express what you're grateful for
- Watch your gratitude become a star in the sky
- Build a constellation of positive moments
- Hover over stars to see past gratitudes

### 🧘 Emotional Support
- **Reflection Prompts** - Get writing prompts when you're stuck
- **Emotion Wheel** - Identify and name your feelings
- **Pre-Release Check** - Pause and reflect before letting go
- **Calming Audio** - Meditation music plays automatically

### 🌙 Celestial Events
- **Full Moon** - Appears during actual full moon phases
- **Meteor Showers** - Real dates (Aug 10-14, Dec 13-14, Jan 3-4)
- **Aurora Borealis** - Toggle manually for beautiful northern lights
- **Bioluminescent Plankton** - Glowing particles at night

### 🎨 Dynamic Atmosphere
- **Auto Day/Night** - Changes based on your location or time
- **Manual Override** - Switch between Day, Dusk, and Night
- **Smooth Animations** - Calming transitions and effects

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/message-in-a-bottle.git
   cd message-in-a-bottle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🌐 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/message-in-a-bottle)

### Manual Deploy

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Click "Deploy"

Done! Your app will be live in minutes.

### Optional: Add Location for Accurate Sunrise/Sunset

In Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_LAT=your_latitude
NEXT_PUBLIC_LON=your_longitude
```

Example:
```
NEXT_PUBLIC_LAT=-6.2088
NEXT_PUBLIC_LON=106.8456
```

## 📖 How to Use

### Release Your Thoughts
1. Click the text area
2. Write what's on your mind
3. Use "Need a prompt?" if you're stuck
4. Use "How am I feeling?" to identify emotions
5. Click "Release"
6. Reflect on "What do you need right now?"
7. Confirm and watch it sink into the ocean
8. Breathe with the guided breathing exercise

### Express Gratitude
1. Click the 🌊/⭐ toggle to switch to Gratitude mode
2. Write what you're grateful for
3. Click "Send to Stars"
4. Watch it become a star in the sky
5. Hover over stars to see past gratitudes

### Explore Events
1. Click "Events" button
2. Toggle celestial events:
   - 🌕 Full Moon
   - ☄️ Meteor Shower
   - 🌌 Aurora Borealis
3. Set time to "Night" to see them

### Control Audio
- Audio plays automatically after releasing a message
- Click the 🔊 button to pause/play
- Volume is set to 30% for comfort

## 🎵 Audio

The app uses calming meditation ambient music that plays automatically when you release a message.

**Current audio:** `leberch-meditation-ambient-375361.mp3`

### Change Audio

1. Add your audio file to `/public/` folder
2. Edit `app/page.tsx` line ~513:
   ```typescript
   audioRef.current = new Audio('/your-audio-file.mp3');
   ```

**Recommended:**
- Format: MP3 or OGG
- Size: Under 5MB
- Loopable (no fade in/out)
- Calming/ambient style

## 🛠️ Tech Stack

- **Framework:** Next.js 16.2 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Fonts:** Google Fonts (Cormorant Garamond, Manrope)
- **Deployment:** Vercel

## 📁 Project Structure

```
message-in-a-bottle/
├── app/
│   ├── page.tsx          # Main app component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── public/
│   └── *.mp3            # Audio files
├── .env.example         # Environment variables template
├── vercel.json          # Vercel configuration
└── README.md            # You are here
```

## 🎨 Customization

### Change Colors

Edit `app/page.tsx` - search for color classes:
- Ocean: `text-blue-*`, `bg-blue-*`
- Stars: `text-yellow-*`, `bg-yellow-*`
- Background gradients: `from-[#color] to-[#color]`

### Adjust Animations

Edit timing in `app/page.tsx`:
- `releaseDurationMs` - How long bottle sinks (default: 10s)
- `breathInMs` - Breathing in duration (default: 4s)
- `breathHoldMs` - Hold breath duration (default: 2s)

### Add More Affirmations

Edit `affirmations` array in `app/page.tsx`:
```typescript
const affirmations = [
  'You did well letting it go.',
  'Your custom affirmation here.',
  // Add more...
];
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 💖 Acknowledgments

- Meditation audio by Leberch
- Inspired by the therapeutic practice of writing and releasing
- Built with love for mental wellness

## 🔗 Links

- [Live Demo](https://your-app.vercel.app)
- [Report Bug](https://github.com/yourusername/message-in-a-bottle/issues)
- [Request Feature](https://github.com/yourusername/message-in-a-bottle/issues)

---

Made with 💙 for emotional wellness and mindfulness
