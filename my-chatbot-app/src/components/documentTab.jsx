import PropTypes from "prop-types";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { List } from 'react-virtualized/dist/commonjs/List';
import ReactMarkdown from 'react-markdown';

const api = axios.create({
  baseURL: "http://localhost:8000",
});

function DocumentTab({ pdfs }) {
  const [isDocumentTabOpen, setIsDocumentTabOpen] = useState(false);
  const [data, setData] = useState({});
  const [filteredIndices, setFilteredIndices] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);
  const listRef = useRef(null);
  
  const handlePdfClick = async (pdf) => {
    const response = await api.get(`/file/tree/get_pdf_data/${pdf}`);
    setData(response.data.pdf_data);
    setFilteredIndices(response.data.order);
  };

  const scrollToElement = (elementId) => {
    const index = filteredIndices.indexOf(elementId);
    if (index !== -1 && listRef.current) {
      listRef.current.scrollToRow(index);
    }
  };

  const handleSearch = (e) => {
    const searchTerm = e.target.value.trim();
    if (!searchTerm) {
      setHighlightedId(null);
      return;
    }
    
    const exactMatch = Object.keys(data).find(key => key === searchTerm);
    if (exactMatch) {
      setHighlightedId(exactMatch);
      const index = filteredIndices.indexOf(exactMatch);
      if (index !== -1 && listRef.current) {
        listRef.current.scrollToRow(index);
      }
    } else {
      setHighlightedId(null);
    }
  };

  const rowRenderer = ({ index, key, style }) => {
    const dataKey = filteredIndices[index];
    const content = data[dataKey];
    
    return (
      <div
        key={key}
        style={{
          ...style,
          whiteSpace: 'normal',
          height: 'auto',
          minHeight: '60px'
        }}
        className={`p-4 border-b border-neutral-700 text-white hover:bg-neutral-800 transition-colors duration-300
          ${highlightedId === dataKey ? 'bg-blue-900' : ''}`}
      >
        <div id={dataKey}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <>
      <button 
        onClick={() => setIsDocumentTabOpen(!isDocumentTabOpen)}
        className="transform bg-neutral-800 text-white p-2 hover:bg-neutral-700 transition-all duration-300 z-10 border-l border-neutral-600 w-6 h-auto"
      >
        <FontAwesomeIcon icon={isDocumentTabOpen ? faChevronRight : faChevronLeft} />
      </button>

      <div className={`${isDocumentTabOpen ? 'w-1/3' : 'w-0'} transition-all duration-300 bg-neutral-900 overflow-hidden border-l border-neutral-700`}>
        {/* PDF Section (1/3 height) */}
        <div className="h-1/3 border-b border-neutral-700 overflow-y-auto custom-scrollbar p-4">
          <h2 className="text-white text-lg font-semibold mb-4">PDF Files</h2>
          <div className="space-y-2">
            {pdfs.map((pdf, index) => (
              <div onClick={() => handlePdfClick(pdf)} key={index} className="flex items-center text-white p-2 hover:bg-neutral-800 rounded cursor-pointer">
                <FontAwesomeIcon icon={faFilePdf} className="text-red-500 mr-2" />
                <span className="truncate">{pdf}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Modified List section */}
        <div className="h-2/3 p-4">
          <input
            type="text"
            placeholder="Search by ID"
            onChange={handleSearch}
            className="w-full p-2 mb-4 bg-neutral-800 text-white border border-neutral-700 rounded"
          />
          <List
            ref={listRef}
            width={400}
            height={500}
            rowCount={filteredIndices.length}
            rowHeight={100}
            rowRenderer={rowRenderer}
            scrollToAlignment="start"
            className="custom-scrollbar"
          />
        </div>
      </div>
    </>
  );
}

DocumentTab.propTypes = {
  pdfs: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default DocumentTab;
