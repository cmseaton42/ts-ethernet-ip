import { Scanner } from '../../../enip/scanner';
import { sendUnitData, sendRRData } from '../../../enip/encapsulation/util';

jest.mock('net');
jest.mock('../../../enip/encapsulation/util');

describe('Generic EIP scanner', () => {
    describe('Connect method', () => {
        class ConnectTester extends Scanner {
            // Fake methods to be successful
            _DNSLookup(IP_ADDR: string): Promise<undefined> {
                return new Promise(resolve => resolve());
            }

            _connect(IP_ADDR: string): Promise<undefined> {
                return new Promise(resolve => resolve());
            }

            _extractSessionID(): Promise<number> {
                return new Promise(resolve => resolve(0x1337));
            }
        }

        it('Returns sessid on success', () => {
            const test = new ConnectTester();
            expect(test.connect('192.168.1.1')).resolves.toBe(0x1337);
        });
    });

    describe('Write method', () => {
        interface ITestDefaults {
            sessid?: number | null;
            established?: boolean;
            connEst?: boolean;
            connId?: number;
        }

        class WriteTester extends Scanner {
            constructor(opts: ITestDefaults = {}) {
                super();

                this.session.id = opts.sessid || null;
                this.session.established = opts.established || false;
                this.connection.established = opts.connEst || false;
                this.connection.id = opts.connId || 0x1337;
            }
        }

        it('Throws with no session ID', () => {
            const test = new WriteTester({ established: true });

            expect(() => test.write(Buffer.from('test'))).toThrow();
        });

        it('Throws when not established', () => {
            const test = new WriteTester({ sessid: 0x1337 });

            expect(() => test.write(Buffer.from('test'))).toThrow();
        });

        it('When connected and connection established, increment seq_num', () => {
            const test = new WriteTester({ established: true, sessid: 0x1337, connEst: true });

            test.write(Buffer.from('test'), true);
            expect(test.connection.seq_num).toEqual(1);
            test.write(Buffer.from('test'), true);
            expect(test.connection.seq_num).toEqual(2);
        });

        it('When connected and not connection established, throws error', () => {
            const test = new WriteTester({ established: true, sessid: 0x1337 });

            expect(() => test.write(Buffer.from('test'), true)).toThrow();
        });

        it('When connected and connection id, sendUnitData is called', () => {
            jest.resetAllMocks();
            const test = new WriteTester({ established: true, sessid: 0x1337, connEst: true });

            test.write(Buffer.from('test'), true);
            expect(sendUnitData).toHaveBeenCalled();
            expect(sendRRData).not.toHaveBeenCalled();
        });

        it('When connected and connection id, sendRRData is called', () => {
            jest.resetAllMocks();
            const test = new WriteTester({ established: true, sessid: 0x1337, connEst: true });

            test.write(Buffer.from('test'));
            expect(sendRRData).toHaveBeenCalled();
            expect(sendUnitData).not.toHaveBeenCalled();
        });

        it('Socket write method is called with correct arguments with callback', () => {
            const test = new WriteTester({ established: true, sessid: 0x1337, connEst: true });
            const cb = jest.fn();

            jest.resetAllMocks();
            test.write(Buffer.from('test'), false, 50, cb);
            expect(test['socket'].write).toHaveBeenCalled();
            expect(test['socket'].write).toHaveBeenCalledWith(undefined, 'utf8', cb);
            expect(test['socket'].write).not.toHaveBeenCalledWith(undefined);

            jest.resetAllMocks();
            test.write(Buffer.from('test'));
            expect(test['socket'].write).toHaveBeenCalled();
            expect(test['socket'].write).toHaveBeenCalledWith(undefined);
            expect(test['socket'].write).not.toHaveBeenCalledWith(undefined, 'utf8', cb);
        });
    });
});
