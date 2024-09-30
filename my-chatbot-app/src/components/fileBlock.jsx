import React from 'react'
import { FileIcon, DownloadIcon } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';

const CustomButton = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-blue-500 text-white hover:bg-blue-600 h-10 py-2 px-4"
    >
      {children}
    </button>
  )
}

export default function FileBlock(props) {
  const { fileName, fileSize } = props;
  return (
    <div className="ml-2 mr-5 mt-2 flex items-center p-1 bg-slate-700  rounded-lg shadow-lg">
      <div className="flex items-center justify-center w-12 h-12 bg-blue-200 rounded-full mr-4">
        <FontAwesomeIcon icon={faFilePdf} className="w-6 h-6 text-blue-500" />
      </div>
      <div className="flex-grow min-w-0 max-w-28">
        <div className="flex w-full">
          <span className="text-sm font-medium text-blue-200 mr-3 break-words">{fileName}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>
      <CustomButton className="ml-2 p-2 h-8 w-8" aria-label="Download file">
        <DownloadIcon className="w-4 h-4" />
      </CustomButton>
    </div>
  )
}