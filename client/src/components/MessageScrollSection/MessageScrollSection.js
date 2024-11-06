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
                <div key={index} >
                    <pre style={{ margin: 0 }}>{msg.content}</pre>
                </div>
            ))}
        </div>
    );
}

export default MessageScrollSection;
