import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { parse } from 'url';

const prisma = new PrismaClient();

const server = createServer(async (req, res) => {
  const url = parse(req.url || '', true);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    if (url.pathname === '/users') {
      const users = await prisma.user.findMany({
        include: {
          chats: {
            include: {
              conversations: {
                include: {
                  messages: true
                }
              }
            }
          }
        }
      });
      res.writeHead(200);
      res.end(JSON.stringify(users, null, 2));
    }
    else if (url.pathname === '/chats') {
      const chats = await prisma.chat.findMany({
        include: {
          user: true,
          conversations: {
            include: {
              messages: true
            }
          }
        }
      });
      res.writeHead(200);
      res.end(JSON.stringify(chats, null, 2));
    }
    else if (url.pathname === '/conversations') {
      const conversations = await prisma.conversation.findMany({
        include: {
          chat: {
            include: {
              user: true
            }
          },
          messages: true
        }
      });
      res.writeHead(200);
      res.end(JSON.stringify(conversations, null, 2));
    }
    else if (url.pathname === '/messages') {
      const messages = await prisma.message.findMany({
        include: {
          conversation: {
            include: {
              chat: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });
      res.writeHead(200);
      res.end(JSON.stringify(messages, null, 2));
    }
    else if (url.pathname === '/stats') {
      const stats = {
        users: await prisma.user.count(),
        chats: await prisma.chat.count(),
        conversations: await prisma.conversation.count(),
        messages: await prisma.message.count(),
      };
      res.writeHead(200);
      res.end(JSON.stringify(stats, null, 2));
    }
    else if (url.pathname === '/' || url.pathname === '/index.html') {
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>OpenChat Database Viewer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .endpoint { margin: 10px 0; }
        .endpoint a { 
            display: inline-block; 
            padding: 10px 15px; 
            background: #007cba; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin-right: 10px;
        }
        .endpoint a:hover { background: #005a87; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center;
            min-width: 100px;
        }
        .stat-number { font-size: 2em; font-weight: bold; color: #007cba; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗄️ OpenChat Database Viewer</h1>
        <p>A simple database viewer for development. This shows your current database contents.</p>
        
        <div class="stats" id="stats">
            <!-- Stats will be loaded here -->
        </div>
        
        <h2>📊 Endpoints</h2>
        <div class="endpoint">
            <a href="/stats">📈 Database Stats</a>
            <span>Shows counts of all entities</span>
        </div>
        
        <div class="endpoint">
            <a href="/users">👥 Users</a>
            <span>All users with their chats and conversations</span>
        </div>
        
        <div class="endpoint">
            <a href="/chats">💬 Chats</a>
            <span>All chats with their conversations and messages</span>
        </div>
        
        <div class="endpoint">
            <a href="/conversations">🗨️ Conversations</a>
            <span>All conversations with their messages</span>
        </div>
        
        <div class="endpoint">
            <a href="/messages">📝 Messages</a>
            <span>All messages with full context</span>
        </div>
        
        <h2>💡 Tips</h2>
        <ul>
            <li>Click on any endpoint to view the data in JSON format</li>
            <li>Use your browser's developer tools to inspect the data</li>
            <li>This viewer automatically refreshes data on each request</li>
            <li>To stop this viewer, press Ctrl+C in the terminal</li>
        </ul>
    </div>

    <script>
        // Load stats on page load
        fetch('/stats')
            .then(res => res.json())
            .then(stats => {
                document.getElementById('stats').innerHTML = \`
                    <div class="stat-card">
                        <div class="stat-number">${'${stats.users}'}</div>
                        <div>Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${'${stats.chats}'}</div>
                        <div>Chats</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${'${stats.conversations}'}</div>
                        <div>Conversations</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${'${stats.messages}'}</div>
                        <div>Messages</div>
                    </div>
                \`;
            })
            .catch(err => console.error('Failed to load stats:', err));
    </script>
</body>
</html>
      `);
    }
    else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error: any) {
    console.error('API Error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
});

const PORT = 5558;
server.listen(PORT, () => {
  console.log('🗄️ Database Viewer running at:');
  console.log(`   http://localhost:${PORT}`);
  console.log('');
  console.log('Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down database viewer...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Database viewer stopped');
    process.exit(0);
  });
});