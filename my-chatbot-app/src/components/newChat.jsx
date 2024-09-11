import PlusIcon from "../assets/more.png";

function NewChat({ clearPanel }) {
  const clearChat = async (e) => {
    e.preventDefault();
    clearPanel();
  };

  return (
    <button
      className={`bg-slate-700 rounded-2xl mx-1 mt-1 mb-5 max-w-[100%] min-w-[150px] w-[95%] flex hover:bg-slate-600 cursor-pointer`}
      onClick={clearChat}
    >
      <img
        className="max-h-6 max-w-6 block ml-12 mr-2 my-3.5"
        src={PlusIcon}
        alt=""
      />
      <p className="px-1     py-3 text-white font-bold text-lg font-sans">
        New Chat
      </p>
    </button>
  );
}

export default NewChat;
