import ChatTab from "../components/chatTab";
import Input from "../components/input";
import NewChat from "../components/newChat";
import ChatMessage from "../components/chatMessage";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFilePdf } from '@fortawesome/free-solid-svg-icons';

const api = axios.create({
  baseURL: "http://localhost:8000",
});

function ChatPage() {
  const [sessionId, setSessionId] = useState("");
  const [isStartNewSession, setIsStartNewSession] = useState(true);
  const [messages, setMessages] = useState([]);
  //This contain all chats user has made to display as tabs,
  //for example "chat_history_55432778_4938_49fa_acfb_4fbd5d5c917a"
  const [chatHistory, setChatHistory] = useState([]);
  // This contain all description of chat history
  const [chatDescription, setChatDescription] = useState([]);
  // This is used to show loading when user send message
  const [isLoading, setIsLoading] = useState(false);
  // Add loading dots state and effect
  const [loadingDots, setLoadingDots] = useState('...');
  // This is used to show uploaded image, setUploadImage is an URL
  const [uploadedImage, setUploadedImage] = useState(null);
  // This is used to show uploaded pdf, setUploadPdf is an URL  
  const [uploadedPdf, setUploadedPdf] = useState(null);
  // This is used to get backend env
  const [backendEnv, setBackendEnv] = useState({});

  const chatPanelRef = useRef(null);

  // This function is used to load chat history from the backend
  const initPage = useCallback(async () => {
    try {
      const response = await api.post("/history/getChatHistory");
      const apiResponse = await api.get("/get_env/getEnvVar");
      setBackendEnv(apiResponse.data);
      console.log("API response:", apiResponse.data.value); // Log the API response
      console.log("Backend env:", backendEnv); // Log the backend env
      const updatedChatHistory = response.data.chat_history;
      const updatedChatDescription = response.data.chat_description;
    
    // Update both states together in one batch
      setChatHistory(() => {
      setChatDescription(updatedChatDescription);
      return updatedChatHistory;
    });
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  }, []);

  useEffect(() => {
    // reset session id
    api.post("/settings/updateSettings", {key: "CURRENT_SESSION_ID", value: ""});
    initPage();
  }, []);


  useEffect(() => {
    // Scroll to the bottom of the chat panel whenever messages change

    if (chatPanelRef.current) {
      chatPanelRef.current.scrollTop = chatPanelRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingDots(dots => dots.length > 3 ? '' : dots + '.');
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);


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
      { content: {content: response}, role: "chatbot" },
    ]);
  };

  //handle add history
  const handleAddHistory = (history) => {
    setChatHistory((prevHistory) => [...prevHistory, history]);
  };

  //load chat history when user click on chat tabs
  const handleLoadChatData = useCallback((chatData, sessionId) => {
    //set isStartNewSession to false because user is not start new chat
    setIsStartNewSession(false);
    //set sessionId to the sessionId that user click on
    setSessionId(sessionId);
    //load chat content when click on chat tab
    const mappedData = chatData.map(([role, content]) => ({ role, content }));
    setMessages(mappedData);
    console.log("Here is the mapped data: ");
    console.log(  mappedData);
  }, []);

  // Clear the text area after sending a message
  const clearTextArea = () => {
    document.querySelector("textarea").value = "";
  };

  // Clear chat panel for new chat session
  const clearChatPanel = useCallback(async () => {
    setMessages([]);
    setIsStartNewSession(true);
    await api.post("/settings/updateSettings", {key: "CURRENT_SESSION_ID", value: ""});
  }, []);

  useEffect(() => {
    // Scroll to the bottom of the chat panel whenever messages change
    if (chatPanelRef.current) {
      chatPanelRef.current.scrollTop = chatPanelRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingDots(dots => dots.length > 3 ? '' : dots + '.');
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleImageUpload = (imageDataUrl) => {
    setUploadedImage(imageDataUrl);
  };

  const handlePdfUpload = (pdfDataUrl) => {
    setUploadedPdf(pdfDataUrl);
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    // Reset the file input
    if (document.getElementById('file-input')) {
      document.getElementById('file-input').value = '';
    }
  };

  const handleClearPdf = () => {
    setUploadedPdf(null);
    // Reset the file input
    if (document.getElementById('file-input')) {
      document.getElementById('file-input').value = '';
    }
  };

  return (
    <div className="flex h-screen ">
      <div className="basis-1/5 min-w-64 bg-slate-400 overflow-scroll custom-scrollbar overflow-x-hidden">
        <NewChat clearPanel={clearChatPanel} />
        {chatHistory.map((history, index) => (
          <ChatTab
            key={`${history}-${index}`} // Use a more unique key
            content={history}
            description={chatDescription[index]}
            chatDescription={chatDescription}
            loadChatData={handleLoadChatData}
            setChatDescription={setChatDescription}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            sessionId={sessionId}
            setSessionId={setSessionId}
            clearChatPanel={clearChatPanel}
            setIsStartNewSession={setIsStartNewSession}
            initPage={initPage}
          />
        ))}
        {/* {console.log("Here is the chat history: ")}
        {console.log(chatHistory)} */}
      </div>
      <div className="flex flex-col basis-4/5 bg-slate-500">
        <div
          id="chat-panel"
          className="flex flex-col overflow-scroll custom-scrollbar overflow-x-hidden"
          ref={chatPanelRef}
        >
          {messages.map((msg, index) => (
            <ChatMessage 
            key={index} 
            message={msg} 
            backendEnv={backendEnv}
            sessionId={sessionId}
            />
          ))}
          {isLoading && <ChatMessage message={{ content: {content: `Thinking${loadingDots}`}, role: "chatbot" }} id="loading"/>}
        </div>

        <div className="mt-auto bg-gray-700 flex flex-col relative">
          {uploadedImage && (
            <div className="absolute bottom-full left-0 p-2 bg-gray-800 rounded-t-lg flex items-center">
              <img src={uploadedImage} alt="Uploaded" className="max-w-xs max-h-32 object-contain" />
              <button 
                onClick={handleClearImage}
                className="ml-2 bg-gray-700 text-white rounded-full p-1 hover:bg-gray-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
          {uploadedPdf && (
            <div className="absolute bottom-full left-0 p-2 bg-gray-800 rounded-t-lg flex items-center">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faFilePdf} className="text-red-500 mr-2" size="2x" />
                <span className="text-white">{uploadedPdf}</span>
              </div>
              <button 
                onClick={handleClearPdf}
                className="ml-2 bg-gray-700 text-white rounded-full p-1 hover:bg-gray-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}
          <Input
            onSendMessage={handleSendMessage}
            onReceiveResponse={handleReceiveResponse}
            onImageUpload={handleImageUpload}
            onPdfUpload={handlePdfUpload}
            onClearImage={handleClearImage}
            onClearPdf={handleClearPdf}
            isStartNewSession={isStartNewSession}
            setIsStartNewSession={setIsStartNewSession}
            sessionId={sessionId}
            updateSessionId={setSessionId}
            chatDescription={chatDescription}
            setChatDescription={setChatDescription}
            setChatHistory={setChatHistory}
            initPage={initPage}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
