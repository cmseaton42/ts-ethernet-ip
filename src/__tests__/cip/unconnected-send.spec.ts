import { build, generateEncodedTimeout } from '../../enip/cip/unconnected-send';
import { MessageRouter } from '../../enip/cip/message-router';
import { segments } from '../../enip/cip/epath/segments';
const { PORT } = segments;

describe('Unconnected Send Service', () => {
    describe('Timeout Encoding Utility', () => {
        it('Generates Appropriate Outputs', () => {
            const fn = (arg: number) => generateEncodedTimeout(arg);

            expect(fn(2304)).toMatchObject({ time_tick: 8, ticks: 9 });
            expect(fn(2400)).toMatchObject({ time_tick: 5, ticks: 75 });
            expect(fn(2000)).toMatchObject({ time_tick: 4, ticks: 125 });
            expect(() => fn(-1)).toThrow();
        });
    });

    describe('Message Build Utility', () => {
        it('Generates Appropriate Output', () => {
            const readTag_Path1 = Buffer.from('sometag');
            const readTag_Path2 = Buffer.from('sometag2');
            const readTag_Data = Buffer.alloc(2);
            readTag_Data.writeUInt16LE(1, 0);

            const MR1 = MessageRouter.build(0x4c, readTag_Path1, readTag_Data);
            const MR2 = Buffer.from('odd length!'); // odd length buffer

            let test1 = build(MR1, PORT.build(1, 5));
            expect(test1).toMatchSnapshot();

            let test2 = build(MR2, PORT.build(1, 5), 50);
            expect(test2).toMatchSnapshot();
        });
    });
});
