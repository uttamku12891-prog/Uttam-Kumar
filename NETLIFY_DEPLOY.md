# 🚀 How to Deploy UKG AI on Netlify

This application is fully pre-configured for **Netlify** with automatic serverless functions and SPA routing via `netlify.toml`.

---

## ⚡ Quick 3-Step Deployment

### Step 1: Push to GitHub or GitLab
1. Initialize your git repository if not already done.
2. Push your code to your GitHub / GitLab / Bitbucket repository.

### Step 2: Connect to Netlify
1. Log in to [Netlify](https://app.netlify.com).
2. Click **"Add new site"** > **"Import an existing project"**.
3. Select your repository.
4. Netlify will automatically detect settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`

### Step 3: Add Your Free Gemini API Key (Important!)
1. In your Netlify Site dashboard, go to:
   **Site configuration** > **Environment variables** > **Add a variable**.
2. Key: `GEMINI_API_KEY`
3. Value: *Your Gemini API Key* (from [Google AI Studio](https://aistudio.google.com/app/apikey))
4. Click **Create variable**.
5. Trigger a **Deploy** (or push a new commit).

---

## 📱 Mobile Best Practices
- **HTTPS Enabled by Default:** Netlify automatically provides free SSL/HTTPS, which is **required** by mobile browsers (Chrome, Safari) for microphone access.
- **Microphone Permission:** When opening UKG on your mobile phone, tap **Allow** when prompted for microphone access.
- **Audio Autoplay:** Mobile browsers require a first user tap to allow audio playback. Tap the center **Arc Reactor** or **SPEAK** button once to activate UKG's voice.

---

## 🛠 Project Structure for Netlify

| Path | Purpose |
| :--- | :--- |
| `netlify.toml` | Build configuration, SPA routing (`/* -> /index.html`), and API redirects (`/api/* -> /.netlify/functions/*`) |
| `netlify/functions/chat-audio.ts` | Serverless audio & text Gemini 3.8 Flash endpoint |
| `netlify/functions/tts.ts` | Serverless Gemini TTS speech synthesizer |
| `netlify/functions/health.ts` | Status & health check endpoint |
| `dist/` | Production static build output |
