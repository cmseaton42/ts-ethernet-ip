import { promiseTimeout, delay } from '../../util';

describe('Utilites', () => {
    describe('Promise Timeout Utility', () => {
        it('Resolves and Rejects as Expected', async () => {
            const fn = (ms: number, arg: any = null) => {
                return promiseTimeout<undefined>(
                    new Promise(resolve => {
                        setTimeout(() => {
                            if (arg) resolve(arg);
                            resolve();
                        }, ms);
                    }),
                    100,
                    new Error('error'),
                );
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
                    new Error('error'),
                );
            };

            const fnNoErr = (ms: number) => {
                return promiseTimeout<undefined>(
                    new Promise(async resolve => {
                        await delay(ms);
                        resolve();
                    }),
                    100,
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
