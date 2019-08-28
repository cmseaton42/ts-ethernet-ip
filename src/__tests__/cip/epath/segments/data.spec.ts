import { build, symbolicBuild } from '../../../../enip/cip/epath/segments/data';

describe('EPATH', () => {
    describe('DATA Segment Build Utility', () => {
        it('Generates Appropriate Output', () => {
            let test = build('TotalCount');
            expect(test).toMatchSnapshot();

            test = build('SomeTag', false); // test symbolic build
            expect(test).toMatchSnapshot();

            test = build(0); // test element build
            expect(test).toMatchSnapshot();

            test = build(255); // test 8bit upper boundary
            expect(test).toMatchSnapshot();

            test = build(256); // test 16 bit lower boundary
            expect(test).toMatchSnapshot();

            test = build(257); // test 16 bit endian
            expect(test).toMatchSnapshot();

            test = build(65535); // test 16 bit upper boundary
            expect(test).toMatchSnapshot();

            test = build(65536); // test 32 bit lower boundary
            expect(test).toMatchSnapshot();

            test = build(65537); // test 32 bit endian
            expect(test).toMatchSnapshot();

            test = symbolicBuild('SomeTag'); // test symbolic build
            expect(test).toMatchSnapshot();
        });
    });
});
