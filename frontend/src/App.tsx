import React, { useState, useEffect } from 'react';

// 引入 Amplify 的認證 UI 元件和手動獲取 Token 的函式
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { fetchAuthSession } from 'aws-amplify/auth';

// 引入 react-bootstrap 元件
import { Container, Row, Col, ListGroup, Card, Spinner, Alert, Button, Breadcrumb } from 'react-bootstrap';

// --- START: 本次修改重點 ---
// 引入新的套件
import { Bucket, Folder, FileEarmark, Clipboard, HouseFill } from 'react-bootstrap-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// --- END: 修改重點 ---

import config from './amplifyconfiguration.json';
const API_ENDPOINT = config.aws_cloud_logic_custom[0].endpoint;

// 定義物件的型別
interface S3File {
  Key: string;
  LastModified: string;
  Size: number;
}
interface S3Folder {
  Prefix: string;
}

// 主應用程式框架
function App() {
  return (
    <>
      {/* Toast 通知的容器 */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Authenticator>
        {({ signOut, user }) => (
          <main>
            <Container className="my-4">
              <Row className="align-items-center mb-4">
                <Col>
                  <h1>S3 檔案總管</h1>
                  <p className="text-muted">歡迎, {user?.signInDetails?.loginId}</p>
                </Col>
                <Col xs="auto">
                  <Button variant="danger" onClick={signOut}>登出</Button>
                </Col>
              </Row>
              <S3Content />
            </Container>
          </main>
        )}
      </Authenticator>
    </>
  );
}

// 登入後顯示的主要內容元件
function S3Content() {
  // --- State 管理 ---
  const [path, setPath] = useState<string[]>([]); // 目前路徑，例如: ['bucket-name', 'folder1']
  const [items, setItems] = useState<any[]>([]); // 目前路徑下的項目 (bucket, folder, file)
  const [selectedFile, setSelectedFile] = useState<S3File | null>(null);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 可重複使用的 fetch 函式
  const authenticatedFetch = async (path: string, options: RequestInit = {}) => {
    const { tokens } = await fetchAuthSession();
    const idToken = tokens?.idToken?.toString();
    if (!idToken) throw new Error("No ID token found");

    const headers = { ...options.headers, 'Content-Type': 'application/json', 'Authorization': idToken };
    const response = await fetch(`${API_ENDPOINT}${path}`, { ...options, headers });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Request failed with status ${response.status}: ${errorBody.message}`);
    }
    return response.json();
  };

  // Effect: 當路徑變更時，取得對應的內容
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setItems([]);
      setSelectedFile(null);
      setPresignedUrl(null);

      try {
        if (path.length === 0) {
          // 根目錄：顯示所有 buckets
          const buckets = await authenticatedFetch('/buckets');
          setItems(buckets.map((b: any) => ({ ...b, type: 'bucket' })));
        } else {
          // 資料夾內部：顯示檔案和子資料夾
          const bucketName = path[0];
          const prefix = path.slice(1).join('/') + (path.length > 1 ? '/' : '');
          const data = await authenticatedFetch(`/buckets/${bucketName}/objects?prefix=${encodeURIComponent(prefix)}`);
          
          const folders = data.CommonPrefixes.map((f: S3Folder) => ({ Name: f.Prefix.replace(prefix, '').replace('/', ''), Prefix: f.Prefix, type: 'folder' }));
          const files = data.Contents.map((f: S3File) => ({ ...f, type: 'file' }));
          
          setItems([...folders, ...files]);
        }
      } catch (err: any) {
        console.error("取得資料時發生錯誤:", err);
        setError(`無法取得內容: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [path]);

  // Effect: 當選擇的檔案變更時，取得 Presigned URL
  useEffect(() => {
    if (!selectedFile) return;

    const getUrl = async () => {
      setLoading(true); // 可以用一個更細緻的 loading state
      try {
        const bucketName = path[0];
        const data = await authenticatedFetch('/presign', {
            method: 'POST',
            body: JSON.stringify({
                bucket: bucketName,
                key: selectedFile.Key
            })
        });
        setPresignedUrl(data.url);
      } catch (err: any) {
        console.error("產生 Presigned URL 時發生錯誤:", err);
        setError(`無法產生 Presigned URL: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    getUrl();
  }, [selectedFile]);

  // 點擊項目 (bucket, folder, or file) 的處理函式
  const handleItemClick = (item: any) => {
    if (item.type === 'bucket') {
      setPath([item.Name]);
    } else if (item.type === 'folder') {
      setPath([...path, item.Name]);
    } else if (item.type === 'file') {
      setSelectedFile(item);
    }
  };

  // 點擊麵包屑導覽的處理函式
  const handleBreadcrumbClick = (index: number) => {
    setPath(path.slice(0, index + 1));
  };

  // 複製 Presigned URL 到剪貼簿
  const copyToClipboard = () => {
    if (presignedUrl) {
      navigator.clipboard.writeText(presignedUrl).then(() => {
        toast.success('已成功複製連結！');
      }, (err) => {
        toast.error('複製失敗！');
        console.error('Could not copy text: ', err);
      });
    }
  };

  // --- JSX 渲染 ---
  return (
    <Row>
      {error && <Alert variant="danger">{error}</Alert>}
      <Col md={8}>
        {/* 麵包屑導覽 */}
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => setPath([])} active={path.length === 0}><HouseFill /></Breadcrumb.Item>
          {path.map((segment, index) => (
            <Breadcrumb.Item key={index} onClick={() => handleBreadcrumbClick(index)} active={index === path.length - 1}>
              {segment}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
        
        {/* 項目列表 */}
        <ListGroup>
          {loading && <div className="text-center p-3"><Spinner animation="border" /></div>}
          {!loading && items.map((item, index) => (
            <ListGroup.Item 
              key={item.Name || item.Key || index}
              action
              onClick={() => handleItemClick(item)}
              className="d-flex align-items-center"
              active={selectedFile?.Key === item.Key}
            >
              {item.type === 'bucket' && <Bucket className="me-2" size={20} />}
              {item.type === 'folder' && <Folder className="me-2" size={20} />}
              {item.type === 'file' && <FileEarmark className="me-2" size={20} />}
              <span className="flex-grow-1">{item.Name || item.Key.split('/').pop()}</span>
              {item.type === 'file' && <small className="text-muted">{Math.round(item.Size / 1024)} KB</small>}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Col>

      {/* 右欄：預覽 */}
      <Col md={4}>
        <h4>預覽</h4>
        <Card>
            <Card.Header>{selectedFile?.Key.split('/').pop() || '請選擇一個檔案'}</Card.Header>
            <Card.Body style={{ minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
                {presignedUrl ? 
                    (<>
                      {presignedUrl.match(/\.(jpeg|jpg|gif|png|svg)$/i) != null ? 
                        <img src={presignedUrl} alt={selectedFile?.Key} style={{maxWidth: '100%', maxHeight: '300px', objectFit: 'contain'}} /> 
                        : <div className="text-center">
                            <FileEarmark size={50} className="mb-2" />
                            <p>無法預覽此檔案類型。</p>
                          </div>
                      }
                      <Button variant="secondary" size="sm" onClick={copyToClipboard}>
                        <Clipboard className="me-2" /> 複製下載連結
                      </Button>
                    </>)
                    : <p className="text-muted">沒有可用的預覽</p>
                }
            </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

export default App;
