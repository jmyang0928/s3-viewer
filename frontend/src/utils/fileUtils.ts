export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
  const extension = filename.toLowerCase().split('.').pop();
  return extension ? imageExtensions.includes(`.${extension}`) : false;
};

export const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv'];
  const extension = filename.toLowerCase().split('.').pop();
  return extension ? videoExtensions.includes(`.${extension}`) : false;
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const getFileType = (filename: string): string => {
  const extension = getFileExtension(filename);
  
  const types: { [key: string]: string } = {
    // Images
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image', svg: 'image', webp: 'image',
    // Videos
    mp4: 'video', avi: 'video', mov: 'video', wmv: 'video', flv: 'video', webm: 'video', mkv: 'video', m4v: 'video', '3gp': 'video', ogv: 'video',
    // Documents
    pdf: 'document', doc: 'document', docx: 'document', txt: 'document', rtf: 'document',
    // Spreadsheets
    xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet',
    // Presentations
    ppt: 'presentation', pptx: 'presentation',
    // Archives
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
    // Audio
    mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio', ogg: 'audio',
    // Code
    js: 'code', ts: 'code', html: 'code', css: 'code', json: 'code', xml: 'code', py: 'code', java: 'code',
    // Jupyter Notebook
    ipynb: 'notebook'
  };
  
  return types[extension] || 'file';
};