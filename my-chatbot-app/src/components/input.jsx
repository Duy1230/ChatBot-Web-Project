import arrowImage from "../assets/right-arrow.png";
import React, { useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

function Input({
  onSendMessage,
  onReceiveResponse,
  isStartNewSession,
  setIsStartNewSession,
  updateSessionId,
  sessionId,
  initPage,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [message, setMessages] = useState("");
  const [response, setResponse] = useState("");

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
        // Start a new session
        const newSessionId = await api.post("/session/startNewSession");
        // display user message
        onSendMessage(message);
        initPage();

        await api.post("/session/storeMessageInSession", {
          session_id: newSessionId.data.session_id,
          content: message, // Dynamic value
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

        // display AI response
        onReceiveResponse(chat_response.data.message);

        // update session id
        updateSessionId(newSessionId.data.session_id);
        setIsStartNewSession(false);
        setResponse(chat_response.data.message);
        setMessages("");
      }
      return;
    }

    // Send the message include user message and AI response
    if (message.trim() !== "") {
      // display user message
      onSendMessage(message);
      // save user message to session
      await api.post("/session/storeMessageInSession", {
        session_id: sessionId,
        content: message, // Corrected key here
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
    }
  };

  return (
    <div className="mix-w-[300px] max-w-[95%] flex rounded-xl bg-gray-800 border-gray-100 border-2  w-full m-3">
      <textarea
        className={`rounded-xl font-sans bg-gray-800 text-white w-full resize-none m-2 ${
          isFocused ? "h-28" : "h-10"
        }`}
        id="textarea"
        name="Text1"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => setMessages(e.target.value)}
      ></textarea>
      <button onClick={handleSend} className="pr-3" id="send-button">
        <img className="max-h-6 max-w-6" src={arrowImage} alt="" />
      </button>
    </div>
  );
}

export default Input;
