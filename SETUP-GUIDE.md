# 🔑 OpenChat Setup Guide - API Keys & Configuration

This guide will help you obtain all the necessary API keys and configure your environment properly.

## 📋 Required API Keys Checklist

- [ ] **Google OAuth Credentials** (Required for Google sign-in)
- [ ] **Auth Secret** (Required for session security)
- [ ] **OpenAI API Key** (Required for PRO plan OpenAI features)
- [ ] **Anthropic API Key** (Optional - for PRO plan Claude features)
- [ ] **Local LLM Setup** (Optional - for local AI models)

---

## 🔐 Step-by-Step API Key Setup

### 1. Generate Auth Secret

**Option A - Using OpenSSL (recommended):**
```bash
openssl rand -base64 32
```

**Option B - Online Generator:**
Visit: https://generate-secret.vercel.app/32

Copy the generated secret to your `.env.local` file:
```env
AUTH_SECRET="your-generated-secret-here"
```

---

### 2. Google OAuth Setup

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/

2. **Create or Select Project:**
   - Create a new project or select an existing one
   - Note your project name

3. **Enable APIs:**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google People API"

4. **Create OAuth Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - For production, also add: `https://yourdomain.com/api/auth/callback/google`

5. **Copy Credentials:**
   ```env
   AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
   AUTH_GOOGLE_SECRET="your-client-secret"
   ```

---

### 3. OpenAI API Key

1. **Create OpenAI Account:**
   - Visit: https://platform.openai.com/signup

2. **Navigate to API Keys:**
   - Go to: https://platform.openai.com/api-keys

3. **Create New Secret Key:**
   - Click "Create new secret key"
   - Give it a name (e.g., "OpenChat App")
   - Copy the key immediately (you won't see it again!)

4. **Add to Environment:**
   ```env
   OPENAI_API_KEY="sk-proj-your-key-here"
   ```

5. **Add Credits (Important!):**
   - Go to: https://platform.openai.com/account/billing
   - Add payment method and credits
   - Minimum $5 recommended for testing

---

### 4. Anthropic API Key (Optional)

1. **Create Anthropic Account:**
   - Visit: https://console.anthropic.com/

2. **Get API Key:**
   - Go to API Keys section
   - Create a new key

3. **Add to Environment:**
   ```env
   ANTHROPIC_API_KEY="sk-ant-your-key-here"
   ```

---

### 5. Local LLM Setup (Optional)

For running local AI models, you have several options:

#### Option A: Ollama (Recommended)
1. **Install Ollama:**
   - Visit: https://ollama.ai/
   - Download and install

2. **Pull a Model:**
   ```bash
   ollama pull llama2
   # or
   ollama pull codellama
   ```

3. **Configure Environment:**
   ```env
   LOCAL_LLM_ENDPOINT="http://host.docker.internal:11434/v1/chat/completions"
   ```

#### Option B: LM Studio
1. **Install LM Studio:**
   - Visit: https://lmstudio.ai/
   - Download and install

2. **Download a Model:**
   - Browse and download a model
   - Start the local server

3. **Configure Environment:**
   ```env
   LOCAL_LLM_ENDPOINT="http://host.docker.internal:1234/v1/chat/completions"
   ```

---

## 📝 Complete Environment File Example

Create `.env.local` with your actual values:

```env
# =============================================================================
# REQUIRED - Core Configuration
# =============================================================================
DATABASE_URL="postgresql://user:password@postgres:5432/mydatabase?schema=public"
AUTH_SECRET="your-32-char-secret-from-openssl"
NEXTAUTH_URL="http://localhost:3000"

# =============================================================================
# REQUIRED - Google OAuth
# =============================================================================
AUTH_GOOGLE_ID="123456789-abcdef.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-your-google-secret"

# =============================================================================
# REQUIRED - OpenAI (for PRO features)
# =============================================================================
OPENAI_API_KEY="sk-proj-your-actual-openai-key"

# =============================================================================
# OPTIONAL - Additional Providers
# =============================================================================
ANTHROPIC_API_KEY="sk-ant-your-actual-anthropic-key"
LOCAL_LLM_ENDPOINT="http://host.docker.internal:11434/v1/chat/completions"
```

---

## ✅ Verification Steps

### 1. Test Your Setup
```bash
# Copy environment file
cp .env.local.example .env.local

# Edit with your actual keys
nano .env.local  # or use your preferred editor

# Start the application
npm run docker:dev
```

### 2. Check Application Startup
- ✅ Containers start without errors
- ✅ Database migrations run successfully
- ✅ App accessible at http://localhost:3000

### 3. Test Authentication
- ✅ Google sign-in works
- ✅ Demo account works (`demo@example.com` / `password`)

### 4. Test LLM Providers
- ✅ Local LLM responds (if configured)
- ✅ OpenAI responds (with PRO plan)
- ✅ Anthropic responds (with PRO plan, if configured)

---

## 🚨 Common Issues & Solutions

### "Invalid Client" Error (Google OAuth)
- ✅ Check your redirect URI exactly matches: `http://localhost:3000/api/auth/callback/google`
- ✅ Make sure OAuth credentials are for "Web application" type
- ✅ Verify your Google Client ID and Secret are correct

### "Unauthorized" Error (OpenAI)
- ✅ Verify your OpenAI API key is correct
- ✅ Check you have billing set up and credits available
- ✅ Ensure the key has the right permissions

### Database Connection Issues
- ✅ Make sure Docker is running
- ✅ Check the database container started successfully: `docker-compose logs postgres`
- ✅ Verify DATABASE_URL format is correct

### Local LLM Not Working
- ✅ Make sure your local LLM server is running
- ✅ Check the endpoint URL is correct
- ✅ Use `host.docker.internal` instead of `localhost` for Docker

---

## 💰 Cost Considerations

### OpenAI Pricing (as of 2024)
- **GPT-3.5-turbo**: ~$0.001 per 1K tokens
- **Typical chat message**: 50-200 tokens
- **$5 credit**: ~2,500-10,000 messages

### Free Options
- **Demo Account**: Works without any API keys
- **Local LLM**: Completely free, runs on your hardware
- **Google OAuth**: Free for most usage levels

---

## 🔄 Next Steps

1. **Complete the setup** using this guide
2. **Run the application**: `npm run docker:dev`
3. **Test all features** with both demo and Google accounts
4. **Explore the chat interface** with different LLM providers
5. **Deploy to production** when ready

---

## 📞 Need Help?

- Check the main [README.md](./README.md) for general setup
- Review Docker logs: `npm run docker:logs`
- Reset everything: `npm run docker:cleanup` then `npm run docker:dev`

Happy chatting! 🤖💬