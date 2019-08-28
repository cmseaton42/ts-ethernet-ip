import { Commands, Header, parseStatus } from '../../enip/encapsulation/header';

describe('Encapsulation Header', () => {
    describe('Encapsulation Status Parser', () => {
        it("Returns Proper Human Readable String", () => {
            expect(parseStatus(0)).toEqual("SUCCESS");
            expect(parseStatus(0x01)).toEqual(expect.stringContaining("FAIL"));
            expect(parseStatus(0x02)).toEqual(expect.stringContaining("FAIL"));
            expect(parseStatus(0x03)).toEqual(expect.stringContaining("FAIL"));
            expect(parseStatus(0x04)).toEqual(expect.stringContaining("FAIL"));
            expect(parseStatus(0x64)).toEqual(expect.stringContaining("FAIL"));
            expect(parseStatus(0x65)).toEqual(expect.stringContaining("FAIL"));
            expect(parseStatus(0x69)).toEqual(expect.stringContaining("FAIL"));
            expect(parseStatus(1)).toEqual(expect.stringContaining("FAIL"));
            expect(parseStatus(0x45)).toEqual(expect.stringContaining("FAIL"));
        });
    });

    describe('Header Utility', () => {
        it("Generates encapsulation buffer", () => {
            const test1 = Header.build(Commands.REGISTER_SESSION, 0x00, Buffer.from([0x01, 0x00, 0x00, 0x00]));
            const test2 = Header.build(Commands.UNREGISTER_SESSION);

            expect(test1).toMatchSnapshot();
            expect(test2).toMatchSnapshot();
        });

        it('Throws with bad command when building', () => {
            const test = () => Header.build(0x69, 0x00, Buffer.from([0x01, 0x00, 0x00, 0x00])); // Invalid Command
            expect(test).toThrow();
        })

        it('Parses received encapsulation buffer', () => {
            const raw = Header.build(Commands.SEND_RR_DATA, 98705, Buffer.from([0x01, 0x00, 0x00, 0x00]));
            const test = Header.parse(raw);

            expect(test).toMatchSnapshot();
        })
    })
});