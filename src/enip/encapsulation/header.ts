import { CPF } from './common-packet-format';

/**
 * Parses Encapulation Status Code to Human Readable Error Message.
 */
export const parseStatus = (status: number): string => {
    switch (status) {
        case 0x00:
            return 'SUCCESS';
        case 0x01:
            return 'FAIL: Sender issued an invalid ecapsulation command.';
        case 0x02:
            return 'FAIL: Insufficient memory resources to handle command.';
        case 0x03:
            return 'FAIL: Poorly formed or incorrect data in encapsulation packet.';
        case 0x64:
            return 'FAIL: Originator used an invalid session handle.';
        case 0x65:
            return 'FAIL: Target received a message of invalid length.';
        case 0x69:
            return 'FAIL: Unsupported encapsulation protocol revision.';
        default:
            return `FAIL: General failure - Error: <${status}> occured.`;
    }
};

export enum Commands {
    NOP = 0x00,
    LIST_SERVICES = 0x04,
    LIST_IDENTITY = 0x63,
    LIST_INTERFACES = 0x64,
    REGISTER_SESSION = 0x65, // Begin Session Command
    UNREGISTER_SESSION = 0x66, // Close Session Command
    SEND_RR_DATA = 0x6f, // Send Unconnected Data Command
    SEND_UNIT_DATA = 0x70, // Send Connnected Data Command
    INDICATE_STATUS = 0x72,
    CANCEL = 0x73,
}

export interface IEncapsulationData {
    commandCode: number;
    command: string;
    length: number;
    session: number;
    statusCode: number;
    status: string;
    options: number;
    data: Buffer | null;
}

export abstract class Header {
    /**
     * Builds an ENIP Encapsolated Packet
     */
    public static build(cmd: Commands, session: number = 0x00, data: Buffer = Buffer.from([])): Buffer {
        const isValidCmd = cmd in Commands;
        if (!isValidCmd) throw new Error('Invalid EIP Encapsulation Command Received!');

        const buf = Buffer.from(data);
        const send = {
            cmd,
            length: buf.length,
            session,
            status: 0x00,
            context: Buffer.alloc(8, 0x00),
            options: 0x00,
            data: buf,
        };

        // Initialize header buffer to appropriate length
        const header = Buffer.alloc(24 + send.length);

        // Build header from encapsulation data
        header.writeUInt16LE(send.cmd, 0);
        header.writeUInt16LE(send.length, 2);
        header.writeUInt32LE(send.session, 4);
        header.writeUInt32LE(send.status, 8);
        send.context.copy(header, 12);
        header.writeUInt32LE(send.options, 20);
        send.data.copy(header, 24);

        return header;
    }

    /**
     * Parses an Encapsulated Packet Received from ENIP Target
     */
    public static parse(buf: Buffer): IEncapsulationData {
        const commandCode = buf.readUInt16LE(0);
        const statusCode = buf.readUInt32LE(8);

        const received: IEncapsulationData = {
            commandCode,
            command: Commands[commandCode],
            length: buf.readUInt16LE(2),
            session: buf.readUInt32LE(4),
            statusCode,
            status: parseStatus(statusCode),
            options: buf.readUInt32LE(20),
            data: null,
        };

        // Get Returned Encapsulated Data
        const dataBuffer = Buffer.alloc(received.length);
        buf.copy(dataBuffer, 0, 24);

        received.data = dataBuffer;

        return received;
    }
}
