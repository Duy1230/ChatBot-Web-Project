import PropTypes from "prop-types";

function ChatTab(props) {
  const constent = props.content;
  return (
    <div
      className={`bg-slate-700 rounded-2xl mx-1 my-1 max-w-[300px] min-w-[150px] w-auto hover:bg-slate-600 cursor-pointer`}
    >
      <p className="px-2 py-1 text-white font-normal text-sm font-sans">
        {constent}
      </p>
    </div>
  );
}

ChatTab.propTypes = {
  content: PropTypes.string.isRequired,
};

export default ChatTab;
