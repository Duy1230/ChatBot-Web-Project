import PropTypes from "prop-types";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { VariableSizeList } from 'react-window';
import ReactMarkdown from 'react-markdown';

const api = axios.create({
  baseURL: "http://localhost:8000",
});

const DocumentTab = React.forwardRef(({ pdfs }, ref) => {
  const [isDocumentTabOpen, setIsDocumentTabOpen] = useState(false);
  const [data, setData] = useState({});
  const [filteredIndices, setFilteredIndices] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);
  const listRef = useRef(null);
  const sizeMap = useRef({});
  const rowHeights = useRef({});
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef(null);

  
  const handlePdfClick = async (pdf) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/file/tree/get_pdf_data/${pdf}`);
      console.log('PDF Data received:', response.data);
      
      if (!response.data || !response.data.pdf_data || !response.data.order) {
        console.error('Invalid data format received');
        return;
      }

      if (Object.keys(response.data.pdf_data).length > 0) {
        console.log("OKKK")
        console.log(`response.data.pdf_data ${response.data.pdf_data}`)
        console.log(`response.data.order ${response.data.order}`)
        console.log(`response.data.order ${Object.keys(data)}`)
        setData(response.data.pdf_data);
        setFilteredIndices(response.data.order);
      } else {
        console.error('No PDF data received');
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearData = () => {
    console.log("DocumentTab: Clearing data");
    setData({});
    setFilteredIndices([]);
    setHighlightedId(null);
    rowHeights.current = {};
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  };

  useEffect(() => {
    console.log("DocumentTab: Ref mounted");
  }, []);

  // Expose the search function
  const searchAndScrollToId = async (id) => {
    const pdfName = id.substring(0, id.lastIndexOf('_'));
    
    try {
        // click on to open the pdf
        if(!isDocumentTabOpen){
            setIsDocumentTabOpen(true);
        }
        
        console.log('searchAndScrollToId - fetching data for:', pdfName);
        const response = await api.get(`/file/tree/get_pdf_data/${pdfName}`);
        
        if (!response.data || !response.data.pdf_data || !response.data.order) {
            console.error('Invalid data format received');
            return;
        }

        // First set the data
        setData(response.data.pdf_data);
        setFilteredIndices(response.data.order);

        // Wait for data to be set and initial render
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Find the exact match
                    const exactMatch = Object.keys(response.data.pdf_data).find(key => key === id);
                    if (exactMatch) {
                        setHighlightedId(exactMatch);
                        const index = response.data.order.indexOf(exactMatch);
                        
                        // Wait for row heights to stabilize
                        setTimeout(() => {
                            // Reset measurements before scrolling
                            if (listRef.current) {
                                listRef.current.resetAfterIndex(0);
                                
                                // Wait for reset to complete
                                requestAnimationFrame(() => {
                                    scrollToItemWithAlignment(index, response.data.order.length);
                                    
                                    // Double-check scroll position
                                    setTimeout(() => {
                                        scrollToItemWithAlignment(index, response.data.order.length);
                                    }, 100);
                                });
                            }
                        }, 100);
                    } else {
                        setHighlightedId(null);
                    }
                    resolve();
                });
            });
        });

    } catch (error) {
        console.error('Error loading PDF:', error);
    }
  };

  // Add to the ref methods
  React.useImperativeHandle(ref, () => ({
    clearData: () => {
      clearData();
    },
    searchAndScrollToId: (id) => {
      searchAndScrollToId(id);
    }
  }), []);

   // Add this function to ensure measurement and scrolling
  const scrollToItemWithAlignment = (index, itemCount) => {
    if (index === -1 || !listRef.current) return;

    // Calculate the reset start index, ensuring it's within bounds
    const resetStartIndex = Math.max(0, index - 5);

    // If the item is near the end, reset measurements from further back
    const isNearEnd = index > itemCount - 10;
    const adjustedResetIndex = isNearEnd ? Math.max(0, itemCount - 20) : resetStartIndex;

    // Scroll to the item first
    listRef.current.scrollToItem(index, "center");

    // Use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      if (listRef.current) {
        // Reset measurement from the adjusted index
        listRef.current.resetAfterIndex(adjustedResetIndex);

        // Scroll again after reset
        listRef.current.scrollToItem(index, "center");
      }
    });
  };

  // Modify handleSearch to pass itemCount to scrollToItemWithAlignment
  const handleSearch = (e) => {
    const searchTerm = e.target.value.trim();
    if (!searchTerm) {
        setHighlightedId(null);
        return;
    }
    
    console.log('handleSearch - Current data:', data);
    console.log('handleSearch - Current filteredIndices:', filteredIndices);
    const exactMatch = Object.keys(data).find(key => key === searchTerm);
    console.log('handleSearch - exactMatch:', exactMatch);
    if (exactMatch) {
        setHighlightedId(exactMatch);
        const index = filteredIndices.indexOf(exactMatch);
        console.log('handleSearch - index:', index);
        console.log('handleSearch - calling scrollToItemWithAlignment');
        scrollToItemWithAlignment(index, filteredIndices.length);
    } else {
        setHighlightedId(null);
    }
  };

  const getRowHeight = index => {
    return rowHeights.current[index] || 100;
  };

  const setRowHeight = (index, size) => {
    listRef.current?.resetAfterIndex(index);
    rowHeights.current = { ...rowHeights.current, [index]: size };
  };

  // Row component to render the content of each item
  const Row = ({ index, style }) => {
    const rowRef = useRef(null);
    const dataKey = filteredIndices[index];
    const content = data[dataKey];
    
    useEffect(() => {
      if (rowRef.current) {
        const measureRow = () => {
          const height = rowRef.current.getBoundingClientRect().height;
          if (height !== getRowHeight(index)) {
            setRowHeight(index, height);
          }
        };
        // Measure immediately
        measureRow();

        // Measure again after a short delay
        const timeoutId = setTimeout(measureRow, 200);

        return () => clearTimeout(timeoutId);
      }
    }, [content, index]);
    
    if (!content) {
      console.warn(`No content found for key: ${dataKey}`);
      return null;
    }
    
    return (
      <div
        ref={rowRef}
        style={{
          ...style,
          width: '100%',
          height: 'auto'
        }}
        className={`p-4 text-white ${highlightedId !== dataKey ? 'hover:bg-neutral-800 transition-colors duration-300' : ''}
          ${highlightedId === dataKey ? 'bg-blue-900' : ''}`}
      >
        <div id={dataKey} className="markdown-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        setContainerWidth(containerRef.current.offsetWidth - 32);
      };
      
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }
  }, [isDocumentTabOpen]);

  useEffect(() => {
    console.log('Current data:', data);
    console.log('Current filtered indices:', filteredIndices);
  }, [data, filteredIndices]);

  useEffect(() => {
    rowHeights.current = {};
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [data]);

  return (
    <>
      <button 
        onClick={() => setIsDocumentTabOpen(!isDocumentTabOpen)}
        className="transform bg-neutral-800 text-white p-2 hover:bg-neutral-700 transition-all duration-300 z-10 border-l border-neutral-600 w-6 h-auto"
      >
        <FontAwesomeIcon icon={isDocumentTabOpen ? faChevronRight : faChevronLeft} />
      </button>

      <div className={`${isDocumentTabOpen ? 'w-1/2' : 'w-0'}  bg-neutral-900 overflow-hidden border-l border-neutral-700`}>
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
        
        <div className="h-fit p-4 w-full" ref={containerRef}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by ID"
            onChange={handleSearch}
            className="w-full p-2 mb-4 bg-neutral-800 text-white border border-neutral-700 rounded"
          />
          {isLoading ? (
            <div className="text-white text-center py-4">Loading...</div>
          ) : filteredIndices.length > 0 ? (
            <VariableSizeList
              ref={listRef}
              width={containerWidth || 100}
              height={500}
              itemCount={filteredIndices.length}
              itemSize={getRowHeight}
              overscanCount={5}
              className="custom-scrollbar w-auto"
            >
              {Row}
            </VariableSizeList>
          ) : (
            <div className="text-white text-center py-4">No content to display</div>
          )}
        </div>
      </div>
    </>
  );
});

DocumentTab.displayName = 'DocumentTab';

DocumentTab.propTypes = {
  pdfs: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default DocumentTab;
