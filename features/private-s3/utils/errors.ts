/**
 * Custom error types for S3 operations with user-friendly messages
 */

export class S3Error extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: unknown
    ) {
        super(message);
        this.name = 'S3Error';
    }
}

export class S3ConfigError extends S3Error {
    constructor(message: string, originalError?: unknown) {
        super(message, 'CONFIG_ERROR', originalError);
        this.name = 'S3ConfigError';
    }
}

export class S3PermissionError extends S3Error {
    constructor(message: string, originalError?: unknown) {
        super(message, 'PERMISSION_ERROR', originalError);
        this.name = 'S3PermissionError';
    }
}

export class S3NetworkError extends S3Error {
    constructor(message: string, originalError?: unknown) {
        super(message, 'NETWORK_ERROR', originalError);
        this.name = 'S3NetworkError';
    }
}

export class S3ValidationError extends S3Error {
    constructor(message: string, originalError?: unknown) {
        super(message, 'VALIDATION_ERROR', originalError);
        this.name = 'S3ValidationError';
    }
}

/**
 * Converts AWS SDK errors to user-friendly S3Error instances
 */
export function handleS3Error(error: unknown, operation: string): S3Error {
    if (error instanceof S3Error) {
        return error;
    }

    const awsError = error as any;
    const errorCode = awsError?.code || awsError?.name || 'UNKNOWN_ERROR';
    const errorMessage = awsError?.message || 'An unknown error occurred';

    // Map AWS error codes to user-friendly messages
    const errorMap: Record<string, string> = {
        'NoSuchBucket': `Bucket not found. Please check your bucket name in settings.`,
        'AccessDenied': `Access denied. Please check your S3 credentials and permissions.`,
        'InvalidAccessKeyId': `Invalid access key. Please check your S3 credentials in settings.`,
        'SignatureDoesNotMatch': `Invalid secret key. Please check your S3 credentials in settings.`,
        'InvalidBucketName': `Invalid bucket name. Please check your bucket configuration.`,
        'BucketAlreadyOwnedByYou': `Bucket already exists and is owned by you.`,
        'BucketAlreadyExists': `Bucket name is already taken. Please choose a different name.`,
        'NetworkError': `Network error. Please check your internet connection and try again.`,
        'TimeoutError': `Request timed out. Please try again.`,
        'ECONNREFUSED': `Connection refused. Please check your S3 endpoint configuration.`,
        'ENOTFOUND': `Endpoint not found. Please check your S3 endpoint URL.`,
    };

    const userMessage = errorMap[errorCode] || `${operation} failed: ${errorMessage}`;

    // Categorize errors
    if (errorCode.includes('Access') || errorCode.includes('Permission') || errorCode.includes('Denied')) {
        return new S3PermissionError(userMessage, error);
    }

    if (errorCode.includes('Network') || errorCode.includes('Timeout') || errorCode.includes('ECONN') || errorCode.includes('ENOTFOUND')) {
        return new S3NetworkError(userMessage, error);
    }

    if (errorCode.includes('Invalid') || errorCode.includes('Validation')) {
        return new S3ValidationError(userMessage, error);
    }

    return new S3Error(userMessage, errorCode, error);
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
    if (error instanceof S3NetworkError) {
        return true;
    }

    const awsError = error as any;
    const errorCode = awsError?.code || awsError?.name || '';

    // Retryable AWS error codes
    const retryableCodes = [
        'NetworkError',
        'TimeoutError',
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ServiceUnavailable',
        'Throttling',
        'ThrottledException',
        'TooManyRequestsException',
        'RequestTimeout',
    ];

    return retryableCodes.some(code => errorCode.includes(code));
}

