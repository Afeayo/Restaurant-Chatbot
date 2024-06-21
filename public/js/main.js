document.addEventListener("DOMContentLoaded", () => {
  const chatbotButton = document.getElementById('chatbotButton');
  const chatBox = document.getElementById('chatBox');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const chatMessages = document.getElementById('chatMessages');
  const usernameInput = document.getElementById('usernameInput');
  const startChatButton = document.getElementById('startChatButton');
  const sessionId = '<%= sessionId %>'; 

  
  chatbotButton.addEventListener('click', () => {
  chatBox.classList.toggle('visible');
  });

  
  startChatButton.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
      const p = document.createElement('p');
      p.textContent = `You are welcome  ${username} kindly select an option`;
      chatMessages.appendChild(p);
      usernameInput.style.display = 'none';
      startChatButton.style.display = 'none';
      messageInput.style.display = 'block';
      sendButton.style.display = 'block';
    }
  });

  
  const ws = new WebSocket(`ws://localhost:7000/?sessionId=${sessionId}`);

  ws.onopen = () => {
    console.log('Connected to the WebSocket server');
  };

  ws.onmessage = (event) => {
    const p = document.createElement('p');
    p.textContent = `Bot: ${event.data}`;
    chatMessages.appendChild(p);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  ws.onclose = () => {
    console.log('Disconnected from the WebSocket server');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  
  sendButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
      const p = document.createElement('p');
      p.textContent = `You: ${message}`;
      chatMessages.appendChild(p);
      ws.send(message);
      messageInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });

  
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendButton.click();
    }
  });

  
  const mobileMenu = document.getElementById('mobile-menu');
  const navList = document.getElementById('nav-list');
  mobileMenu.addEventListener('click', () => {
    navList.classList.toggle('show');
  });
});
