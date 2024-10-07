import arrowImage from "../assets/right-arrow.png";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperclip } from '@fortawesome/free-solid-svg-icons'

const api = axios.create({
  baseURL: "http://localhost:8000",
});

function Input({
  onSendMessage,
  onReceiveResponse,
  isStartNewSession,
  setIsStartNewSession,
  sessionId,
  updateSessionId,
  chatDescription,
  setChatDescription,
  setChatHistory,
  isLoading,
  setIsLoading,
  initPage,
  onImageUpload,
  onClearImage,
  onPdfUpload,
  onClearPdf,
  setIsFileLoading
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    // check if the file is an image
    if (file.type.startsWith("image/")) {
      setSelectedImage(file.name);
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          onImageUpload(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    } else if (file.type === "application/pdf") {
      setSelectedPdf(file.name);
      onPdfUpload(file.name);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClearImage();
  };

  const handleClearPdf = () => {
    setSelectedPdf(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClearPdf();
  };

  const [message, setMessages] = useState("");
  const [response, setResponse] = useState("");

  const textareaRef = useRef(null);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea && textarea.scrollHeight < 100) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const textarea = document.querySelector("#textarea");

    if (textarea.value.trim() === "") {
      setMessages("");
      return;
    }

    try {
      if (isStartNewSession) {
        await handleNewSession();
      } else {
        await handleExistingSession();
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    console.log("Start new session");
    if (message.trim() !== "") {
      console.log("New session message: ", message);
      
      // Start a new session
      const { data: newSessionData } = await api.post("/session/startNewSession");
      const newSessionId = newSessionData.session_id;

      // Update session ID and settings
      await updateSession(newSessionId);

      // Clear textarea
      clearTextarea();

      // Store user message
      await storeUserMessage(newSessionId);

      onClearPdf(false)
      onClearImage(false)
      setIsFileLoading(true)

      // Upload files if any
      if (selectedImage || selectedPdf) {
        await uploadFiles(newSessionId);
      }

      // Display user message and start loading
      onSendMessage(buildMessagePayload());
      setIsLoading(true);

      // Clear selected files
      handleClearImage();
      handleClearPdf();
      setIsFileLoading(false)

      // Load chat content and get AI response
      const chatResponse = await processChat(newSessionId);

      // Display AI response
      onReceiveResponse(chatResponse);
      setResponse(chatResponse);
      setIsStartNewSession(false);

      // Generate and update chat description
      await generateChatDescription(newSessionId);

      // Reload chat interface
      initPage();

      setMessages("");
    }
  };

  const handleExistingSession = async () => {
    if (message.trim() !== "") {
      // Clear textarea
      clearTextarea();

      // Store user message
      await storeUserMessage(sessionId);

      onClearPdf(false)
      onClearImage(false)
      setIsFileLoading(true)

      // Upload files if any
      if (selectedImage || selectedPdf) {
        await uploadFiles(sessionId);
      }

      // Display user message and start loading
      onSendMessage(buildMessagePayload());
      setIsLoading(true);

      // Clear selected files
      handleClearImage();
      handleClearPdf();
      setIsFileLoading(false)
      // Load chat content and get AI response
      const chatResponse = await processChat(sessionId);

      // Display AI response
      onReceiveResponse(chatResponse);
      setResponse(chatResponse);
      setIsLoading(false);

      setMessages("");
    }
  };

  const updateSession = async (newSessionId) => {
    updateSessionId(newSessionId);
    await api.post("/settings/updateSettings", {
      key: "CURRENT_SESSION_ID",
      value: newSessionId,
    });
    console.log("New session id:", newSessionId);
  };

  const storeUserMessage = async (currentSessionId) => {
    await api.post("/session/storeMessageInSession", {
      session_id: currentSessionId,
      content: {
        "content": message,
        "image": selectedImage || "",
        "pdf": selectedPdf || ""
      },
      role: "user",
    });
  };



  const uploadFiles = async (currentSessionId) => {
    const formData = new FormData();
    formData.append("chat_folder_name", currentSessionId);
    formData.append("data_path", fileInputRef.current.files[0]);
    formData.append("file_type", fileInputRef.current.files[0].type);
    // console.log("File type: ", fileInputRef.current.files[0].type);
    // console.log("Data path: ", fileInputRef.current.files[0]);

    try {
      await axios.post("http://localhost:8000/file/writeChatData", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Successfully uploaded file");
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const buildMessagePayload = () => ({
    "content": message,
    "image": selectedImage || "",
    "pdf": selectedPdf || ""
  });

  const processChat = async (currentSessionId) => {
    // Load chat content
    const { data: chatContentData } = await api.post("/history/getChatHistoryBySession", {
      message: currentSessionId,
    });

    // Get AI response
    const { data: chatResponseData } = await api.post("/chat/chat", {
      chat_content: chatContentData.chat_content,
      session_id: currentSessionId,
    });

    console.log(chatResponseData.message);

    // Stop loading
    setIsLoading(false);

    return chatResponseData.message;
  };

  const generateChatDescription = async (currentSessionId) => {
    // Reload chat content
    const { data: reloadChatContentData } = await api.post("/history/getChatHistoryBySession", {
      message: currentSessionId,
    });

    // Generate description
    const { data: descriptionData } = await api.post("/chat/generate_description", {
      chat_content: reloadChatContentData.chat_content,
      session_id: currentSessionId,
    });

    // Update database
    await api.post("/database/generalUpdate", {
      query: "UPDATE sessions SET description = ? WHERE session_id = ?",
      params: [descriptionData.message, currentSessionId],
    });

    // Update chat description in interface 
    initPage();
  };

  const clearTextarea = () => {
    const textarea = document.querySelector("#textarea");
    if (textarea) {
      textarea.value = "";
    }
  };

  return (
    <div className="mix-w-[300px] max-w-[95%] flex rounded-md bg-neutral-900 border-neutral-700 border-2 w-full m-3 h-fit">
      <input type="file" className="hidden" accept="image/*,.pdf" id="file-input" onChange={handleFileUpload} ref={fileInputRef} />
      <label htmlFor="file-input" className="flex items-center p-2 cursor-pointer bg-neutral-700 ">
        <FontAwesomeIcon icon={faPaperclip} style={{color: "#eeeeee"}} size="lg" />
      </label>
      <textarea
        ref={textareaRef}
        className="rounded-md font-sans bg-neutral-900 text-white
          w-full resize-none m-2 overflow-y-auto focus:outline-none"
        id="textarea"
        name="Text1"
        onChange={(e) => {
          setMessages(e.target.value);
          adjustTextareaHeight();
        }}
        onKeyDown={(e) => {
          if (e.shiftKey && e.key === "Enter") {
            return;
          } else if (e.key === "Enter") {
            handleSend(e);
          }
        }}
        placeholder="Type your message here..."
        rows={1}
      ></textarea>
      <button onClick={handleSend} className="pr-3 self-center" id="send-button">
        <img className="max-h-6 max-w-6" src={arrowImage} alt="" />
      </button>
    </div>
  );
}

export default Input;