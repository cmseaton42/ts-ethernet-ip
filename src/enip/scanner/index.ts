import { Socket, isIPv4 } from 'net';
import { encapsulation } from '../encapsulation';
import { EventEmitter } from 'events';
import { promiseTimeout } from '../../util';
import { lookup } from 'dns';

const DEFAULT_EIP_PORT = 44818;

export interface IConnStatus {
    establishing: boolean;
    established: boolean;
}

export interface ISessionStatus extends IConnStatus {
    id: null | number;
}

// For use with connected messaging
export interface IConnectedStatus extends ISessionStatus {
    seq_num: number;
}

export interface IEIPError {
    code: null | number;
    msg: null | string;
}

export interface ITimeouts {
    session: number;
    tcp: number;
}

type SocketWriteCallback = (err?: Error | undefined) => void;

export enum ScannerEvents {
    SESSION_REGISTERED = 'Session Registered',
    SESSION_REG_FAILED = 'Session Registration Failed',
    SESSION_UNREGISTERED = 'Session Unregistered',
    SEND_RR_DATA_RECEIVED = 'SendRRData Received',
    SEND_UNIT_DATA_RECEIVED = 'SendUnitData Received',
    UNKNOWN = 'Unhandled Encapsulated Command Received',
}

/**
 * Low Level Ethernet/IP Scanner
 */
export class Scanner extends EventEmitter {
    /***************************************************************************
     * Property Initializations
     ***************************************************************************/
    public readonly TCP: IConnStatus;
    public readonly session: ISessionStatus;
    public readonly connection: IConnectedStatus;
    public readonly error: IEIPError;
    public timeouts: ITimeouts;
    protected socket: Socket;

    /***************************************************************************
     * New Instance Constructor
     ***************************************************************************/
    constructor() {
        super();

        // Initialize local state
        this.socket = new Socket();
        this.TCP = {
            established: false,
            establishing: false,
        };

        this.session = {
            id: null,
            established: false,
            establishing: false,
        };

        this.connection = {
            id: null,
            seq_num: 0,
            established: false,
            establishing: false,
        };

        this.error = {
            code: null,
            msg: null,
        };

        this.timeouts = {
            session: 15000,
            tcp: 15000,
        };

        // Initialize Event Handlers for Underlying Socket Class
        this._initializeEventHandlers();
    }

    /***************************************************************************
     * Public Method Definitions
     ***************************************************************************/

    /**
     * Establish connection to target
     */
    public async connect(IP_ADDR: string): Promise<number> {
        // Check for valid DNS
        await this._DNSLookup(IP_ADDR);

        // Attempt to establish raw socket
        //  connection with target
        await this._connect(IP_ADDR);

        // Send EIP register session payload
        this.socket.write(encapsulation.registerSession());

        // Wait on response from target
        //  and attempt sessid extraction
        const sessid = await this._extractSessionID();

        // Clean Up Local Listeners
        this.socket.removeAllListeners('Session Registered');
        this.socket.removeAllListeners('Session Registration Failed');

        if (!sessid) throw new Error('Failed to receive sessid from target');
        this.session.id = sessid;

        // Return Session ID
        return sessid;
    }

    /**
     * Writes Ethernet/IP Data to Socket as an Unconnected Message
     * or a Transport Class 1 Datagram
     *
     * @param {buffer} data - Data Buffer to be Encapsulated
     * @param {number} [timeout=10] - Timeout (sec)
     */
    public write(
        data: Buffer,
        connected: boolean = false,
        timeout: number = 10,
        cb: SocketWriteCallback | null = null,
    ): void {
        const { sendRRData, sendUnitData } = encapsulation;
        const { session, connection } = this;

        if (!session.id || !session.established) {
            throw new Error('Must establish a connection before writing to target!');
        }

        if (connected) {
            if (connection.established) {
                connection.seq_num += 1;
            } else {
                throw new Error('Connected message request, but no connection established. Forgot forwardOpen?');
            }
        }

        const packet =
            connected && connection.id
                ? sendUnitData(session.id, data, connection.id, connection.seq_num)
                : sendRRData(session.id, data, timeout);

        if (cb) {
            this.socket.write(packet, 'utf8', cb);
        } else {
            this.socket.write(packet);
        }
    }

    /**
     * Sends Unregister Session Command and Destroys Underlying TCP Socket
     */
    public destroy(exception: any = null) {
        const { unregisterSession } = encapsulation;

        if (this.session.id) {
            this.write(unregisterSession(this.session.id), false, 10, () => {
                this.session.established = false;
                this.session.establishing = false;
                this.socket.destroy(exception);
            });
        } else {
            this.socket.destroy(exception);
        }

        this.TCP.established = false;
        this.TCP.establishing = false;
    }

    /***************************************************************************
     * Private and Protected Method Definitions
     ***************************************************************************/

    /**
     * Perform DNS Lookup on Passed IP Addr
     */
    protected _DNSLookup(IP_ADDR: string): Promise<undefined> {
        return new Promise<undefined>(resolve => {
            lookup(IP_ADDR, (err, addr) => {
                if (err) throw new Error('DNS Lookup failed for IP_ADDR ' + IP_ADDR);

                if (!isIPv4(addr)) {
                    throw new Error('Invalid IP_ADDR <string> passed to Controller <class>');
                }

                resolve();
            });
        });
    }

