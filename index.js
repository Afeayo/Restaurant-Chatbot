const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json());

// Session configuration
app.use(session({
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

app.get('/', (req, res) => {
  if (!req.sessionID) {
    req.sessionID = uuidv4(); // Use req.sessionID instead of req.session.userId
  }
  res.render('index', { sessionId: req.sessionID });
});

// WebSocket server handling
const clients = new Map();

wss.on('connection', (ws, req) => {
  const sessionId = req.url.split('?sessionId=')[1];

  if (!clients.has(sessionId)) {
    clients.set(sessionId, {
      currentOrder: [],
      orderHistory: []
    });
  }

  ws.send(`Welcome! Please select an option:
    Select 5 to Place an order,
    Select 99 to checkout order,
    Select 98 to see order history,
    Select 97 to see current order,
    Select 0 to cancel order`);

  ws.on('message', message => {
    const clientData = clients.get(sessionId);
    handleClientMessage(ws, message.toString(), clientData);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Function to handle WebSocket messages
const handleClientMessage = (ws, message, clientData) => {
  switch (message) {
    case '5':
      ws.send(`Select items to order:
        1. Burger - ₦1000
        2. Pizza - ₦1200
        3. Salad - ₦1500
        4. Coke - ₦500
        Type the item number to add to your order.`);
      break;
    case '99':
      if (clientData.currentOrder.length > 0) {
        clientData.orderHistory.push([...clientData.currentOrder]);
        clientData.currentOrder = [];
        ws.send('Order placed. Thank you! Would you like to place a new order? Select 5 to start.');
      } else {
        ws.send('No order to place. Would you like to place a new order? Select 5 to start.');
      }
      break;
    case '98':
      if (clientData.orderHistory.length > 0) {
        const history = clientData.orderHistory.map((order, index) => `Order ${index + 1}: ${order.join(', ')}`).join('\n');
        ws.send(`Order History:\n${history}`);
      } else {
        ws.send('No order history.');
      }
      break;
    case '97':
      if (clientData.currentOrder.length > 0) {
        ws.send(`Current Order: ${clientData.currentOrder.join(', ')}`);
      } else {
        ws.send('No current order.');
      }
      break;
    case '0':
      if (clientData.currentOrder.length > 0) {
        clientData.currentOrder = [];
        ws.send('Order canceled.');
      } else {
        ws.send('No order to cancel.');
      }
      break;
    default:
      if (/^[1-4]$/.test(message)) {
        const items = ['Burger', 'Pizza', 'Salad', 'Coke'];
        clientData.currentOrder.push(items[parseInt(message) - 1]);
        ws.send(`${items[parseInt(message) - 1]} added to your order. Add more items or select 99 to checkout.`);
      } else {
        ws.send('Invalid option. Please try again.');
      }
      break;
  }
};

const PORT = process.env.PORT || 7000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
