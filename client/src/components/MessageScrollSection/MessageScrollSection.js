import React, { useEffect, useRef } from "react";

function MessageScrollSection({ messages }) {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
      <div ref={scrollRef} className="message-scroll-section">
          {messages.map((msg, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '5px' }}>{msg.userID}:</span>
                  <span>{msg.content}</span>
              </div>
          ))}
      </div>
  );  
}

export default MessageScrollSection;
