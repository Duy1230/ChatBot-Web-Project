import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Sparkles } from 'lucide-react';

function NewChat({ clearPanel }) {
  const clearChat = async (e) => {
    e.preventDefault();
    clearPanel();
  };

  return (
    <button
      className={`bg-neutral-700 rounded-2xl mx-1 mt-1 mb-5 max-w-[100%] min-w-[150px] w-[95%] flex hover:bg-neutral-600 cursor-pointer`}
      onClick={clearChat}
    >
      <Sparkles className="w-8 h-8 block ml-12 mr-2 mt-3 mb-3.5 rounded-lg text-yellow-300"  />
      <p id="newChat" className="py-3 font-bold text-xl font-sans text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 animate-glow">
        New Chat
      </p>
    </button>
  );
}

export default NewChat;
