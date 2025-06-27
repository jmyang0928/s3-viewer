import React from 'react';
import { formatFileSize, formatDate } from '../utils/fileUtils';
import FileIcon from './FileIcon';

interface FileGridProps {
  items: any[];
  selectedFile: any;
  loading: boolean;
  onItemClick: (item: any) => void;
  onItemDoubleClick: (item: any) => void;
}

const FileGrid: React.FC<FileGridProps> = ({ 
  items, 
  selectedFile, 
  loading, 
  onItemClick, 
  onItemDoubleClick 
}) => {
  if (loading) {
    return (
      <div className="file-grid-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <div className="loading-text">Loading files...</div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="file-grid-container">
        <div className="empty-state">
          <div className="empty-icon">
            📁
          </div>
          <h3>No items found</h3>
          <p>This location appears to be empty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="file-grid-container">
      <div className="file-grid">
        {items.map((item, index) => (
          <div
            key={`${item.type}-${item.name}-${index}`}
            className={`file-card ${selectedFile?.key === item.key ? 'selected' : ''}`}
            data-type={item.type}
            onClick={() => onItemClick(item)}
            onDoubleClick={() => onItemDoubleClick(item)}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onItemClick(item);
              }
            }}
          >
            <div className="file-card-header">
              <FileIcon fileName={item.name} fileType={item.type} />
              <div className="file-name">{item.name}</div>
            </div>
            
            {(item.size !== undefined || item.lastModified) && (
              <div className="file-meta">
                {item.size !== undefined && (
                  <span className="file-size">{formatFileSize(item.size)}</span>
                )}
                {item.lastModified && (
                  <span className="file-date">{formatDate(item.lastModified)}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileGrid;