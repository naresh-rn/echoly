import React from 'react';

const UploadZone = ({ onFileSelect, selectedFile }) => {
  return (
    <div className="w-full p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:border-blue-500 transition-colors text-center">
      <input 
        type="file" 
        id="fileInput"
        className="hidden" 
        accept=".mp4,.mov,.mp3,.wav" 
        onChange={(e) => onFileSelect(e.target.files[0])}
      />
      <label htmlFor="fileInput" className="cursor-pointer">
        <div className="text-4xl mb-2">📁</div>
        <p className="text-slate-600 font-medium">
          {selectedFile ? selectedFile.name : "Click to upload Video or Audio (MP4, MOV, MP3)"}
        </p>
        <p className="text-xs text-slate-400 mt-1">Maximum file size: 50MB</p>
      </label>
    </div>
  );
};

export default UploadZone;