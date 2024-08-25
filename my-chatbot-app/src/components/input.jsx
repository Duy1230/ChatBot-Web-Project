import arrowImage from "../assets/right-arrow.png";
import React, { useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

function Input({ onSendMessage, onReceiveResponse }) {
  const [isFocused, setIsFocused] = useState(false);
  const [message, setMessages] = useState("");
  const [response, setResponse] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    if (message.trim() !== "") {
      onSendMessage(message);
      const chat_response = await api.post("/chat", {
        message: message,
      });
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
