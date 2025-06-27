import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// --- START: 本次修改重點 ---
// 引入 Amplify 核心庫和設定檔
import { Amplify } from 'aws-amplify';
import amplifyConfig from './amplifyconfiguration.json';

// 在應用程式渲染前，執行 Amplify 設定
Amplify.configure(amplifyConfig);
// --- END: 修改重點 ---

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
