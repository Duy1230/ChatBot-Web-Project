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
  onClearImage
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        onImageUpload(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // const handleClearImage = () => {
  //   setSelectedImage(null);
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = '';
  //   }
  //   onClearImage();
  // };

  const [message, setMessages] = useState("");
  const [response, setResponse] = useState("");
  const [file, setFile] = useState(null);

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
    // Check if the textarea is empty
    if (textarea.value.trim() === "") {
      setMessages("");
      return;
    }

    if (isStartNewSession) {
      console.log("Start new session");
      if (message.trim() !== "") {
        console.log("New session message: ", message);
        // Start a new session
        const newSessionId = await api.post("/session/startNewSession");

        // display user message
        onSendMessage({
          "content": message,
          "image": selectedImage ? selectedImage : ""
        });
        setIsLoading(true);

        //clear the textarea
        textarea.value = "";
        //initPage();

        // store user message to session
        await api.post("/session/storeMessageInSession", {
          session_id: newSessionId.data.session_id,
          // check if there is an image and input a json
          content: {
            "content": message,
            "image": selectedImage ? selectedImage : ""
          },
          role: "user",
        });   

        // load chat content
        const chatContent = await api.post("/history/getChatHistoryBySession", {
          message: newSessionId.data.session_id,
        });

        // get answer and add that answer ro database
        const chat_response = await api.post("/chat/chat", {
          chat_content: chatContent.data.chat_content,
          session_id: newSessionId.data.session_id,
        });

        console.log(chat_response.data.message);
        // stop loading
        setIsLoading(false);
        // display AI response
        onReceiveResponse(chat_response.data.message);
        // update session id
        updateSessionId(newSessionId.data.session_id);
        console.log("New session id: ", newSessionId.data.session_id);
        setIsStartNewSession(false);
        setResponse(chat_response.data.message);

        setMessages("");

        // This section is for generating a chat description
        // reload chat content
        const reloadChatContent = await api.post("/history/getChatHistoryBySession", {
          message: newSessionId.data.session_id,
        });
        //generate description
        const description = await api.post("/chat/generate_description", {
          chat_content: reloadChatContent.data.chat_content,
          session_id: newSessionId.data.session_id,
        });

        // update database
        await api.post("/database/generalUpdate", {
          query: "UPDATE sessions SET description = ? WHERE session_id = ?",
          params: [description.data.message, newSessionId.data.session_id],
        });

        // update chat description in interface 
        initPage();

      }
      return;
    }

    // Send the message include user message and AI response
    if (message.trim() !== "") {
      // display user message
      onSendMessage({
        "content": message,
        "image": selectedImage ? selectedImage : ""
      });
      // start loading
      setIsLoading(true);
      // clear the textarea
      textarea.value = "";

      // save user message to session
      await api.post("/session/storeMessageInSession", {
        session_id: sessionId,
        content: {
          "content": message,
          "image": selectedImage ? selectedImage : ""
        },
        role: "user",
      });
      

      //load chat content
      const chatContent = await api.post("/history/getChatHistoryBySession", {
        message: sessionId,
      });

      // get answer from chat model and add that answer to database
      const chat_response = await api.post("/chat/chat", {
        chat_content: chatContent.data.chat_content,
        session_id: sessionId,
      });

      // display AI response
      onReceiveResponse(chat_response.data.message);
      setResponse(chat_response.data.message);
      setMessages("");
      // stop loading
      setIsLoading(false);
    
      
    }
  };

  return (
    <div className="mix-w-[300px] max-w-[95%] flex rounded-xl bg-gray-800 border-gray-100 border-2 w-full m-3 h-fit">
      <input type="file" className="hidden" accept="image/*" id="file-input" onChange={handleImageUpload} ref={fileInputRef} />
      <label htmlFor="file-input" className="flex items-center p-2 cursor-pointer bg-gray-700 rounded-lg">
        <FontAwesomeIcon icon={faPaperclip} style={{color: "#eeeeee"}} size="lg" />
      </label>
      <textarea
        ref={textareaRef}
        className="rounded-xl font-sans bg-gray-800 text-white
         w-full resize-none m-2 overflow-y-auto focus:outline-none"
        id="textarea"
        name="Text1"
        onChange={(e) => {
          setMessages(e.target.value);
          adjustTextareaHeight();
        }}
        onKeyDown={(e) => {
          // check shift + enter
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
