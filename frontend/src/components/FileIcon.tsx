import React from 'react';
import {
  Folder,
  FileText,
  Image,
  FileVideo,
  FileAudio,
  Archive,
  FileSpreadsheet,
  FileCode,
  Database,
  HardDrive,
  BookOpen
} from 'lucide-react';
import { getFileType } from '../utils/fileUtils';

interface FileIconProps {
  fileName: string;
  fileType: 'bucket' | 'folder' | 'file';
}

const FileIcon: React.FC<FileIconProps> = ({ fileName, fileType }) => {
  if (fileType === 'bucket') {
    return (
      <div className="file-icon bucket">
        <HardDrive size={20} />
      </div>
    );
  }
  
  if (fileType === 'folder') {
    return (
      <div className="file-icon folder">
        <Folder size={20} />
      </div>
    );
  }
  
  const type = getFileType(fileName);
  
  const getIcon = () => {
    switch (type) {
      case 'image':
        return <Image size={20} />;
      case 'video':
        return <FileVideo size={20} />;
      case 'audio':
        return <FileAudio size={20} />;
      case 'archive':
        return <Archive size={20} />;
      case 'spreadsheet':
        return <FileSpreadsheet size={20} />;
      case 'code':
        return <FileCode size={20} />;
      case 'document':
        return <FileText size={20} />;
      case 'notebook':
        return <BookOpen size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  return (
    <div className={`file-icon file ${type === 'notebook' ? 'notebook' : ''}`}>
      {getIcon()}
    </div>
  );
};

export default FileIcon;