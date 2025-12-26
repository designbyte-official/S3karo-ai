import { isRetryableError } from './errors';

export interface RetryOptions {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryable: isRetryableError,
};

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
    return Math.min(delay, options.maxDelay);
}

// Retry function with exponential backoff
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: unknown;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (!opts.retryable(error)) {
                throw error;
            }

            if (attempt === opts.maxRetries) {
                break;
            }

            const delay = calculateDelay(attempt, opts);
            await sleep(delay);
        }
    }

    throw lastError;
}

