import ChatTab from "../components/chatTab";
import Input from "../components/input";
import NewChat from "../components/newChat";
import ChatMessage from "../components/chatMessage";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

function ChatPage() {
  const [sessionId, setSessionId] = useState("");
  const [isStartNewSession, setIsStartNewSession] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const chatPanelRef = useRef(null);

  // This function is used to load chat history from the backend
  const initPage = async () => {
    try {
      const response = await api.post("/history/getChatHistory");
      setChatHistory(response.data.chat_history);
      console.log(response.data.chat_history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      // Optionally, handle the error (e.g., show an error message to the user)
    }
  };
  // Init page content
  useEffect(() => {
    initPage();
  }, []);

  // Add the user's message to the chat panel
  const handleSendMessage = (newMessageContent) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { content: newMessageContent, role: "user" },
    ]);

    clearTextArea();
  };

  // Add the AI response to the chat panel
  const handleReceiveResponse = (response) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { content: response, role: "chatbot" },
    ]);
  };

  //handle add history
  const handleAddHistory = (history) => {
    setChatHistory((prevHistory) => [...prevHistory, history]);
  };

  //load chat history when user click on chat tabs
  const handleLoadChatData = (chatData, sessionId) => {
    //set isStartNewSession to false because user is not start new chat
    setIsStartNewSession(false);
    //set sessionId to the sessionId that user click on
    setSessionId(sessionId);
    const mappedData = chatData.map(([role, content]) => ({ role, content }));
    setMessages(mappedData);
  };

  // Clear the text area after sending a message
  const clearTextArea = () => {
    document.querySelector("textarea").value = "";
  };

  // Clear chat panel for new chat session
  const clearChatPanel = () => {
    setMessages([]);
    setIsStartNewSession(true);
  };

  useEffect(() => {
    // Scroll to the bottom of the chat panel whenever messages change
    if (chatPanelRef.current) {
      chatPanelRef.current.scrollTop = chatPanelRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-screen ">
      <div className="basis-1/4 bg-slate-400 overflow-scroll custom-scrollbar overflow-x-hidden">
        <NewChat clearPanel={clearChatPanel} />
        {chatHistory.map((history, index) => (
          <ChatTab
            key={index}
            content={history}
            loadChatData={handleLoadChatData}
          />
        ))}
      </div>
      <div className="flex flex-col basis-3/4 bg-slate-500">
        <div
          id="chat-panel"
          className="flex flex-col overflow-scroll custom-scrollbar overflow-x-hidden"
          ref={chatPanelRef}
        >
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
        </div>

        <div className="mt-auto bg-gray-700">
          <Input
            onSendMessage={handleSendMessage}
            onReceiveResponse={handleReceiveResponse}
            isStartNewSession={isStartNewSession}
            setIsStartNewSession={setIsStartNewSession}
            updateSessionId={setSessionId}
            sessionId={sessionId}
            initPage={initPage}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
