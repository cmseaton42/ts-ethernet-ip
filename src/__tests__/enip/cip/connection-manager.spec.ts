import {
    ConnectionManager,
    ConnectionType,
    Owner,
    Priority,
    FixedVar,
    TimeoutMultiplier,
} from '../../../enip/cip/connection-manager';

describe('Connection Manager', () => {
    describe('Build Forward Open Method', () => {
        it('Produces appropriate output', () => {
            const test1 = ConnectionManager.buildForwardOpen();
            expect(test1).toMatchSnapshot();
        });

        it('Throws with Bad Input', () => {
            const fn = (
                RPI: number = 10000,
                netConnParams: number = 0x43f4, // Determined for most EIP connections
                timeOutMs: number = 2000,
                timeOutMult: TimeoutMultiplier = TimeoutMultiplier.x32,
            ): Function => (): void => {
                ConnectionManager.buildForwardOpen(RPI, netConnParams, timeOutMs, timeOutMult);
            };

            expect(fn()).not.toThrow();
            expect(fn(100)).toThrow();
            expect(fn(10000, 0x43f4, 999)).toThrow();
            expect(fn(10000, 0x43f4, 1000)).not.toThrow();
            expect(fn(10000, 0x43f4, 1000, 100)).toThrow();
            expect(fn(10000, 0x43f4, 1000, 7)).not.toThrow();
        });
    });

    describe('Build Forward Close Method', () => {
        it('Produces appropriate output', () => {
            const test1 = ConnectionManager.buildForwardClose();
            expect(test1).toMatchSnapshot();
        });

        it('Throws with Bad Input', () => {
            const fn = (
                connSerialNum: number = 0x4543, // TODO: Make this unique
                timeOutMs: number = 2000,
            ): Function => (): void => {
                ConnectionManager.buildForwardClose();
                ConnectionManager.buildForwardClose(connSerialNum, timeOutMs);
            };

            expect(fn()).not.toThrow();
            expect(fn(0x4543, 999)).toThrow();
            expect(fn(0x4543, 1000)).not.toThrow();
        });
    });

    describe('Build Connection Params Method', () => {
        it('Produces appropriate output', () => {
            const test1 = ConnectionManager.buildConnParameters(
                Owner.EXCLUSIVE,
                ConnectionType.POINT_TO_POINT,
                Priority.LOW,
                FixedVar.VARIABLE,
                500,
            );

            expect(test1).toEqual(0x43f4);
        });

        it('Throws with Bad Input', () => {
            const fn = (
                owner: Owner = Owner.EXCLUSIVE,
                type: ConnectionType = ConnectionType.POINT_TO_POINT,
                priority: Priority = Priority.LOW,
                fixedVar: FixedVar = FixedVar.VARIABLE,
                size: number = 500,
            ): Function => (): void => {
                ConnectionManager.buildConnParameters(owner, type, priority, fixedVar, size);
            };

            expect(fn()).not.toThrow();
            expect(fn(2)).toThrow();
            expect(fn(1, 4)).toThrow();
            expect(fn(1, 3, 4)).toThrow();
            expect(fn(1, 3, 3, 2)).toThrow();
            expect(fn(1, 3, 3, 1, 1)).toThrow();
            expect(fn(1, 3, 3, 1, 10001)).toThrow();
            expect(fn(1, 3, 3, 1, 10000)).not.toThrow();
        });
    });
});
