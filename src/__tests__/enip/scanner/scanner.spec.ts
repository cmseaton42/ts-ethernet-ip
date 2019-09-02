import { Scanner } from '../../../enip/scanner';

jest.mock('net');

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

                this.socket.write = jest.fn();
                this.session.id = opts.sessid || null;
                this.session.established = opts.established || false;
                this.connection.established = opts.connEst || false;
                this.connection.id = opts.connId || 0x1337;
            }
        }

        it('Throws with no session ID', () => {
            const test = new WriteTester();

            expect(() => test.write(Buffer.from('test'))).toThrow();
        });
    });
});
