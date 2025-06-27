import React, { useEffect, useState } from 'react';
import { Download, Copy, FileText, Loader, X, Eye, AlertCircle, Play, Code, FileImage, Info, BookOpen } from 'lucide-react';
import { toast } from 'react-toastify';
import { S3File } from '../types';
import { isImageFile, isVideoFile, formatFileSize, getFileType } from '../utils/fileUtils';
import { getPresignedUrl } from '../utils/api';
import FileIcon from './FileIcon';

interface PreviewModalProps {
  selectedFile: S3File | null;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ selectedFile, onClose }) => {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'source' | 'rendered'>('rendered'); // 預設使用渲染模式
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  const isPreviewableFile = (fileName: string): boolean => {
    const fileType = getFileType(fileName);
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    return (
      fileType === 'image' ||
      fileType === 'video' ||
      fileType === 'notebook' ||
      extension === 'pdf' ||
      ['txt', 'md', 'json', 'xml', 'csv', 'log', 'yaml', 'yml', 'ini', 'cfg', 'conf'].includes(extension) ||
      ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'sass', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sh', 'sql', 'xlsx'].includes(extension)
    );
  };

  const isTextFile = (fileName: string): boolean => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    return ['txt', 'md', 'json', 'xml', 'csv', 'log', 'yaml', 'yml', 'ini', 'cfg', 'conf', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'sass', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'sh', 'sql', 'xlsx', 'ipynb'].includes(extension);
  };

  const isRenderableFile = (fileName: string): boolean => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    return ['md', 'json', 'csv', 'html', 'xml', 'yaml', 'yml', 'xlsx', 'ipynb'].includes(extension);
  };

  const isPdfFile = (fileName: string): boolean => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  const isNotebookFile = (fileName: string): boolean => {
    return fileName.toLowerCase().endsWith('.ipynb');
  };

  const getLanguageFromExtension = (fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'sh': 'bash',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'csv': 'csv',
      'xlsx': 'excel',
      'ipynb': 'jupyter'
    };
    return languageMap[extension] || 'text';
  };

  useEffect(() => {
    if (selectedFile && selectedFile.type === 'file' && selectedFile.bucket) {
      setLoading(true);
      setError(null);
      setFileContent(null);
      
      // 如果是可渲染的檔案，預設使用渲染模式，否則使用原始碼模式
      const canRender = isRenderableFile(selectedFile.name);
      setViewMode(canRender ? 'rendered' : 'source');
      
      getPresignedUrl(selectedFile.bucket, selectedFile.key)
        .then(async (response) => {
          setPresignedUrl(response.url);
          
          // 如果是文字檔案，嘗試載入內容
          if (isTextFile(selectedFile.name)) {
            try {
              const textResponse = await fetch(response.url);
              if (textResponse.ok) {
                const content = await textResponse.text();
                // 限制文字內容大小 (最大 1MB)
                if (content.length <= 1024 * 1024) {
                  setFileContent(content);
                } else {
                  setError('File too large to preview (max 1MB for text files)');
                }
              }
            } catch (err) {
              // 如果無法載入文字內容，不顯示錯誤，只是不預覽
              console.warn('Could not load text content:', err);
            }
          }
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setPresignedUrl(null);
      setFileContent(null);
      setError(null);
    }
  }, [selectedFile]);

  const copyToClipboard = async () => {
    if (presignedUrl) {
      try {
        await navigator.clipboard.writeText(presignedUrl);
        toast.success('🚀 Download link copied to clipboard!');
      } catch (err) {
        toast.error('❌ Failed to copy link to clipboard');
      }
    }
  };

  const downloadFile = () => {
    if (presignedUrl) {
      const link = document.createElement('a');
      link.href = presignedUrl;
      link.download = selectedFile?.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('⬇️ Download started!');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInfoPopupBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowInfoPopup(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showInfoPopup) {
        setShowInfoPopup(false);
      } else {
        onClose();
      }
    }
  };

  useEffect(() => {
    if (selectedFile) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [selectedFile, showInfoPopup]);

  const renderMarkdown = (content: string): string => {
    // 簡單的 Markdown 渲染
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      .replace(/```([^```]*)```/gims, '<pre><code>$1</code></pre>')
      .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2" target="_blank">$1</a>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\n/gim, '<br>');
  };

  const renderJSON = (content: string): string => {
    try {
      const parsed = JSON.parse(content);
      return `<pre class="json-rendered">${JSON.stringify(parsed, null, 2)}</pre>`;
    } catch (e) {
      return `<div class="error">Invalid JSON format</div>`;
    }
  };

  const renderCSV = (content: string): string => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '<div class="error">Empty CSV file</div>';
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
    
    let html = '<table class="csv-table"><thead><tr>';
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
  };

  const renderHTML = (content: string): string => {
    // 為了安全，只渲染基本的 HTML 標籤
    return content;
  };

  const renderXML = (content: string): string => {
    // 格式化 XML
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      const serializer = new XMLSerializer();
      const formatted = serializer.serializeToString(xmlDoc);
      return `<pre class="xml-rendered">${formatted}</pre>`;
    } catch (e) {
      return `<div class="error">Invalid XML format</div>`;
    }
  };

  const renderYAML = (content: string): string => {
    // 簡單的 YAML 格式化
    return `<pre class="yaml-rendered">${content}</pre>`;
  };

  const renderXLSX = (content: string): string => {
    // XLSX 檔案無法直接渲染，顯示提示訊息
    return `<div class="xlsx-info">
      <h3>Excel File (.xlsx)</h3>
      <p>Excel files cannot be rendered directly in the browser.</p>
      <p>Please download the file to view its contents.</p>
    </div>`;
  };

  const renderJupyterNotebook = (content: string): string => {
    try {
      const notebook = JSON.parse(content);
      
      if (!notebook.cells || !Array.isArray(notebook.cells)) {
        return '<div class="error">Invalid Jupyter Notebook format</div>';
      }

      let html = '<div class="jupyter-notebook">';
      
      // 添加 notebook 標題
      html += `
        <div class="notebook-header">
          <div class="notebook-title">
            <div class="notebook-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
            <h2>Jupyter Notebook</h2>
          </div>
          <div class="notebook-info">
            <span class="cell-count">${notebook.cells.length} cells</span>
            <span class="kernel-info">${notebook.metadata?.kernelspec?.display_name || 'Unknown Kernel'}</span>
          </div>
        </div>
      `;

      // 渲染每個 cell
      notebook.cells.forEach((cell: any, index: number) => {
        const cellType = cell.cell_type || 'unknown';
        const source = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '');
        
        html += `<div class="notebook-cell ${cellType}-cell">`;
        
        // Cell 標題
        html += `
          <div class="cell-header">
            <span class="cell-type">${cellType.toUpperCase()}</span>
            <span class="cell-number">[${index + 1}]</span>
          </div>
        `;
        
        // Cell 內容
        html += '<div class="cell-content">';
        
        if (cellType === 'code') {
          // 程式碼 cell
          html += `<pre class="code-input"><code class="language-python">${source}</code></pre>`;
          
          // 如果有輸出，顯示輸出
          if (cell.outputs && cell.outputs.length > 0) {
            html += '<div class="cell-outputs">';
            cell.outputs.forEach((output: any) => {
              if (output.output_type === 'stream') {
                const text = Array.isArray(output.text) ? output.text.join('') : (output.text || '');
                html += `<pre class="output-stream">${text}</pre>`;
              } else if (output.output_type === 'execute_result' || output.output_type === 'display_data') {
                if (output.data) {
                  if (output.data['text/plain']) {
                    const text = Array.isArray(output.data['text/plain']) ? 
                      output.data['text/plain'].join('') : output.data['text/plain'];
                    html += `<pre class="output-result">${text}</pre>`;
                  }
                  if (output.data['text/html']) {
                    const htmlContent = Array.isArray(output.data['text/html']) ? 
                      output.data['text/html'].join('') : output.data['text/html'];
                    html += `<div class="output-html">${htmlContent}</div>`;
                  }
                  if (output.data['image/png']) {
                    html += `<img class="output-image" src="data:image/png;base64,${output.data['image/png']}" alt="Output image" />`;
                  }
                }
              } else if (output.output_type === 'error') {
                const traceback = Array.isArray(output.traceback) ? 
                  output.traceback.join('\n') : (output.traceback || '');
                html += `<pre class="output-error">${output.ename}: ${output.evalue}\n${traceback}</pre>`;
              }
            });
            html += '</div>';
          }
        } else if (cellType === 'markdown') {
          // Markdown cell
          html += `<div class="markdown-content">${renderMarkdown(source)}</div>`;
        } else if (cellType === 'raw') {
          // Raw cell
          html += `<pre class="raw-content">${source}</pre>`;
        } else {
          // 未知類型
          html += `<pre class="unknown-content">${source}</pre>`;
        }
        
        html += '</div>'; // cell-content
        html += '</div>'; // notebook-cell
      });
      
      html += '</div>'; // jupyter-notebook
      
      return html;
    } catch (e) {
      return `<div class="error">Invalid Jupyter Notebook format: ${e instanceof Error ? e.message : 'Unknown error'}</div>`;
    }
  };

  const renderFileContent = (content: string, fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    switch (extension) {
      case 'md':
        return renderMarkdown(content);
      case 'json':
        return renderJSON(content);
      case 'csv':
        return renderCSV(content);
      case 'html':
        return renderHTML(content);
      case 'xml':
        return renderXML(content);
      case 'yaml':
      case 'yml':
        return renderYAML(content);
      case 'xlsx':
        return renderXLSX(content);
      case 'ipynb':
        return renderJupyterNotebook(content);
      default:
        return `<pre>${content}</pre>`;
    }
  };

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <div className="loading-text">Loading preview...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="preview-error">
          <AlertCircle size={48} />
          <h3>Preview Error</h3>
          <p>{error}</p>
        </div>
      );
    }

    if (!presignedUrl) {
      return null;
    }

    // 圖片預覽 - 自適應尺寸
    if (isImageFile(selectedFile!.name)) {
      return (
        <div className="preview-content media-preview">
          <div className="media-container">
            <img
              src={presignedUrl}
              alt={selectedFile!.name}
              className="preview-media"
              onError={() => setError('Failed to load image preview')}
            />
          </div>
        </div>
      );
    }

    // 影片預覽 - 自適應尺寸並支援播放
    if (isVideoFile(selectedFile!.name)) {
      return (
        <div className="preview-content media-preview">
          <div className="media-container">
            <video
              src={presignedUrl}
              className="preview-media"
              controls
              preload="metadata"
              onError={() => setError('Failed to load video preview')}
            >
              <div className="video-fallback">
                <Play size={48} />
                <p>Your browser does not support video playback</p>
                <button className="btn btn-primary" onClick={downloadFile}>
                  <Download size={16} />
                  Download Video
                </button>
              </div>
            </video>
          </div>
        </div>
      );
    }

    // PDF 預覽 - 修復顯示問題
    if (isPdfFile(selectedFile!.name)) {
      return (
        <div className="preview-content pdf-preview">
          <div className="pdf-viewer">
            <iframe
              src={presignedUrl}
              title={selectedFile!.name}
              className="pdf-frame"
              onError={() => setError('Failed to load PDF preview')}
              onLoad={() => console.log('PDF loaded successfully')}
            />
            {/* 備用方案：如果 iframe 無法載入，提供下載選項 */}
            <div className="pdf-fallback" style={{ display: 'none' }}>
              <FileText size={48} />
              <h3>PDF Preview Unavailable</h3>
              <p>This PDF cannot be displayed in the browser.</p>
              <button className="btn btn-primary" onClick={downloadFile}>
                <Download size={16} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 文字檔案預覽 - 支援原始碼和渲染切換
    if (fileContent !== null) {
      const canRender = isRenderableFile(selectedFile!.name);
      
      return (
        <div className="preview-content text-preview">
          <div className="text-content">
            {viewMode === 'source' || !canRender ? (
              <pre>
                <code>{fileContent}</code>
              </pre>
            ) : (
              <div 
                className="rendered-content"
                dangerouslySetInnerHTML={{ 
                  __html: renderFileContent(fileContent, selectedFile!.name) 
                }}
              />
            )}
          </div>
        </div>
      );
    }

    // 不支援預覽的檔案類型
    const fileType = getFileType(selectedFile!.name);
    const extension = selectedFile!.name.toLowerCase().split('.').pop() || '';

    return (
      <div className="preview-placeholder">
        <div className="preview-placeholder-icon">
          <FileIcon fileName={selectedFile!.name} fileType="file" />
        </div>
        <h3>Preview not available</h3>
        <p>This file type ({extension.toUpperCase()}) cannot be previewed</p>
        <small>Use the download button to access the file</small>
      </div>
    );
  };

  if (!selectedFile || selectedFile.type !== 'file') {
    return null;
  }

  const canRender = isRenderableFile(selectedFile.name);
  const lineCount = fileContent ? fileContent.split('\n').length : 0;
  const charCount = fileContent ? fileContent.length : 0;

  return (
    <>
      <div className="modal-backdrop" onClick={handleBackdropClick}>
        <div className="modal-container">
          {/* 手機版頂部控制按鈕 - 最上方右邊 */}
          <div className="modal-top-controls">
            <button 
              className="file-info-btn"
              onClick={() => setShowInfoPopup(true)}
              title="View file information"
            >
              <Info size={16} />
            </button>
            <button className="modal-close" onClick={onClose} title="Close preview (ESC)">
              <X size={20} />
            </button>
          </div>

          <div className="modal-header">
            <div className="modal-title">
              <FileIcon fileName={selectedFile.name} fileType="file" />
              <div className="title-info">
                <div className="title-row">
                  <h2>{selectedFile.name}</h2>
                </div>
                <div className="file-metadata">
                  {/* 桌面版顯示完整資訊 */}
                  <span className="file-type desktop-only">{getFileType(selectedFile.name)}</span>
                  {selectedFile.size && (
                    <span className="file-size desktop-only">{formatFileSize(selectedFile.size)}</span>
                  )}
                  {fileContent && (
                    <span className="file-stats desktop-only">
                      {lineCount} lines • {charCount} characters
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-header-controls">
              {canRender && fileContent && (
                <div className="view-mode-toggle">
                  {/* 🎯 關鍵修改：調整按鈕順序 - Rendered 在左邊，Source 在右邊 */}
                  <button
                    className={`toggle-btn ${viewMode === 'rendered' ? 'active' : ''}`}
                    onClick={() => setViewMode('rendered')}
                  >
                    {isNotebookFile(selectedFile.name) ? <BookOpen size={14} /> : <FileImage size={14} />}
                    <span className="desktop-only">
                      {isNotebookFile(selectedFile.name) ? 'Notebook' : 'Rendered'}
                    </span>
                  </button>
                  <button
                    className={`toggle-btn ${viewMode === 'source' ? 'active' : ''}`}
                    onClick={() => setViewMode('source')}
                  >
                    <Code size={14} />
                    <span className="desktop-only">Source</span>
                  </button>
                </div>
              )}
              
              {/* 桌面版關閉按鈕 */}
              <button className="modal-close desktop-only" onClick={onClose} title="Close preview (ESC)">
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="modal-content">
            {renderPreviewContent()}
          </div>

          <div className="modal-actions">
            <button className="btn btn-primary" onClick={downloadFile}>
              <Download size={16} />
              <span className="btn-text">Download File</span>
            </button>
            
            <button className="btn btn-secondary" onClick={copyToClipboard}>
              <Copy size={16} />
              <span className="btn-text">Copy Download Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* 檔案資訊彈出視窗 */}
      {showInfoPopup && (
        <div className="info-popup-backdrop" onClick={handleInfoPopupBackdropClick}>
          <div className="info-popup">
            <div className="info-popup-header">
              <h3>File Information</h3>
              <button 
                className="info-popup-close"
                onClick={() => setShowInfoPopup(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="info-popup-content">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{selectedFile.name}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Type:</span>
                <span className="info-value">{getFileType(selectedFile.name)}</span>
              </div>
              
              {selectedFile.size && (
                <div className="info-item">
                  <span className="info-label">Size:</span>
                  <span className="info-value">{formatFileSize(selectedFile.size)}</span>
                </div>
              )}
              
              {selectedFile.lastModified && (
                <div className="info-item">
                  <span className="info-label">Modified:</span>
                  <span className="info-value">
                    {new Date(selectedFile.lastModified).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              
              {fileContent && (
                <>
                  <div className="info-item">
                    <span className="info-label">Lines:</span>
                    <span className="info-value">{lineCount.toLocaleString()}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Characters:</span>
                    <span className="info-value">{charCount.toLocaleString()}</span>
                  </div>
                </>
              )}
              
              <div className="info-item">
                <span className="info-label">Previewable:</span>
                <span className="info-value">
                  {isPreviewableFile(selectedFile.name) ? 'Yes' : 'No'}
                </span>
              </div>
              
              {isTextFile(selectedFile.name) && (
                <div className="info-item">
                  <span className="info-label">Renderable:</span>
                  <span className="info-value">
                    {canRender ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PreviewModal;