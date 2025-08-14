# Database Setup Guide

## Quick Start

The database will be automatically initialized when you run the development server. However, if you encounter issues or want to manually set up the database, follow the steps below.

## Automatic Setup (Recommended)

When you run `npm run dev` for the first time, the application will automatically:
1. Generate the Prisma client
2. Apply the database schema
3. Run any pending seeds

## Manual Setup Commands

### Reset Database (Fresh Start)
```bash
npm run db:reset
```
This will:
- Drop all tables
- Recreate the database schema
- Run seeds

### Individual Commands
```bash
# Generate Prisma client
npx prisma generate

# Apply schema to database
npx prisma db push

# Run seeds only
npm run db:seed

# Open Prisma Studio (database GUI) - if working
npm run db:studio

# Alternative database viewer (if Prisma Studio has issues)
npm run db:viewer

# Fix Windows Prisma issues
npm run db:fix-windows
```

### Full Development Setup
```bash
# For cross-platform (Linux/Mac/Windows)
npm run dev:setup

# For Windows only (if you have permission issues)
npm run dev:setup:win
```

## Database Schema

The application uses the following main models:

### User
- Stores user authentication data
- Links to user's chats
- Tracks subscription plan

### Chat (Parent Container)
- Top-level chat sessions shown in sidebar
- Contains multiple conversations
- Has a title and timestamps

### Conversation (Internal Conversations)
- Individual conversation threads within a chat
- Linked to a specific provider and model
- Contains messages

### Message
- Individual messages within conversations
- Stores role (user/assistant) and content

## Database File Location

The SQLite database is located at:
```
prisma/dev.db
```

## Troubleshooting

### Windows Permission Issues (EPERM errors)
If you see `EPERM` errors on Windows when using Prisma:
1. Close all IDEs/editors
2. Run terminal as administrator
3. Try `npm run db:fix-windows`
4. If still failing, use the alternative viewer: `npm run db:viewer`

**Alternative Database Viewer**
If Prisma Studio doesn't work due to Windows issues:
```bash
npm run db:viewer
```
Then open http://localhost:5558 in your browser for a simple database viewer.

### Database Connection Errors
If you see connection errors:
1. Make sure the `DATABASE_URL` is set in `.env`
2. Run `npm run db:reset` to recreate the database
3. Check if the `prisma` folder exists

### Migration Issues
If the schema changes and you have data you want to keep:
1. Use `npx prisma migrate dev` instead of `db push`
2. For development, you can safely use `npm run db:reset`

## Adding Seeds

The seeder automatically creates demo users for development:

### Default Demo Users
- **Demo User**: `demo@example.com` / `password` (PRO plan)  
- **Test User**: `test@example.com` / `password` (BASIC plan)

These users are created automatically when you run `npm run db:seed` and can be used to sign in immediately.

To add more seed data, edit `prisma/seed.ts`:

```typescript
// Example: Create additional users
const newUser = await prisma.user.upsert({
  where: { email: 'newuser@example.com' },
  update: {},
  create: {
    email: 'newuser@example.com',
    name: 'New User',
    plan: 'BASIC',
  },
});
```

Then run:
```bash
npm run db:seed
```

## Production Deployment

For production:
1. Use `npx prisma migrate deploy` instead of `db push`
2. Set up proper database backups
3. Use a production-grade database (PostgreSQL/MySQL)