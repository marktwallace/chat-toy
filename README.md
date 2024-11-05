# chat-toy
Toy chat system with a Node.js server and React client to try out WebRTC

## Run locally

cd server
node server.js

### Test with:

curl -X GET http://localhost:6784/servers -H "Authorization: Bearer your-client-secret"


## Initial setup on fly

flyctl launch

256 MB plan is enough for this.

## Set up secrets

Get some entropy for the secret with:

head -c 15 /dev/urandom | base64

Locally, have:

export CHAT_TOY_CLIENT_SECRET=your-client-secret

Set up a fly.io secret:

flyctl secrets set CHAT_TOY_CLIENT_SECRET="$CHAT_TOY_CLIENT_SECRET"

## Deploy

flyctl deploy

### Test with curl
```
% curl -X GET https://chat-toy.fly.dev/servers -H "Authorization: Bearer $CHAT_TOY_CLIENT_SECRET"
{}

% curl -H "Authorization: Bearer $CHAT_TOY_CLIENT_SECRET" -H "Content-Type: application/json" -X POST -d '{"name": "test"}' https://chat-toy.fly.dev/server
{"serverID":"870543f1-afc1-438a-9cf4-1057d67ca5dc","name":"test","channels":[]}

% curl -X GET https://chat-toy.fly.dev/servers -H "Authorization: Bearer $CHAT_TOY_CLIENT_SECRET"
{"870543f1-afc1-438a-9cf4-1057d67ca5dc":{"serverID":"870543f1-afc1-438a-9cf4-1057d67ca5dc","name":"test","channels":[]}}
```