const express = require("express");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = process.env.PORT || 6784; // ascii for CT (C=67,T=84)
const CLIENT_SECRET = process.env.CLIENT_SECRET || "your-client-secret";

const app = express();
app.use(bodyParser.json());

const wss = new WebSocket.Server({ noServer: true });

const servers = {};
const channels = {};
const messages = {};
const users = {};

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
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
curl -H "Authorization: Bearer your-client-secret" -H "Content-Type: application/json" -X POST -d '{"name": "test"}' http://localhost:6784/server
*/
app.post("/server", authenticate, (req, res) => {
  const { name, description } = req.body;

  const namePattern = /^[A-Za-z][A-Za-z0-9]*$/;
  if (!namePattern.test(name)) {
    return res.status(400).json({
      error: "Invalid name. It must start with a letter and be alphanumeric.",
    });
  }

  const serverID = uuidv4();
  servers[serverID] = { serverID, name, description, channels: [] };
  res.json(servers[serverID]);
});

/*
Test with:
curl -X GET http://localhost:6784/servers -H "Authorization: Bearer your-client-secret"
*/
app.get("/servers", authenticate, (req, res) => {
  res.json(servers);
});

app.post("/server/:serverID/channel", authenticate, (req, res) => {
  const { serverID } = req.params;
  if (!servers[serverID])
    return res.status(404).json({ error: "Server not found" });

  const { name, description } = req.body;
  const channelID = uuidv4();
  const channel = { channelID, name, description, messages: [], users: [] };
  channels[channelID] = channel;
  servers[serverID].channels.push(channel);
  res.json(channel);
});

app.get("/server/:serverID/channels", authenticate, (req, res) => {
  const { serverID } = req.params;
  if (!servers[serverID])
    return res.status(404).json({ error: "Server not found" });
  res.json(servers[serverID].channels);
});

app.get("/channel/:channelID/messages", authenticate, (req, res) => {
  const { channelID } = req.params;
  if (!channels[channelID])
    return res.status(404).json({ error: "Channel not found" });
  res.json(channels[channelID].messages);
});

app.post("/channel/:channelID/message", authenticate, (req, res) => {
  const { channelID } = req.params;
  if (!channels[channelID])
    return res.status(404).json({ error: "Channel not found" });

  const { userID, content } = req.body;
  const messageID = uuidv4();
  const timestamp = new Date().toISOString();
  const message = { messageID, userID, content, timestamp };
  channels[channelID].messages.push(message);

  // Broadcast message to subscribed clients
  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.subscribedChannel === channelID
    ) {
      client.send(JSON.stringify({ channelID, ...message }));
    }
  });

  res.json(message);
});

app.get("/channel/:channelID/users", authenticate, (req, res) => {
  const { channelID } = req.params;
  if (!channels[channelID])
    return res.status(404).json({ error: "Channel not found" });
  res.json(channels[channelID].users);
});

// WebSocket handling
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const { action, channelID } = JSON.parse(message);
      if (action === "subscribe" && channels[channelID]) {
        ws.subscribedChannel = channelID;
        ws.send(JSON.stringify({ status: "subscribed", channelID }));
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
