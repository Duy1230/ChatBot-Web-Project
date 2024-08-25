import PropTypes from "prop-types";
import React from "react";
import chatProfilePic from "../assets/chatbot_pic.png";
import userProfilePic from "../assets/user_pic.png";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function ChatMessage(props) {
  const { content, role } = props.message;

  return (
    <div
      className={`flex flex-col gap-1 bg-slate-800 text-white rounded-xl max-w-screen-md w-auto my-3 mx-1.5 ${
        role === "user" ? "self-start" : "self-end"
      }`}
    >
      <div
        className={`pt-2 pl-2 flex items-center pr-2 ${
          role === "user" ? "self-start" : "self-end"
        }`}
      >
        <img
          className="w-7 h-7 rounded-full"
          src={role === "user" ? userProfilePic : chatProfilePic}
          alt=""
        />
        <span className="ml-2 font-sans font-bold">{role}</span>
      </div>
      <div className="pt-1 pb-4 pl-3 pr-3 break-words">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
            table({ children, ...props }) {
              return (
                <div className="overflow-auto">
                  <table
                    className="table-auto border-collapse w-full text-left bg-slate-900 text-white"
                    {...props}
                  >
                    {children}
                  </table>
                </div>
              );
            },
            th({ children, ...props }) {
              return (
                <th
                  className="border-b border-slate-700 px-4 py-2 text-sm font-medium text-gray-300"
                  {...props}
                >
                  {children}
                </th>
              );
            },
            td({ children, ...props }) {
              return (
                <td
                  className="border-b border-slate-700 px-4 py-2 text-sm text-gray-400"
                  {...props}
                >
                  {children}
                </td>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
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
