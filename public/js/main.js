document.addEventListener('DOMContentLoaded', function () {
  const chatButton = document.getElementById('chatButton');
  const chatBox = document.getElementById('chatBox');
  const usernameForm = document.getElementById('usernameForm');
  const chatContainer = document.getElementById('chatContainer');
  const usernameInput = document.getElementById('usernameInput');
  const signInButton = document.getElementById('signInButton');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const messages = document.getElementById('messages');
  let socket;

  chatButton.addEventListener('click', () => {
    chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
  });

  signInButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
      fetch('/set-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      }).then(response => {
        if (response.ok) {
          usernameForm.style.display = 'none';
          chatContainer.style.display = 'block';
          initializeWebSocket(username);
        } else {
          alert('Error signing in. Please try again.');
        }
      });
    }
  });

  function initializeWebSocket(username) {
    socket = new WebSocket(`ws://${window.location.host}?sessionId=${username}`);
    
    socket.addEventListener('open', function () {
      console.log('Connected to the WebSocket server');
    });

    socket.addEventListener('message', function (event) {
      const message = JSON.parse(event.data);
      displayMessage(message, 'received');
    });

    socket.addEventListener('close', function () {
      console.log('Disconnected from the WebSocket server');
    });

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function (event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });
  }

  function sendMessage() {
    const message = messageInput.value.trim();
    if (message && socket && socket.readyState === WebSocket.OPEN) {
      const messageObject = {
        content: message,
        sender: 'User'
      };
      socket.send(JSON.stringify(messageObject));
      displayMessage(messageObject, 'sent');
      messageInput.value = '';
    }
  }

  function displayMessage(message, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'content';
    contentElement.textContent = message.content;

    messageElement.appendChild(contentElement);

    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
  }
});
