import React from "react";

function MessageInput({ onClick }) {
    const [input, setInput] = React.useState("");

    function handleSubmit(event) {
        event.preventDefault();
        onClick(input);
        setInput(""); // Clear the input after sending
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
        }
    }

    return (
        <form className="message-input" onSubmit={handleSubmit}>
            <input
                className="input-field"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown} // Listen for Enter key

            />
            <button type="submit" className="message-submit">Submit</button>
        </form>
    );
}

export default MessageInput;
