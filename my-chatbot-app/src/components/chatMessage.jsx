import PropTypes from "prop-types";
import React, { useState } from "react";
import chatProfilePic from "../assets/chatbot_pic.png";
import userProfilePic from "../assets/user_pic.png";
import FileBlock from "./fileBlock";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from 'react-katex';
  
function ChatMessage(props) {
  function formatText(text) {
    return text.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  }

  const { content, role } = props.message;
  const backendEnv = props.backendEnv;
  const sessionId = props.sessionId;
  if (role === "system") {
    return <></>;
  }
  if (role === "user") {
    const imagePath = content.image ? `${backendEnv.API_URL}/file/image/${sessionId}/${encodeURIComponent(content.image)}` : null;
    const pdfPath = content.pdf ? `${backendEnv.API_URL}/file/pdf/${sessionId}/${encodeURIComponent(content.pdf)}` : null;
    console.log("Image path:", imagePath);
    return (
      <div
        className={`flex flex-col gap-1 bg-slate-800 text-white rounded-xl max-w-screen-md w-fit my-3 mx-1.5 ${
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
        {content.image && (
            <img 
              src={imagePath} 
              alt="User uploaded" 
              className="max-w-32 max-h-32 object-cover mx-3 rounded-lg" 
              onError={(e) => {
                console.error("Error loading image:", e);
                e.target.style.display = 'none';
              }}
            />
          )}
        {content.pdf && (
              <FileBlock fileName={content.pdf} fileUrl={pdfPath} fileSize={"2.5MB"} />
          )}
        <div className="pt-1 pb-4 pl-3 pr-3 break-words">
          {formatText(content.content)}
        </div>
      </div>
    );
  }
  const [copiedCode, setCopiedCode] = useState(null);

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
          remarkPlugins={[remarkGfm, remarkMath]}  // Added remarkMath
          rehypePlugins={[rehypeRaw, rehypeKatex]}  // Added rehypeKatex
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const codeString = String(children).replace(/\n$/, "");
              
              if (inline) {
                return <code className={className} {...props}>{children}</code>;
              }
              if (match && match[1] === 'math') {
                // Remove leading and trailing whitespace and newlines
                const cleanMath = codeString.trim().replace(/^\n+|\n+$/g, '');
                return <BlockMath math={cleanMath} />;
              }

              if (match) {
                return (
                  <div className="relative">
                    <button
                      className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-sm px-2 py-1 rounded"
                      onClick={() => {
                        navigator.clipboard.writeText(codeString);
                        setCopiedCode(codeString);
                        setTimeout(() => setCopiedCode(null), 2000);
                      }}
                    >
                      {copiedCode === codeString ? "Copied!" : "Copy"}
                    </button>
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              return (
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
            // Add this new component for list items
            li: ({children, ordered, ...props}) => (
              <li className={`ml-4 ${ordered ? 'list-decimal' : 'list-disc'}`} {...props}>
                {children}
              </li>
            ),
            // Add this new component for links
            a: ({node, children, href, ...props}) => (
              <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            ),
          }}
        >
          {content.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}


ChatMessage.propTypes = {
  message: PropTypes.shape({
    content: PropTypes.any.isRequired,
    role: PropTypes.string.isRequired,
  }).isRequired,
};

export default ChatMessage;
