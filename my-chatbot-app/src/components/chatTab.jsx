import PropTypes from "prop-types";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

function ChatTab({ content, loadChatData }) {
  const handleClick = async () => {
    try {
      console.log(content.slice(13));
      const response = await api.post("/history/getChatHistoryBySession", {
        message: content.slice(13),
      });

      loadChatData(response.data.chat_content, content.slice(13));
      console.log(response.data.message);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      // Optionally, handle the error (e.g., show an error message to the user)
    }
  };
  return (
    <div
      className={`bg-slate-700 rounded-2xl mx-1 my-1 max-w-[300px] min-w-[150px] w-auto hover:bg-slate-600 cursor-pointer`}
      onClick={handleClick}
    >
      <p className="px-2 py-1 text-white font-normal text-sm font-sans break-words">
        {content}
      </p>
    </div>
  );
}

ChatTab.propTypes = {
  content: PropTypes.string.isRequired,
};

export default ChatTab;
