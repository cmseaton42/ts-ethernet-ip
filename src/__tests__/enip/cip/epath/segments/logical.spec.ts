import { build, Types } from '../../../../enip/cip/epath/segments/logical';

describe('EPATH', () => {
    describe('LOGICAL Segment Build Utility', () => {
        it('Generates Appropriate Output', () => {
            let test = build(Types.CLASS_ID, 5, false);
            expect(test).toMatchSnapshot();

            test = build(Types.INSTANCE_ID, 2, false);
            expect(test).toMatchSnapshot();

            test = build(Types.ATTRIBUTE_ID, 1, false);
            expect(test).toMatchSnapshot();

            test = build(Types.INSTANCE_ID, 500, false);
            expect(test).toMatchSnapshot();

            test = build(Types.INSTANCE_ID, 500);
            expect(test).toMatchSnapshot();

            test = build(Types.ATTRIBUTE_ID, 1);
            expect(test).toMatchSnapshot();

            test = build(Types.INSTANCE_ID, 2);
            expect(test).toMatchSnapshot();

            test = build(Types.INSTANCE_ID, 70000, false);
            expect(test).toMatchSnapshot();

            test = build(Types.INSTANCE_ID, 70000);
            expect(test).toMatchSnapshot();
        });

        it('Throws with Bad Input', () => {
            const fn = (type: Types, addr: number) => {
                return () => {
                    build(type, addr);
                };
            };

            expect(fn(0, 5)).not.toThrow();
            expect(fn(-5, 5)).toThrow();
            expect(fn(1, 5)).toThrow();
            expect(fn(Types.ATTRIBUTE_ID, -1)).toThrow();
            expect(fn(Types.CLASS_ID, 5)).not.toThrow();
            expect(fn(Types.CLASS_ID, -1)).toThrow();
            expect(fn(Types.CLASS_ID, 0)).toThrow();
        });
    });
});
