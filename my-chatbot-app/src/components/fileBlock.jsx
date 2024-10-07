import React from 'react'
import { FileIcon, DownloadIcon } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';

const CustomButton = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-neutral-800 border-neutral-700 border text-white hover:bg-neutral-700 h-10 py-2 px-4"
    >
      {children}
    </button>
  )
}

export default function FileBlock(props) {
  const { fileName, fileSize, fileUrl } = props;
  const handleDownload = () => {
    fetch(fileUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => console.error('Error downloading file:', error));
  };
  return (
    <div className="ml-2 mr-5 mt-2 flex p-1 bg-neutral-800 border-neutral-700 border-l border-t items-center rounded-lg shadow-lg w-fit">
      <div className="my-2 flex items-center justify-center w-12 h-12 border border-orange-400 rounded-full mr-2">
        <FontAwesomeIcon icon={faFilePdf} className="w-6 h-6 text-orange-400" />
      </div>
      <div className="flex-grow overflow-y-auto max-w-48">
          <span className="text-sm font-medium text-blue-200 mr-3 break-all line-clamp-2 overflow-hidden">{fileName}</span>
      </div>
      <CustomButton className="ml-2 p-2 h-8 w-8 " onClick={handleDownload} aria-label="Download file">
        <DownloadIcon className="w-4 h-4" />
      </CustomButton>
    </div>
  )
}