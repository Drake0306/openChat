# Vercel Deployment Guide

This guide will help you deploy OpenChat to Vercel with proper database setup and configuration.

## 🚀 Quick Deployment

### 1. Deploy to Vercel

Click the deploy button or manually deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/openchat)

### 2. Required Environment Variables

Set these environment variables in your Vercel project settings:

#### **Database**
```bash
DATABASE_URL="file:./dev.db"
# For production, consider using a cloud database like PlanetScale, Neon, or Turso
```

#### **Authentication (NextAuth.js)**
```bash
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="https://your-app.vercel.app"

# Google OAuth (Optional)
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
```

#### **LLM Providers (Optional)**
```bash
OPENAI_API_KEY="sk-your-openai-api-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"
LM_STUDIO_URL="http://localhost:1234/v1"
OLLAMA_URL="http://localhost:11434"
```

#### **Stripe (For Subscriptions - Optional)**
```bash
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

## 🔧 Build Process

The deployment uses the `vercel-build` script which:

1. **Generates Prisma Client** (`prisma generate`)
2. **Pushes Database Schema** (`prisma db push`)
3. **Seeds the Database** (`tsx prisma/seed.ts`)
4. **Builds Next.js Application** (`next build`)

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma db push && tsx prisma/seed.ts && next build"
  }
}
```

## 📦 Database Setup

### SQLite (Default - Development)
- Works out of the box on Vercel
- Suitable for demos and small applications
- Limited concurrent connections

### Recommended Production Databases

#### **PlanetScale (MySQL)**
```bash
DATABASE_URL="mysql://username:password@host/database?sslaccept=strict"
```

#### **Neon (PostgreSQL)**
```bash
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

#### **Turso (SQLite)**
```bash
DATABASE_URL="libsql://your-database.turso.io?authToken=your-token"
```

## 🎯 Deployment Steps

### 1. Fork the Repository
```bash
git clone https://github.com/yourusername/openchat.git
cd openchat
```

### 2. Install Vercel CLI (Optional)
```bash
npm i -g vercel
vercel login
```

### 3. Deploy
```bash
vercel --prod
```

### 4. Configure Environment Variables
Go to your Vercel dashboard → Project Settings → Environment Variables

Add all required variables listed above.

### 5. Redeploy (if needed)
```bash
vercel --prod
```

## 🔐 Security Notes

1. **Generate a strong NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

2. **Use production database URLs** for live apps

3. **Keep API keys secure** - never commit them to Git

4. **Enable HTTPS** (Vercel provides this automatically)

## 🛠️ Troubleshooting

### Build Errors

#### **Prisma Generate Issues**
```bash
# Add to package.json if needed
"postinstall": "prisma generate"
```

#### **Database Connection Issues**
- Verify `DATABASE_URL` is correct
- Check database provider compatibility
- Ensure database is accessible from Vercel

#### **Missing Dependencies**
```bash
npm install --save-dev prisma tsx
```

### Runtime Errors

#### **Authentication Errors**
- Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- Check Google OAuth credentials
- Ensure callback URLs are configured

#### **API Errors**
- Check LLM provider API keys
- Verify API endpoints are accessible
- Review Vercel function logs

## 📊 Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor function performance
- Check error rates

### Database Monitoring
- Use Prisma Studio: `npx prisma studio`
- Monitor connection counts
- Check query performance

## 🚀 Performance Tips

1. **Use Edge Runtime** for better performance:
   ```typescript
   export const runtime = 'edge';
   ```

2. **Optimize Database Queries**:
   - Use proper indexes
   - Limit query results
   - Cache frequent queries

3. **Configure CDN**:
   - Vercel handles this automatically
   - Optimize images with Next.js Image component

## 📱 Testing

### Local Testing
```bash
npm run dev
```

### Production Testing
```bash
npm run build
npm start
```

### Database Testing
```bash
npm run db:studio
```

---

## 🎉 Success!

Your OpenChat application should now be live on Vercel with:
- ✅ Database setup and seeded data
- ✅ Authentication working
- ✅ Beautiful sign-in page
- ✅ Multi-provider LLM support
- ✅ Responsive design

Visit your deployment URL and test with the demo account:
- **Email:** `demo@example.com`
- **Password:** `password`