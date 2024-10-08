import PropTypes from "prop-types";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import React from "react";

const api = axios.create({
  baseURL: "http://localhost:8000",
});


function ChatTab({ content,
   description, 
   loadChatData,
   chatDescription, setChatDescription, 
   chatHistory, setChatHistory,
   sessionId, setSessionId, setIsStartNewSession, clearChatPanel, initPage,
   logChatData }) {
  const [showOptions, setShowOptions] = useState(false);
  const [isEditable, setIsEditable] = useState(false); // State to manage edit mode
  const [localDescription, setLocalDescription] = useState(description); // Local state for description
  const textareaRef = useRef(null); // Ref to focus the textarea

  const handleRenameClick = () => {
    setIsEditable(true);
    setTimeout(() => {
      textareaRef.current.focus();
    }, 0);
  };
  
  const handleDelete = async () => {
    console.log("Deleting chat history for:", content.slice(13));
    try {  
      // Delete the chat history table
      await api.post("/database/generalUpdate", {
        query: "DROP TABLE IF EXISTS ?",
        params: [content],
      });

      // Delete the session record
      await api.post("/database/generalUpdate", {
        query: "DELETE FROM sessions WHERE session_id = ?",
        params: [content.slice(13)],
      });

      // Delete the chat folder
      await api.post("/file/deleteChatData", {
        chat_folder_name: content.slice(13),
      });

      if (content.slice(13) === sessionId) {
        setSessionId("");
        setIsStartNewSession(true);
        clearChatPanel();
      }
      
      initPage();
      console.log("Chat history deleted successfully");
    }
    catch (error) {
      console.error("Error deleting chat history:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      // Optionally, show an error message to the user
      alert("Failed to delete chat history. Please try again.");
    }
  };

  const handleClick = async () => {
    if (isEditable){
      return;
    }
    try {
      console.log(content.slice(13));
      const response = await api.post("/history/getChatHistoryBySession", {
        // remove the "chat_history_" to get the session id
        message: content.slice(13),
      });
      console.log(response)
      // update the current session id
      await api.post("/settings/updateSettings", {key: "CURRENT_SESSION_ID", value: content.slice(13)});
      // conten.slice(13) is for set the session id for main page
      loadChatData(response.data.chat_content, content.slice(13));


    } catch (error) {
      console.error("Error fetching chat history:", error);
      // Optionally, handle the error (e.g., show an error message to the user)
    }
  };

  const handleHoverOn = (e) => {
    e.stopPropagation();
    setShowOptions(true);
  };

  const handleHoverOff = (e) => {
    setShowOptions(false);
  };

  // Add event listener to detect clicks outside the textarea
  useEffect(() => {
    const handleClickOutside = async(event) => {
      if (textareaRef.current && !textareaRef.current.contains(event.target)) {
        setIsEditable(false);
        await api.post("/database/generalUpdate", {
          query: "UPDATE sessions SET description = ? WHERE session_id = ?",
          params: [textareaRef.current.value ,content.slice(13)],
        });
      }
    };

    if (isEditable) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditable]);

  return (
    <div
      className={`bg-neutral-700 rounded-2xl mx-1 my-1 max-w-[98%] min-w-[40%] w-auto hover:bg-neutral-600 cursor-pointer flex flex-row group`}
      onClick={handleClick}
      onMouseLeave={handleHoverOff}
    >
      <p className=" px-2 py-1 text-white font-normal text-sm font-sans break-words">
        <textarea
          ref={textareaRef}
          className={`mr-auto px-2 py-1 text-white font-normal text-sm font-sans break-words bg-transparent border-none resize-none overflow-hidden ${isEditable ? '' : 'pointer-events-none'}`}
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          readOnly={!isEditable} // Set readOnly based on isEditable state
          //rows={description.split('\n').length} // Adjust height to fit content
        />
      </p>
      <p className="px-2 ml-auto text-white font-normal text-lg font-sans h-fit self-center opacity-0 group-hover:opacity-100  hover:bg-neutral-500 hover:rounded-md transition-opacity duration-300"
        onClick={handleHoverOn}
        //onMouseLeave={handleHoverOff}
      >
        ...
        {showOptions && (
          <div
            className="absolute  bg-white text-black rounded-md shadow-lg p-2 z-10"
            //onMouseOver={handleHoverOn}
            //onMouseLeave={handleHoverOff}
          >
            <p className="cursor-pointer hover:bg-gray-200 p-1"
              onClick={handleDelete}>
              &#128465; Delete
            </p>
            <p className="cursor-pointer hover:bg-gray-200 p-1"
              onClick={handleRenameClick}>
              &#128396; Rename
            </p>
          </div>
        )}
      </p>
    </div>
  );
}

ChatTab.propTypes = {
  content: PropTypes.string.isRequired,
};

export default ChatTab;
