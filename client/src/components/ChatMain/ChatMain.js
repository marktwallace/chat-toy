import React, { useEffect, useState } from "react";
import MessageInput from "../MessageInput/MessageInput";
import MessageScrollSection from "../MessageScrollSection/MessageScrollSection";

function ChatMain({ serviceUrl, server, channel }) {
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);

  const clientSecret = process.env.CHAT_TOY_CLIENT_SECRET;

  useEffect(() => {
    // Connect to the WebSocket server
    const socket = new WebSocket(`${serviceUrl.replace(/^http/, 'ws')}/`);
    setWs(socket);

    socket.onopen = () => {
      console.log("Connected to WebSocket");
      // Subscribe to the channel
      socket.send(
        JSON.stringify({
          action: "subscribe",
          channelName: channel, // Use channelName instead of channelID to match server expectations
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Message received:", message);
        if (message.channelName === channel) { // Use channelName to match server expectations
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      } catch (error) {
        console.error("Invalid message received", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Cleanup on component unmount
    return () => {
      socket.close();
    };
  }, [serviceUrl, channel]);

  const handleSendMessage = async (content) => {
    if (!ws) {
      console.error("WebSocket not connected");
      return;
    }

    const messagePayload = {
      userID: "your-user-id", // You would replace this with the actual user ID
      content,
    };

    try {
      const response = await fetch(`${serviceUrl}/channel/${channel}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clientSecret}`,
        },
        body: JSON.stringify(messagePayload),
      });
      const data = await response.json();
      console.log("Message sent", data);
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  return (
    <main className="chat-main">
      <MessageScrollSection messages={messages} />
      <MessageInput onClick={(content) => handleSendMessage(content)} />
    </main>
  );
}

export default ChatMain;
