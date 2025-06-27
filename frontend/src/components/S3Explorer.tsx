import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { fetchBuckets, fetchObjects } from '../utils/api';
import { S3File, S3Bucket, S3ListResponse } from '../types';
import BreadcrumbNav from './BreadcrumbNav';
import FileGrid from './FileGrid';
import PreviewModal from './PreviewModal';

const S3Explorer: React.FC = () => {
  const [path, setPath] = useState<string[]>([]);
  const [items, setItems] = useState<S3File[]>([]);
  const [selectedFile, setSelectedFile] = useState<S3File | null>(null);
  const [previewFile, setPreviewFile] = useState<S3File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async (currentPath: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      if (currentPath.length === 0) {
        // Load buckets
        const buckets: S3Bucket[] = await fetchBuckets();
        const bucketItems: S3File[] = buckets.map(bucket => ({
          name: bucket.Name,
          key: bucket.Name,
          type: 'bucket' as const,
        }));
        setItems(bucketItems);
      } else {
        // Load objects from bucket
        const bucketName = currentPath[0];
        const prefix = currentPath.length > 1 ? currentPath.slice(1).join('/') + '/' : '';
        
        const response: S3ListResponse = await fetchObjects(bucketName, prefix);
        
        const folderItems: S3File[] = response.CommonPrefixes.map(prefix => {
          const folderName = prefix.Prefix.split('/').filter(Boolean).pop() || '';
          return {
            name: folderName,
            key: prefix.Prefix,
            type: 'folder' as const,
            bucket: bucketName,
          };
        });
        
        const fileItems: S3File[] = response.Contents
          .filter(obj => !obj.Key.endsWith('/'))
          .map(obj => {
            const fileName = obj.Key.split('/').pop() || obj.Key;
            return {
              name: fileName,
              key: obj.Key,
              size: obj.Size,
              lastModified: obj.LastModified,
              type: 'file' as const,
              bucket: bucketName,
            };
          });
        
        setItems([...folderItems, ...fileItems]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(path);
  }, [path]);

  const handleNavigate = (index: number) => {
    if (index === -1) {
      setPath([]);
    } else {
      setPath(path.slice(0, index + 1));
    }
    setSelectedFile(null);
    setPreviewFile(null);
  };

  const handleItemClick = (item: S3File) => {
    setSelectedFile(item);
    
    // 單擊行為：資料夾和 bucket 直接進入，檔案開啟預覽
    if (item.type === 'bucket') {
      setPath([item.name]);
      setSelectedFile(null);
      setPreviewFile(null);
    } else if (item.type === 'folder') {
      setPath([...path, item.name]);
      setSelectedFile(null);
      setPreviewFile(null);
    } else if (item.type === 'file') {
      // 檔案：開啟預覽視窗
      setPreviewFile(item);
    }
  };

  const handleItemDoubleClick = (item: S3File) => {
    // 雙擊行為：對於檔案可以有特殊處理（如直接下載）
    // 對於資料夾和 bucket，雙擊和單擊行為相同
    if (item.type === 'file') {
      // 可以在這裡添加檔案的雙擊行為，比如直接下載
      // 目前保持和單擊相同的行為
      setPreviewFile(item);
    } else {
      // 資料夾和 bucket 的雙擊行為和單擊相同
      handleItemClick(item);
    }
  };

  const handleClosePreview = () => {
    setPreviewFile(null);
  };

  const retryLoad = () => {
    loadItems(path);
  };

  return (
    <div className="file-explorer-full">
      <BreadcrumbNav path={path} onNavigate={handleNavigate} />
      
      {error && (
        <div className="error-alert">
          <div className="error-title">⚠️ Error Loading Files</div>
          <div className="error-message">{error}</div>
          <button className="retry-btn" onClick={retryLoad}>
            Retry
          </button>
        </div>
      )}
      
      <FileGrid
        items={items}
        selectedFile={selectedFile}
        loading={loading}
        onItemClick={handleItemClick}
        onItemDoubleClick={handleItemDoubleClick}
      />
      
      <PreviewModal 
        selectedFile={previewFile} 
        onClose={handleClosePreview}
      />
    </div>
  );
};

export default S3Explorer;