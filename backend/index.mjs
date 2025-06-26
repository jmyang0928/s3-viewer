import { S3Client, ListBucketsCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({});
const EXPIRATION_IN_SECONDS = 300;

// 標準化 API 回應格式
const apiResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    },
    body: JSON.stringify(body),
});

export const handler = async (event) => {
    const routeKey = event.routeKey;
    console.log(`Received request for routeKey: ${routeKey}`);

    if (event.requestContext.http.method === 'OPTIONS') {
        return apiResponse(200, {});
    }

    try {
        switch (routeKey) {
            case "GET /buckets":
                const listBucketsCommand = new ListBucketsCommand({});
                const { Buckets } = await client.send(listBucketsCommand);
                return apiResponse(200, Buckets);

            case "GET /buckets/{bucketName}/objects":
                const { bucketName } = event.pathParameters;
                // --- START: 本次修改重點 ---
                // 從查詢參數中獲取 prefix，用於指定要列出的資料夾
                const prefix = event.queryStringParameters?.prefix || '';

                const listObjectsCommand = new ListObjectsV2Command({
                    Bucket: bucketName,
                    // 使用分隔符 '/' 來區分資料夾
                    Delimiter: '/',
                    Prefix: prefix,
                });

                const response = await client.send(listObjectsCommand);

                // 同時回傳檔案 (Contents) 和資料夾 (CommonPrefixes)
                return apiResponse(200, {
                    Contents: response.Contents || [],
                    CommonPrefixes: response.CommonPrefixes || [],
                });
                // --- END: 修改重點 ---

            case "POST /presign":
                const { bucket, key } = JSON.parse(event.body || '{}');
                if (!bucket || !key) {
                    return apiResponse(400, { message: "Bucket and key are required." });
                }
                const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
                const url = await getSignedUrl(client, getObjectCommand, { expiresIn: EXPIRATION_IN_SECONDS });
                return apiResponse(200, { url });

            default:
                return apiResponse(404, { message: `Route not found: ${routeKey}` });
        }
    } catch (error) {
        console.error(error);
        if (error.name === 'AccessDenied') {
             return apiResponse(403, { message: `Access Denied. Ensure Lambda role has permissions and the S3 bucket does not have conflicting policies. Error: ${error.message}` });
        }
        return apiResponse(500, { message: "Internal Server Error", error: error.message });
    }
};
