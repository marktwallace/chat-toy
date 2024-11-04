/*
Run with:

node test.js --url=http://localhost:6784 --message="Hello from client 1" --resend

*/

const WebSocket = require('ws');

const url = process.argv.find(arg => arg.startsWith('--url=')).split('=')[1];
const resend = process.argv.includes('--resend');
const messageContent = process.argv.find(arg => arg.startsWith('--message='))?.split('=')[1] || "Testing, 1, 2, 3...";
const CLIENT_SECRET = 'your-client-secret';

const headers = {
  'Authorization': `Bearer ${CLIENT_SECRET}`,
  'Content-Type': 'application/json'
};

let serverID, channelID;

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
    // Step 1: Find or create the server
    const servers = await makeRequest('/servers', 'GET');
    const server_arr = Object.values(servers);
    console.log(server_arr);
    let server = server_arr.find(s => s.name === 'test');
    if (!server) {
      server = await makeRequest('/server', 'POST', {
        name: 'test',
        description: 'Test Server'
      });
      console.log(`Created server with ID: ${server.serverID}`);
    } else {
      console.log(`Found existing server with ID: ${server.serverID}`);
    }
    serverID = server.serverID;

    // Step 2: Find or create the channel in the server
    const channels = await makeRequest(`/server/${serverID}/channels`, 'GET');
    let channel = channels.find(c => c.name === 'test');
    if (!channel) {
      channel = await makeRequest(`/server/${serverID}/channel`, 'POST', {
        name: 'test',
        description: 'Test Channel'
      });
      console.log(`Created channel with ID: ${channel.channelID}`);
    } else {
      console.log(`Found existing channel with ID: ${channel.channelID}`);
    }
    channelID = channel.channelID;

    // Step 3: Send a message to the channel
    const sendMessage = async () => {
      const messageData = await makeRequest(`/channel/${channelID}/message`, 'POST', {
        userID: 'testUser',
        content: messageContent
      });
      console.log(`Sent message: ${messageData.content}`);
    };

    await sendMessage();

    // Step 4: Optionally resend the message every 10 seconds
    if (resend) {
      setInterval(async () => {
        await sendMessage();
      }, 10000);
    }

    // Step 5: Connect to WebSocket for async notifications
    const ws = new WebSocket(`${url.replace(/^http/, 'ws')}`);

    ws.on('open', () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ action: 'subscribe', channelID }));
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
