import { callbackify } from 'util';

const err = new Error('ASYNC Function Call Timed Out!!!');

/**
 * Wraps a Promise with a Timeout
 */
export function promiseTimeout<T>(
    promise: Promise<T>,
    ms: number,
    callback: (reject: (err: Error) => void) => void,
): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => callback(reject), ms);
        promise.then(resolve).catch(reject);
    });
}

/**
 * Delays X ms
 */
export const delay = (ms: number): Promise<undefined> => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { promiseTimeout, delay };