    /**
     * Establish raw socket connection to target
     */
    protected _connect(IP_ADDR: string): Promise<undefined> {
        // Begin attempt to connect to EIP Device
        this.TCP.establishing = true;

        const connectErr = new Error('TIMEOUT occurred while attempting to establish TCP connection with Controller.');

        // Atempt to connect to generic TCP/IP Socket
        const connectPromise = new Promise<undefined>(resolve => {
            this.socket.connect(DEFAULT_EIP_PORT, IP_ADDR, () => {
                this.TCP.establishing = false;
                this.TCP.established = true;

                resolve();
            });
        });

        // Handle a timeout event on failed connection
        //   or connection taking too long
        const handleTimeout = (reject: (err: Error) => void) => {
            this.TCP.establishing = false;
            this._setError(0x9999, 'TIMEOUT: Establishing TCP/IP connection to host');

            reject(connectErr);
        };

        // Connect to Controller and Then Send Register Session Packet
        return promiseTimeout<undefined>(connectPromise, this.timeouts.tcp, handleTimeout);
    }

    /**
     * Extract session ID from target if possible
     */
    protected _extractSessionID(): Promise<null | number> {
        // Begin attempt to establish session EIP device
        this.session.establishing = true;

        const sessionErr = new Error(
            'TIMEOUT occurred while attempting to establish Ethernet/IP session with Controller.',
        );

        // Atempt to establish session
        const sessionPromise = new Promise<null | number>((resolve, reject) => {
            this.on('Session Registered', sessid => {
                this.session.establishing = false;
                this.session.established = true;
                resolve(sessid);
            });

            this.on('Session Registration Failed', errorCode => {
                this.session.establishing = false;
                this.session.established = false;
                this._setError(errorCode, 'Failed to register new EIP session');
                reject(new Error('Failed to register new EIP session'));
            });
        });

        // Handle a timeout event on failed connection
        //   or connection taking too long
        const handleTimeout = (reject: (err: Error) => void) => {
            this.session.establishing = false;
            this._setError(0x9999, 'TIMEOUT: Establishing EIP session connection to host');

            reject(sessionErr);
        };

        // Wait for Session to be Registered
        return promiseTimeout<null | number>(sessionPromise, this.timeouts.session, handleTimeout);
    }

    /**
     * Set internal error code and message
     */
    protected _setError(code: number | null, msg: string | null): void {
        this.error.code = code;
        this.error.msg = msg;
    }

    /**
     * Clear internal error code and message
     */
    protected _clearError(): void {
        this.error.code = null;
        this.error.msg = null;
    }

    /**
     * Initialize local socket event handlers
     */
    protected _initializeEventHandlers() {
        this.socket.on('data', this._handleDataEvent.bind(this));
        this.socket.on('close', this._handleCloseEvent.bind(this));
    }

    /**
     * Socket.on('data) Event Handler
     *
     * @param {Buffer} - Data Received from Socket.on('data', ...)
     */
    protected _handleDataEvent(data: Buffer) {
        const { Header, CPF, Commands } = encapsulation;

        const encapsulatedData = Header.parse(data);
        const { statusCode, status, commandCode, data: dataBuf, session, length } = encapsulatedData;

        if (statusCode !== 0) {
            this._setError(statusCode, status);
            this.emit(ScannerEvents.SESSION_REG_FAILED, this.error);
        } else {
            this._clearError();

            switch (commandCode) {
                case Commands.REGISTER_SESSION:
                    this.emit(ScannerEvents.SESSION_REGISTERED, session);
                    break;
                case Commands.UNREGISTER_SESSION:
                    this.emit(ScannerEvents.SESSION_UNREGISTERED);
                    break;
                case Commands.SEND_RR_DATA: {
                    const buf1 = Buffer.alloc(length - 6); // length of Data - Interface Handle <UDINT> and Timeout <UINT>
                    dataBuf.copy(buf1, 0, 6);

                    const srrd = CPF.parse(buf1);
                    this.emit(ScannerEvents.SEND_RR_DATA_RECEIVED, srrd);
                    break;
                }
                case Commands.SEND_UNIT_DATA: {
                    const buf2 = Buffer.alloc(length - 6); // length of Data - Interface Handle <UDINT> and Timeout <UINT>
                    dataBuf.copy(buf2, 0, 6);

                    const sud = CPF.parse(buf2);
                    this.emit(ScannerEvents.SEND_UNIT_DATA_RECEIVED, sud);
                    break;
                }
                default:
                    this.emit(ScannerEvents.UNKNOWN, encapsulatedData);
            }
        }
    }

    /**
     * Socket.on('close',...) Event Handler
     */
    protected _handleCloseEvent(hadError: boolean) {
        this.session.established = false;
        this.TCP.established = false;
        if (hadError) throw new Error('Socket Transmission Failure Occurred!');
    }
}
