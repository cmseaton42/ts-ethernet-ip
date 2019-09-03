import { promiseTimeout, delay } from '../../util';

describe('Utilites', () => {
    describe('Promise Timeout Utility', () => {
        it('Resolves and Rejects as Expected', async () => {
            const fn = (ms: number, arg: any = null) => {
                const testPromise = new Promise<undefined>(resolve => {
                    setTimeout(() => {
                        if (arg) resolve(arg);
                        resolve();
                    }, ms);
                });

                const handleTimeout = (reject: Function) => {
                    reject(new Error('test timeout'));
                };

                return promiseTimeout<undefined>(testPromise, 100, handleTimeout);
            };

            await expect(fn(200)).rejects.toThrow();
            await expect(fn(110)).rejects.toThrow();
            await expect(fn(90)).resolves.toBeUndefined();
            await expect(fn(50)).resolves.toBeUndefined();
            await expect(fn(50, 'hello')).resolves.toBe('hello');
            await expect(fn(50, { a: 5, b: 6 })).resolves.toMatchObject({ a: 5, b: 6 });
        });
    });

    describe('Delay Utility', () => {
        it('Resolves and Rejects as Expected', async () => {
            const fn = (ms: number) => {
                return promiseTimeout<undefined>(
                    new Promise(async resolve => {
                        await delay(ms);
                        resolve();
                    }),
                    100,
                    reject => reject(new Error('Error')),
                );
            };

            const fnNoErr = (ms: number) => {
                return promiseTimeout<undefined>(
                    new Promise(async resolve => {
                        await delay(ms);
                        resolve();
                    }),
                    100,
                    reject => reject(new Error('Error')),
                );
            };

            await expect(fn(200)).rejects.toThrow();
            await expect(fn(110)).rejects.toThrow();
            await expect(fnNoErr(110)).rejects.toThrow();
            await expect(fn(90)).resolves.toBeUndefined();
            await expect(fn(50)).resolves.toBeUndefined();
        });
    });
});
