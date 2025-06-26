import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 引入 AWS Amplify 核心庫和設定檔
import { Amplify } from 'aws-amplify';
import config from './amplifyconfiguration.json';

// 引入 Bootstrap 的 CSS 以美化介面
import 'bootstrap/dist/css/bootstrap.min.css';

// 將您的 AWS 後端設定載入到 Amplify
Amplify.configure(config);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 渲染主應用程式組件
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
