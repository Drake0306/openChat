# OpenChat - Multi-Provider LLM Chat Application

A sophisticated, containerized Next.js application that provides a premium chat experience with multiple LLM providers based on subscription tiers.

## 🚀 Quick Start

### Deploy to Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/openchat)

See [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md) for detailed deployment instructions.

### Prerequisites for Local Development
- Docker Desktop installed and running
- Git (to clone the repository)

### Option 1: Using NPM Scripts (Recommended)
```bash
# Setup and start development environment
npm run docker:dev

# View logs
npm run docker:logs

# Stop the application
npm run docker:stop
```

### Option 2: Using Scripts Directly

**Windows:**
```cmd
# Run the development setup
scripts\dev-setup.bat
```

**Linux/Mac:**
```bash
# Run the development setup
./scripts/dev-setup.sh
```

## 📋 Available Scripts

### Development Scripts
| Script | Description |
|--------|-------------|
| `npm run docker:dev` | Complete development setup with Docker |
| `npm run docker:build` | Build production Docker image |
| `npm run docker:reset` | Reset database (⚠️ deletes all data) |
| `npm run docker:cleanup` | Complete cleanup of containers and images |
| `npm run docker:logs` | View application logs |
| `npm run docker:stop` | Stop running containers |

### Deployment Scripts
| Script | Description |
|--------|-------------|
| `npm run vercel-build` | Full build command for Vercel (DB setup + build) |
| `npm run test:deployment` | Test deployment configuration |
| `npm run db:seed` | Seed database with demo data |
| `npm run postinstall` | Generate Prisma client after install |

## 🔧 Manual Setup

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd openChat
   ```

2. **Create environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Edit `.env.local` with your API keys:**
   ```env
   AUTH_SECRET="your-auth-secret-here"
   AUTH_GOOGLE_ID="your-google-oauth-client-id"
   AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
   OPENAI_API_KEY="your-openai-api-key"
   ANTHROPIC_API_KEY="your-anthropic-api-key"
   ```

4. **Start with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

5. **Setup database (in another terminal):**
   ```bash
   docker-compose exec nextjs-dev npx prisma db push
   docker-compose exec nextjs-dev npx prisma generate
   ```

## 🌐 Access the Application

- **Web Application**: http://localhost:3000
- **Database**: localhost:5432 (postgres/postgres)

## 👤 Demo Account

For quick testing, use the built-in demo account:
- **Email**: `demo@example.com`
- **Password**: `password`
- **Plan**: PRO (access to all LLM providers)

## 📊 Subscription Plans

### Basic Plan
- ✅ Local LLM access
- 💰 Free tier

### Pro Plan  
- ✅ Local LLM access
- ✅ OpenAI (GPT-3.5-turbo)
- ✅ Anthropic Claude
- 💰 Premium tier

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Auth.js (NextAuth v5)
- **UI**: Shadcn UI + Tailwind CSS
- **Containerization**: Docker & Docker Compose

### Project Structure
```
openChat/
├── app/                    # Next.js app router
│   ├── (app)/             # Protected routes
│   │   ├── chat/          # Chat interface
│   │   └── subscribe/     # Subscription plans
│   ├── (auth)/            # Authentication routes
│   └── api/               # API routes
├── lib/                   # Shared utilities
│   ├── auth.ts            # Auth.js configuration
│   ├── db.ts              # Prisma client
│   ├── llm-providers.ts   # LLM service functions
│   └── actions.ts         # Server actions
├── scripts/               # Docker utility scripts
├── prisma/                # Database schema
└── components/            # Reusable UI components
```

## 🔐 Environment Variables

Required environment variables (see `.env.local.example`):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase?schema=public"

# Authentication
AUTH_SECRET="your-secret-here"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
NEXTAUTH_URL="http://localhost:3000"

# LLM Providers
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
LOCAL_LLM_ENDPOINT="http://localhost:1234/v1/chat/completions"
```

## 🐳 Docker Configuration

### Development
- **Dockerfile**: `Dockerfile.dev`
- **Compose**: `docker-compose.yml`
- Features hot-reloading with volume mounting

### Production
- **Dockerfile**: `Dockerfile.prod`
- Multi-stage build for optimized image size
- Includes Prisma generation and Next.js build

## 🗄️ Database Management

### Reset Database
```bash
npm run docker:reset
```

### Manual Prisma Commands
```bash
# Push schema changes
docker-compose exec nextjs-dev npx prisma db push

# Generate client
docker-compose exec nextjs-dev npx prisma generate

# View database
docker-compose exec nextjs-dev npx prisma studio
```

## 🔧 Troubleshooting

### Docker Issues
- Ensure Docker Desktop is running
- Check port 3000 and 5432 are available
- Run `npm run docker:cleanup` for fresh start

### Database Issues
- Use `npm run docker:reset` to reset database
- Check DATABASE_URL in environment file
- Verify PostgreSQL container is running

### Authentication Issues
- Verify Google OAuth credentials
- Check AUTH_SECRET is set
- Ensure NEXTAUTH_URL matches your domain

## 🛠️ Development

### Local Development (without Docker)
```bash
# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local

# Start database (requires PostgreSQL)
# Update DATABASE_URL to your local instance

# Run migrations
npx prisma db push
npx prisma generate

# Start development server
npm run dev
```

### Production Build
```bash
npm run docker:build
```

## 📝 API Documentation

### Chat API (`/api/chat`)
- **Method**: POST
- **Authentication**: Required
- **Body**: `{ messages: Array, provider: string }`
- **Response**: Streaming text response

### Supported Providers
- `local-llm`: Local LLM endpoint
- `openai`: OpenAI GPT-3.5-turbo
- `anthropic`: Anthropic Claude (mock implementation)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run docker:dev`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.