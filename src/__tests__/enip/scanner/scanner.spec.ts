import { Scanner } from '../../../enip/scanner';
import { sendUnitData, sendRRData } from '../../../enip/encapsulation/util';
import { encapsulation } from '../../../enip/encapsulation';

jest.useFakeTimers();

jest.mock('net');

jest.mock('dns', () => ({
    lookup: (hostname: string, callback: Function) => {
        hostname === 'bad.com' || hostname === 'good.com'
            ? hostname === 'bad.com'
                ? callback(null, '1337')
                : callback(null, '192.168.1.1')
            : callback('error');
    },
}));

jest.mock('../../../enip/encapsulation/util');

describe('Generic EIP scanner', () => {
    describe('Connect method', () => {
        class ConnectTester extends Scanner {
            sessid: number | null;
            constructor(id: null | number = 0x1337) {
                super();

                this.sessid = id;
            }

            // Fake methods to be successful
            _DNSLookup(IP_ADDR: string): Promise<undefined> {
                return new Promise(resolve => resolve());
            }

            _connect(IP_ADDR: string): Promise<undefined> {
                return new Promise(resolve => resolve());
            }

            _extractSessionID(): Promise<number | null> {
                return new Promise(resolve => resolve(this.sessid));
            }
        }

        it('Returns sessid on success', () => {
            const test = new ConnectTester();
            return expect(test.connect('192.168.1.1')).resolves.toBe(0x1337);
        });

        it('Throws on null sessid', () => {
            const test = new ConnectTester(null);
            return expect(test.connect('192.168.1.1')).rejects.toThrow();
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

    describe('Destroy method', () => {
        type SocketWriteCallback = (err?: Error | undefined) => void;

        interface ITestDefaults {
            sessid?: number | null;
            fn?: (data: Buffer, connected?: boolean, timeout?: number, cb?: SocketWriteCallback) => void;
        }

        class DestroyScanner extends Scanner {
            constructor(opts: ITestDefaults = {}) {
                super();

                this.session.id = opts.sessid || null;
                this.write = (opts.fn && opts.fn.bind(this)) || jest.fn();
            }
        }

        beforeEach(() => {
            jest.resetAllMocks();
        });

        it('When session id valid, verify write method call', () => {
            const test = new DestroyScanner({ sessid: 0x1337 });

            test.destroy();
            expect(test.write).toHaveBeenCalled();
        });

        it('When session id valid, verify write method manipulates local state', () => {
            const test = new DestroyScanner({ sessid: 0x1337 });

            test.destroy();
            expect(test.session.established).toBeFalsy();
            expect(test.session.establishing).toBeFalsy();
            expect(test.TCP.establishing).toBeFalsy();
            expect(test.TCP.establishing).toBeFalsy();
        });

        it('When session id valid, verify write method manipulates local state', () => {
            function fn(data: Buffer, connected?: boolean, timeout?: number, cb?: SocketWriteCallback) {
                if (cb) cb();
            }

            const test = new DestroyScanner({ sessid: 0x1337, fn });

            test.destroy();
            expect(test['socket'].destroy).toHaveBeenCalled();
        });

        it('When session id invalid, verify write method call', () => {
            const test = new DestroyScanner();

            test.destroy();
            expect(test.write).not.toHaveBeenCalled();
            expect(test['socket'].destroy).toHaveBeenCalled();
        });
    });

    describe('_DNSLookup Method', () => {
        it('Throws on bad DNS', () => {
            const test = new Scanner();

            expect(test['_DNSLookup']('bad-dns.com')).rejects.toThrow();
        });

        it('Throws on bad IP', () => {
            const test = new Scanner();

            expect(test['_DNSLookup']('bad.com')).rejects.toThrow();
        });

        // it('Resolves on good DNS', () => {
        //     const test = new Scanner();

        //     expect(test['_DNSLookup']('good.com')).resolves.toBeUndefined();
        // });
    });

    describe('_connect Method', () => {
        it('Starts timeout', () => {
            const test = new Scanner();
            jest.resetAllMocks();

            test['_connect']('192.168.1.1');

            expect(setTimeout).toHaveBeenCalled();
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), test.timeouts.tcp);
        });
    });

    describe('_setError Method', () => {
        it('Sets error code and message', () => {
            const test = new Scanner();
            test['_setError'](0x1337, 'This is an error');

            expect(test.error).toEqual({ code: 0x1337, msg: 'This is an error' });
        });
    });

    describe('_clearError Method', () => {
        it('Clears error code and message', () => {
            const test = new Scanner();
            test['_setError'](0x1337, 'This is an error');
            expect(test.error).toEqual({ code: 0x1337, msg: 'This is an error' });

            test['_clearError']();
            expect(test.error).toEqual({ code: null, msg: null });
        });
    });

    describe('_extractSessionID Method', () => {
        it('Starts timeout', () => {
            const test = new Scanner();
            jest.resetAllMocks();

            test['_extractSessionID']();

            expect(setTimeout).toHaveBeenCalled();
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), test.timeouts.session);
        });

        it('Throws on failed session registration', async () => {
            const test = new Scanner();
            const promise = test['_extractSessionID']();

            test.emit('Session Registration Failed', 0x1337);

            await expect(promise).rejects.toThrow();
            expect(test.error).toEqual({ code: 0x1337, msg: 'Failed to register new EIP session' });
        });

        it('Resolves on success session registration', async () => {
            const test = new Scanner();
            const promise = test['_extractSessionID']();

            test.emit('Session Registered', 0x1337);

            await expect(promise).resolves.toEqual(0x1337);
        });
    });

    describe('_handleDataEvent Method', () => {
        class HandleScanner extends Scanner {
            constructor() {
                super();

                this.emit = jest.fn();
            }
        }
        const { Header, Commands, CPF, TypeIDs } = encapsulation;
        let test: HandleScanner;

        beforeEach(() => {
            jest.resetAllMocks();
            test = new HandleScanner();
        });

        it('Sets error on bad response', () => {
            const arg = Header.build(Commands.REGISTER_SESSION, 0x1337, Buffer.from('test'));

            // Force error code
            arg.writeUInt32LE(0x0001, 8);

            test['_handleDataEvent'](arg);

            expect(test.emit).toBeCalledTimes(1);
            expect(test.emit).toBeCalledWith('Session Registration Failed', {
                code: 0x0001,
                msg: 'FAIL: Sender issued an invalid ecapsulation command.',
            });
        });

        it('Handles header response <REGISTER_SESSION>', () => {
            const arg = Header.build(Commands.REGISTER_SESSION, 0x1337, Buffer.from('test'));

            test['_handleDataEvent'](arg);

            expect(test.emit).toBeCalledTimes(1);
            expect(test.emit).toBeCalledWith('Session Registered', 0x1337);
        });

        it('Handles header response <UNREGISTER_SESSION>', () => {
            const arg = Header.build(Commands.UNREGISTER_SESSION, 0x1337, Buffer.from('test'));

            test['_handleDataEvent'](arg);

            expect(test.emit).toBeCalledTimes(1);
            expect(test.emit).toBeCalledWith('Session Unregistered');
        });

        it('Handles header response <SEND_RR_DATA>', () => {
            const cpf = CPF.build([{ TypeID: TypeIDs.NULL, data: Buffer.from([]) }]);

            const buf = Buffer.alloc(cpf.length + 6);
            cpf.copy(buf, 6, 0);

            const arg = Header.build(Commands.SEND_RR_DATA, 0x1337, buf);

            test['_handleDataEvent'](arg);

            expect(test.emit).toBeCalledTimes(1);
            expect(test.emit).toBeCalledWith('SendRRData Received', [{ TypeID: TypeIDs.NULL, data: Buffer.from([]) }]);
        });

        it('Handles header response <SEND_UNIT_DATA>', () => {
            const cpf = CPF.build([{ TypeID: TypeIDs.NULL, data: Buffer.from([]) }]);

            const buf = Buffer.alloc(cpf.length + 6);
            cpf.copy(buf, 6, 0);

            const arg = Header.build(Commands.SEND_UNIT_DATA, 0x1337, buf);

            test['_handleDataEvent'](arg);

            expect(test.emit).toBeCalledTimes(1);
            expect(test.emit).toBeCalledWith('SendUnitData Received', [
                { TypeID: TypeIDs.NULL, data: Buffer.from([]) },
            ]);
        });

        it('Handles header response <UNKOWN>', () => {
            const arg = Header.build(Commands.UNREGISTER_SESSION, 0x1337, Buffer.from('test'));

            // Change to bad command
            arg.writeUInt16LE(0x99, 0);

            test['_handleDataEvent'](arg);

            const encapsulated = {
                command: undefined,
                commandCode: 153,
                data: Buffer.from('test'),
                length: 4,
                options: 0,
                session: 0x1337,
                status: 'SUCCESS',
                statusCode: 0,
            };

            expect(test.emit).toBeCalledTimes(1);
            expect(test.emit).toBeCalledWith('Unhandled Encapsulated Command Received', encapsulated);
        });
    });

    describe('_handleCloseEvent Method', () => {
        it('Throws on error', () => {
            const test = new Scanner();

            test['session'].established = true;
            test['TCP'].established = true;
            expect(test.session.established).toBeTruthy();
            expect(test.TCP.established).toBeTruthy();

            expect(() => test['_handleCloseEvent'](true)).toThrow();
            expect(test.session.established).toBeFalsy();
            expect(test.TCP.established).toBeFalsy();
        });
    });
});
