import { Scanner } from '../../../enip/scanner';

describe('Generic EIP scanner', () => {
    describe('Connect method', () => {
        it('Returns sessid on success', () => {
            class ScannerTester extends Scanner {
                constructor() {
                    super();

                    this.socket.write = jest.fn();
                    this.socket.removeAllListeners = jest.fn();
                }
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

            const test = new ScannerTester();
            expect(test.connect('192.168.1.1')).resolves.toBe(0x1337);
        });
    });
});
