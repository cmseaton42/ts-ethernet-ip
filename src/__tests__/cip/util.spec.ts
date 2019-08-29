import { generateEncodedTimeout } from '../../enip/cip/util';

describe('CIP Utility Functions', () => {
    describe('Timeout Encoding Utility', () => {
        it('Generates Appropriate Outputs', () => {
            const fn = (arg: number) => generateEncodedTimeout(arg);

            expect(fn(2304)).toMatchObject({ time_tick: 8, ticks: 9 });
            expect(fn(2400)).toMatchObject({ time_tick: 5, ticks: 75 });
            expect(fn(2000)).toMatchObject({ time_tick: 4, ticks: 125 });
            expect(() => fn(-1)).toThrow();
        });
    });
});
