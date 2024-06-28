const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');
const RedisStore = require('connect-redis').default;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Redis client
const redisClient = new Redis({
  host: 'redis-12804.c1.asia-northeast1-1.gce.redns.redis-cloud.com',
  port: 12804,
  password: 'Vri0Mww14yun1uxJ1KqEDE2kHvICYGen',
  maxRetriesPerRequest: null,
  retryStrategy: times => Math.min(times * 50, 2000), // Retry strategy for reconnection
});

app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());

// Session configuration
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'AfeAyoSunday1', // Replace with a secure random key
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true, // Ensures cookies are only accessed via HTTP(S)
    maxAge: 24 * 60 * 60 * 1000 // Session expires after 1 day (adjust as needed)
  }
}));

app.set('view engine', 'ejs');
app.set('views', './views');

// Route to handle setting the username
app.post('/set-username', (req, res) => {
  const { username } = req.body;
  if (username) {
    req.session.username = username; // Store username in the session
    res.status(200).send('Username set');
  } else {
    res.status(400).send('Invalid username');
  }
});

app.get('/', (req, res) => {
  res.render('index', { sessionId: req.sessionID });
});

// WebSocket server handling
const clients = new Map();

wss.on('connection', (ws, req) => {
  const sessionId = new URLSearchParams(req.url.split('?')[1]).get('sessionId');

  if (!clients.has(sessionId)) {
    clients.set(sessionId, {
      currentOrder: [],
      orderHistory: []
    });
  }

  ws.send(JSON.stringify({
    content: `Welcome! Please select an option:
      Select 5 to Place an order,
      Select 99 to checkout order,
      Select 98 to see order history,
      Select 97 to see current order,
      Select 0 to cancel order`,
    sender: 'Afe'
  }));

  ws.on('message', message => {
    const clientData = clients.get(sessionId);
    handleClientMessage(ws, JSON.parse(message), clientData);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Function to handle WebSocket messages
const handleClientMessage = (ws, message, clientData) => {
  switch (message.content) {
    case '5':
      ws.send(JSON.stringify({
        content: `Select items to order:
          1. Burger - ₦1000
          2. Pizza - ₦1200
          3. Salad - ₦1500
          4. Coke - ₦500
          Type the item number to add to your order.`,
        sender: 'Afe'
      }));
      break;
    case '99':
      if (clientData.currentOrder.length > 0) {
        clientData.orderHistory.push([...clientData.currentOrder]);
        clientData.currentOrder = [];
        ws.send(JSON.stringify({
          content: 'Order placed. Thank you! Would you like to place a new order? Select 5 to start.',
          sender: 'Afe'
        }));
      } else {
        ws.send(JSON.stringify({
          content: 'No order to place. Would you like to place a new order? Select 5 to start.',
          sender: 'Afe'
        }));
      }
      break;
    case '98':
      if (clientData.orderHistory.length > 0) {
        const history = clientData.orderHistory.map((order, index) => `Order ${index + 1}: ${order.join(', ')}`).join('\n');
        ws.send(JSON.stringify({
          content: `Order History:\n${history}`,
          sender: 'Afe'
        }));
      } else {
        ws.send(JSON.stringify({
          content: 'No order history.',
          sender: 'Afe'
        }));
      }
      break;
    case '97':
      if (clientData.currentOrder.length > 0) {
        ws.send(JSON.stringify({
          content: `Current Order: ${clientData.currentOrder.join(', ')}`,
          sender: 'Afe'
        }));
      } else {
        ws.send(JSON.stringify({
          content: 'No current order.',
          sender: 'Afe'
        }));
      }
      break;
    case '0':
      if (clientData.currentOrder.length > 0) {
        clientData.currentOrder = [];
        ws.send(JSON.stringify({
          content: 'Order canceled.',
          sender: 'Afe'
        }));
      } else {
        ws.send(JSON.stringify({
          content: 'No order to cancel.',
          sender: 'Afe'
        }));
      }
      break;
    default:
      if (/^[1-4]$/.test(message.content)) {
        const items = ['Burger', 'Pizza', 'Salad', 'Coke'];
        clientData.currentOrder.push(items[parseInt(message.content) - 1]);
        ws.send(JSON.stringify({
          content: `${items[parseInt(message.content) - 1]} added to your order. Add more items or select 99 to checkout.`,
          sender: 'Afe'
        }));
      } else {
        ws.send(JSON.stringify({
          content: 'Invalid option. Please try again.',
          sender: 'Afe'
        }));
      }
      break;
  }
};

const PORT = process.env.PORT || 7000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
