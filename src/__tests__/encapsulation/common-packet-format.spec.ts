import { CPF, TypeIDs, IDataItems } from '../../enip/encapsulation/common-packet-format';

describe('Common Packet Format Utility', () => {
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

        test1 = [{ TypeID: TypeIDs.NULL, data: empty }, { TypeID: TypeIDs.UCMM, data: hwBuf }];

        test2 = [
            { TypeID: TypeIDs.NULL, data: empty },
            { TypeID: TypeIDs.UCMM, data: hwBuf },
            { TypeID: TypeIDs.CONNECTION_BASED, data: testBuf },
        ];

        test3 = [
            { TypeID: TypeIDs.NULL, data: empty },
            { TypeID: TypeIDs.UCMM, data: hwBuf },
            { TypeID: 0xa4, data: testBuf }, // Invalid Type ID
        ];
    });

    it('Generates correct output', () => {
        expect(CPF.build(test1)).toMatchSnapshot();
        expect(CPF.build(test2)).toMatchSnapshot();
    });

    it('Throws with bad type id when building', () => {
        expect(() => CPF.build(test3)).toThrow();
    });

    it('Parses received CPF packet', () => {
        expect(CPF.parse(CPF.build(test1))).toMatchSnapshot();
        expect(CPF.parse(CPF.build(test2))).toMatchSnapshot();
    });
});
