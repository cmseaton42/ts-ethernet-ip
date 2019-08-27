import { CPF, ItemID, IDataItems } from '../../enip/encapsulation/common-packet-format';

describe('Common Packet Format', () => {
    let empty: Buffer;
    let hwBuf: Buffer;
    let testBuf: Buffer;
    let test1: IDataItems[];
    let test2: IDataItems[];
    let test3: IDataItems[];

    beforeAll(() => {
        empty = Buffer.from([]);
        hwBuf = Buffer.from('hello world');
        testBuf = Buffer.from('This is a test');

        test1 = [{ TypeID: ItemID.NULL, data: empty }, { TypeID: ItemID.UCMM, data: hwBuf }];

        test2 = [
            { TypeID: ItemID.NULL, data: empty },
            { TypeID: ItemID.UCMM, data: hwBuf },
            { TypeID: ItemID.CONNECTION_BASED, data: testBuf },
        ];

        test3 = [
            { TypeID: ItemID.NULL, data: empty },
            { TypeID: ItemID.UCMM, data: hwBuf },
            { TypeID: 0xa4, data: testBuf }, // Invalid Type ID
        ];
    });

    it('Build method generates correct output', () => {
        expect(() => CPF.build(test3)).toThrow();
        expect(CPF.build(test1)).toMatchSnapshot();
        expect(CPF.build(test2)).toMatchSnapshot();
    });

    it('Parse method generates appropriate output', () => {
        expect(CPF.parse(CPF.build(test1))).toMatchSnapshot();
        expect(CPF.parse(CPF.build(test2))).toMatchSnapshot();
    });
});
