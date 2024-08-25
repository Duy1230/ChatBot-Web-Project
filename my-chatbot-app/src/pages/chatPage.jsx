import ChatTab from "../components/chatTab";
import Input from "../components/input";
import ChatMessage from "../components/chatMessage";
import React, { useState } from "react";

function ChatPage() {
  const [messages, setMessages] = useState([
    { content: "hello", role: "user" },
    {
      content:
        "lorem ipsum dolor sit amet consectetur adipiscing elit iguerhgrieugheiugheigheeighee lorem ipsum dolor sit amet consectetur adipiscing elit iguerhgrieugheiugheigheeighee",
      role: "chatbot",
    },
  ]);

  const handleSendMessage = (newMessageContent) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { content: newMessageContent, role: "user" },
      { content: sample, role: "chatbot" },
    ]);

    clearTextArea();
  };

  const clearTextArea = () => {
    document.querySelector("textarea").value = "";
  };

  const sample =
    "lorem ipsum dolor sit amet consectetur adipiscing elit iguerhgrieugheiugheigheeighee lorem ipsum dolor sit amet consectetur adipiscing elit iguerhgrieugheiugheigheeighee";
  return (
    <div className="flex h-screen ">
      <div className="basis-1/4 bg-slate-400 overflow-scroll custom-scrollbar overflow-x-hidden">
        <ChatTab content="hello" />
        <ChatTab content="hello" />
        <ChatTab content="hello" />
        <ChatTab content="hello" />
        <ChatTab content="hello" />
      </div>
      <div className="flex flex-col basis-3/4 bg-slate-500">
        <div className="flex flex-col overflow-scroll custom-scrollbar overflow-x-hidden">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
        </div>

        <div className="mt-auto bg-gray-700">
          <Input onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
