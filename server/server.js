const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

const PORT = process.env.PORT || 6784; // ascii for CT (C=67,T=84)
const CLIENT_SECRET = process.env.CHAT_TOY_CLIENT_SECRET || "your-client-secret";

const app = express();
app.use(bodyParser.json());

const wss = new WebSocket.Server({ noServer: true });

const channels = {};

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token === CLIENT_SECRET) return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

/*
curl -H "Authorization: Bearer your-client-secret" -H "Content-Type: application/json" -X POST -d '{"name": "test"}' http://localhost:6784/channel
*/
app.post("/channel", authenticate, (req, res) => {
  const { name, description } = req.body;

  const namePattern = /^[A-Za-z][A-Za-z0-9]*$/;
  if (!namePattern.test(name)) {
    return res.status(400).json({
      error: "Invalid name. It must start with a letter and be alphanumeric.",
    });
  }

  if (channels[name]) {
    return res.status(400).json({ error: "Channel already exists" });
  }

  channels[name] = { name, description, messages: [], users: [] };
  res.json(channels[name]);
});

/*
Test with:
curl -X GET http://localhost:6784/channels -H "Authorization: Bearer your-client-secret"
*/
app.get("/channels", authenticate, (req, res) => {
  res.json(Object.values(channels));
});

app.get("/channel/:channelName/messages", authenticate, (req, res) => {
  const { channelName } = req.params;
  if (!channels[channelName])
    return res.status(404).json({ error: "Channel not found" });
  res.json(channels[channelName].messages);
});

app.post("/channel/:channelName/message", authenticate, (req, res) => {
  const { channelName } = req.params;
  if (!channels[channelName])
    return res.status(404).json({ error: "Channel not found" });

  const { userID, content } = req.body;
  const timestamp = new Date().toISOString();
  const message = { userID, content, timestamp };
  channels[channelName].messages.push(message);

  // Broadcast message to subscribed clients
  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.subscribedChannel === channelName
    ) {
      client.send(JSON.stringify({ channelName, ...message }));
    }
  });

  res.json(message);
});

// WebSocket handling
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const { action, channelName } = JSON.parse(message);
      if (action === "subscribe" && channels[channelName]) {
        ws.subscribedChannel = channelName;
        ws.send(JSON.stringify({ status: "subscribed", channelName }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  });
});

// Upgrade HTTP server for WebSocket connections
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
