import ChatTab from "../components/chatTab";
import Input from "../components/input";
import NewChat from "../components/newChat";
import ChatMessage from "../components/chatMessage";
import WelcomeBanner from "../components/banner";
import Setting from "../components/setting";
import DocumentTab from "../components/documentTab";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFilePdf, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
// import setting icon
import { faCog } from '@fortawesome/free-solid-svg-icons';
import DocumentTabWithRef from "../components/documentTab";

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
  // This is to show if the file is loading
  const [isFileLoading, setIsFileLoading] = useState(false);
  // This is used to get backend env
  const [backendEnv, setBackendEnv] = useState({});
  // This us to used to show and hide setting
  const [showSetting, setShowSetting] = useState(false);

  // This is used to clear the selected image and pdf
  const [clearSelectedImage, setClearSelectedImage] = useState(false);
  const [clearSelectedPdf, setClearSelectedPdf] = useState(false);

  const chatPanelRef = useRef(null);

  // This is used to show/hide the sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // This is used to show/hide the document tab
  const [isDocumentTabOpen, setIsDocumentTabOpen] = useState(false);

  // This is used to fetch the pdfs from the backend
  const documentTabRef = useRef(null);
  const [pdfs, setPdfs] = useState([]);


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

  const handleClearDocumentTab = () => {
    documentTabRef.current?.clearData();
  };

  // Add the AI response to the chat panel
  const handleReceiveResponse = (response) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { content: {content: response}, role: "chatbot" },
    ]);
  };

  // Add the pdfs to the document tab
  const handleAddPdfs = (pdfs) => {
    setPdfs(pdfs);
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

  const handleClearImage = (resetFileInput = true) => {
    // stop showing the image in main page
    setUploadedImage(null);
    setClearSelectedImage(true);
    if (resetFileInput && document.getElementById('file-input')) {
      console.log("Clearing image", document.getElementById('file-input'));
      document.getElementById('file-input').value = "";
    }
    // Reset the clearSelectedImage flag after a short delay
    setTimeout(() => setClearSelectedImage(false), 100);
  };

  const handleClearPdf = (resetFileInput = true) => {
    setUploadedPdf(null);
    setClearSelectedPdf(true);
    // Reset the file inputy
    if (resetFileInput && document.getElementById('file-input')) {
      document.getElementById('file-input').value = '';
    }
    // Reset the clearSelectedPdf flag after a short delay
    setTimeout(() => setClearSelectedPdf(false), 100);
  };

  const handleDocRefClick = (refName) => {
    documentTabRef.current?.searchAndScrollToId(refName);
  };

  return (
    <div className="flex h-screen">
      <div className={`${isSidebarOpen ? 'basis-1/5 min-w-64' : 'w-0'} transition-all duration-300 bg-neutral-900 overflow-hidden border-r border-neutral-700 relative`}>
        <NewChat clearPanel={clearChatPanel} handleAddPdfs={handleAddPdfs} handleClearDocumentTab={handleClearDocumentTab}/>
        <button className="self-end border-b-2 border-neutral-700 text-white p-1 hover:bg-gray-600 transition-colors w-fit h-10 ml-2 rounded-md"
          onClick={() => setShowSetting(!showSetting)}>
          <div className="flex items-center justify-center">
            <FontAwesomeIcon icon={faCog} />
            <span className="text-sm ml-2">Settings</span>
          </div>
        </button>
        <div className="overflow-y-scroll mt-2 overflow-x-hidden custom-scrollbar max-h-[calc(100vh-10rem)] border-t border-neutral-700">
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
              handleAddPdfs={handleAddPdfs}
              handleClearDocumentTab={handleClearDocumentTab}
            />
          ))}
        </div>
        
      </div>
      

      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="transform bg-neutral-800 text-white p-2 hover:bg-neutral-700 transition-all duration-300 z-9 border-r border-neutral-600 w-6 h-auto" 
        style={{ left: isSidebarOpen ? 'calc(20% - 1px)' : '0' }}
      >
        <FontAwesomeIcon icon={isSidebarOpen ? faChevronLeft : faChevronRight} />
      </button>

      <div className={`flex flex-col ${isSidebarOpen ? 'basis-4/5' : 'flex-1'} bg-neutral-900`}>
        <div
          id="chat-panel"
          className="flex flex-col overflow-scroll custom-scrollbar overflow-x-hidden"
          ref={chatPanelRef}
        >
          {isStartNewSession && (
            <div className="mt-14">
              <WelcomeBanner />
            </div>
          )}
          {messages.map((msg, index) => (
            <ChatMessage 
            key={index} 
            message={msg} 
            backendEnv={backendEnv}
            sessionId={sessionId}
            onDocRefClick={handleDocRefClick}
            />
          ))}
          {isLoading && <ChatMessage message={{ content: {content: `Thinking${loadingDots}`}, role: "chatbot" }} id="loading"/>}
        </div>

        <div className="mt-auto bg-neutral-900 border-t border-neutral-700 flex flex-col relative">
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
          {isFileLoading && (
            <div className="absolute bottom-full left-0 rounded-t-lg flex items-center">
               <div class="px-3 py-1 text-sm font-medium leading-none text-center text-blue-800 bg-blue-200 rounded-full animate-pulse dark:bg-blue-900 dark:text-blue-200">Processing File...</div>
            </div>
          )}
          {showSetting && (
            <div 
              className="fixed inset-0 bg-neutral-900 bg-opacity-50 flex items-center justify-center"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowSetting(false);
                }
              }}
            >
              <div className="bg-neutral-800 p-6 rounded-lg">
                <Setting />
              </div>
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
            setIsFileLoading={setIsFileLoading}
            setIsLoading={setIsLoading}
            clearSelectedImage={clearSelectedImage}
            clearSelectedPdf={clearSelectedPdf}
            handleAddPdfs={handleAddPdfs}
          />
        </div>
      </div>

      <DocumentTab ref={documentTabRef} pdfs={pdfs}/>

    </div>
  );
}

export default ChatPage;
