import arrowImage from "../assets/right-arrow.png";
import React, { useState } from "react";

function Input({ onSendMessage }) {
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState("");
  const handleSend = () => {
    if (text.trim() !== "") {
      onSendMessage(text);
      setText("");
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
        onChange={(e) => setText(e.target.value)}
      ></textarea>
      <button onClick={handleSend} className="pr-3" id="send-button">
        <img className="max-h-6 max-w-6" src={arrowImage} alt="" />
      </button>
    </div>
  );
}

export default Input;
