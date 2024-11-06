/*
Run with:

node test.js --url=http://localhost:6784 --message="Hello from client 1" --resend

or

node test.js --url=https://chat-toy.fly.dev --message="Hello from client 1" --resend
*/

const WebSocket = require('ws');

const url = process.argv.find(arg => arg.startsWith('--url=')).split('=')[1];
const resend = process.argv.includes('--resend');
const messageContent = process.argv.find(arg => arg.startsWith('--message='))?.split('=')[1] || "Testing, 1, 2, 3...";
const CLIENT_SECRET = process.env.CHAT_TOY_CLIENT_SECRET;

const headers = {
  'Authorization': `Bearer ${CLIENT_SECRET}`,
  'Content-Type': 'application/json'
};

async function makeRequest(endpoint, method = 'GET', body) {
  const fullUrl = `${url.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
  console.log(`Making request: ${fullUrl}`);
  const response = await fetch(fullUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return await response.json();
}

async function runTestClient() {
  try {
    // Step 1: Find or create the channel
    const channels = await makeRequest('/channels', 'GET');
    let channel = channels.find(c => c.name === 'test');
    if (!channel) {
      channel = await makeRequest('/channel', 'POST', {
        name: 'test',
        description: 'Test Channel'
      });
      console.log(`Created channel with name: ${channel.name}`);
    } else {
      console.log(`Found existing channel with name: ${channel.name}`);
    }

    // Step 2: Send a message to the channel
    const sendMessage = async () => {
      const messageData = await makeRequest(`/channel/${channel.name}/message`, 'POST', {
        userID: 'testUser',
        content: messageContent
      });
      console.log(`Sent message: ${messageData.content}`);
    };

    await sendMessage();

    // Step 3: Optionally resend the message every 10 seconds
    if (resend) {
      setInterval(async () => {
        await sendMessage();
      }, 10000);
    }

    // Step 4: Connect to WebSocket for async notifications
    const ws = new WebSocket(`${url.replace(/^http/, 'ws')}`);

    ws.on('open', () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ action: 'subscribe', channelName: channel.name }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('New message received:', message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('error', (error) => console.error('WebSocket error:', error));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

runTestClient();
