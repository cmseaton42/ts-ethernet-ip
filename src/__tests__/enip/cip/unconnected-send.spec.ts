import { build } from '../../../enip/cip/unconnected-send';
import { MessageRouter } from '../../../enip/cip/message-router';
import { segments } from '../../../enip/cip/epath/segments';
const { PORT } = segments;

describe('Unconnected Send Service', () => {
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
