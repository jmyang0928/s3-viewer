# S3 Viewer CFN

這是一個使用 AWS CloudFormation 部署的 S3 檔案瀏覽器。

## 專案結構

- `backend/`: 包含 AWS SAM/CloudFormation 範本，用於部署後端資源 (例如 Lambda 函數和 API Gateway)。
- `frontend/`: 包含一個 React 前端應用程式，用於與後端 API 互動並在瀏覽器中顯示 S3 物件。

## 開始使用

### 必要條件

- AWS CLI
- Node.js 和 npm
- AWS SAM CLI

### 後端部署

1.  進入 `backend` 目錄:
    ```bash
    cd backend
    ```
2.  安裝相依套件:
    ```bash
    npm install
    ```
3.  打包 CloudFormation 範本:
    > **注意：** 請將 `s3-viewer-deploy-artifacts` 換成您自己的部署儲存桶名稱。這個 S3 儲存桶必須先存在。
    ```bash
    aws cloudformation package \
        --template-file template.yaml \
        --s3-bucket s3-viewer-deploy-artifacts \
        --output-template-file packaged-template.yaml
    ```
4.  部署 CloudFormation 堆疊:
    ```bash
    aws cloudformation deploy \
        --template-file packaged-template.yaml \
        --stack-name s3-viewer-stack \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --region us-east-1
    ```
    部署完成後，記下輸出的 API Gateway 端點 URL。

### 前端設定與執行

1.  進入 `frontend` 目錄:
    ```bash
    cd frontend
    ```
2.  安裝相依套件:
    ```bash
    npm install
    ```
3.  設定後端 API:
    - 將 `src/amplifyconfiguration.json.example` 複製為 `src/amplifyconfiguration.json`。
    - 更新 `src/amplifyconfiguration.json` 中的 API Gateway 端點 URL。
4.  啟動前端開發伺服器:
    ```bash
    npm start
    ```
5.  開啟瀏覽器並瀏覽至 `http://localhost:3000`。

## 架構

- **前端**: React, AWS Amplify
- **後端**: AWS Lambda, Amazon API Gateway, Amazon S3
- **部署**: AWS CloudFormation (SAM)
