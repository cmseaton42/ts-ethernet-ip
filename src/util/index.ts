const err = new Error('ASYNC Function Call Timed Out!!!');

/**
 * Wraps a Promise with a Timeout
 */
function promiseTimeout<T>(promise: Promise<T>, ms: number, error: Error = err): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject(error), ms);
        promise.then(resolve).catch(reject);
    });
}

/**
 * Delays X ms
 */
const delay = (ms: number): Promise<undefined> => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { promiseTimeout, delay };
