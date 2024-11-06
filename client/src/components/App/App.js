import ChatMain from "../ChatMain/ChatMain";

function App() {
  return (
    <div className="wrapper">
      <ChatMain serviceUrl="https://chat-toy.fly.dev" server="test" channel="test" />
    </div>
  );
}

export default App;
