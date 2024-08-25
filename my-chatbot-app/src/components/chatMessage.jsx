import PropTypes from "prop-types";
import chatProfilePic from "../assets/chatbot_pic.png";
import userProfilePic from "../assets/user_pic.png";

function ChatMessage(props) {
  const { content, role } = props.message;
  return (
    <div
      className={`flex flex-col gap-1 size-auto bg-slate-800 text-white rounded-xl max-w-screen-md w-auto my-3 mx-1.5 ${
        role === "user" ? "self-start" : "self-end"
      } `}
    >
      <div
        className={`pt-2 pl-2 flex pr-2 ${
          role === "user" ? "self-start" : "self-end"
        }`}
      >
        <img
          className="w-7 h-7 min-h-7 max-w-7 rounded-[50%] "
          src={role === "user" ? userProfilePic : chatProfilePic}
          alt=""
        />
        <span className="ml-2 font-sans font-bold">{role}</span>
      </div>
      <p className="pt-1 pb-4 pl-3 pr-3 break-words">{content}</p>
    </div>
  );
}

ChatMessage.propTypes = {
  message: PropTypes.shape({
    content: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
};

export default ChatMessage;
