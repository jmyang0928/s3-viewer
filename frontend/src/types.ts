export interface S3Bucket {
  Name: string;
  CreationDate: string;
}

export interface S3Object {
  Key: string;
  LastModified: string;
  Size: number;
}

export interface S3Prefix {
  Prefix: string;
}

export interface S3ListResponse {
  CommonPrefixes: S3Prefix[];
  Contents: S3Object[];
}

export interface S3File {
  name: string;
  key: string;
  size?: number;
  lastModified?: string;
  type: 'bucket' | 'folder' | 'file';
  bucket?: string;
}

export interface PresignedUrlResponse {
  url: string;
}