import { Header, Commands } from './header';
import { CPF, TypeIDs } from './common-packet-format';

/**
 * Returns a Register Session Request String
 */
export const registerSession = (): Buffer => {
    const cmdBuf = Buffer.alloc(4);
    cmdBuf.writeUInt16LE(0x01, 0); // Protocol Version (Required to be 1)
    cmdBuf.writeUInt16LE(0x00, 2); // Opton Flags (Reserved for Future List)

    // Build Register Session Buffer and return it
    return Header.build(Commands.REGISTER_SESSION, 0x00, cmdBuf);
};

/**
 * Returns an Unregister Session Request String
 *
 * @param {number} session - Encapsulation Session ID
 * @returns {string} unregister seeion strings
 */
export const unregisterSession = (session: number): Buffer => {
    // Build Unregister Session Buffer
    return Header.build(Commands.UNREGISTER_SESSION, session);
};

/**
 * Returns a UCMM Encapsulated Packet String
 *
 * @param {number} [timeout=10] - Timeout (sec)
 */
export const sendRRData = (session: number, data: Buffer, timeout: number = 10) => {
    const timeoutBuf = Buffer.alloc(6);
    timeoutBuf.writeUInt32LE(0x00, 0); // Interface Handle ID (Shall be 0 for CIP)
    timeoutBuf.writeUInt16LE(timeout, 4); // Timeout (sec)

    // Enclose in Common Packet Format
    let buf = CPF.build([{ TypeID: TypeIDs.NULL, data: Buffer.from([]) }, { TypeID: TypeIDs.UCMM, data }]);

    // Join Timeout Data with buffer
    buf = Buffer.concat([timeoutBuf, buf]);

    // Build SendRRData Buffer
    return Header.build(Commands.SEND_RR_DATA, session, buf);
};

/**
 * Returns a Connected Message Datagram (Transport Class 3) String
 *
 * @param {number} ConnectionID - Connection ID from FWD_OPEN
 * @param {number} SequenceNumber - Sequence Number of Datagram
 */
export const sendUnitData = (session: number, data: Buffer, ConnectionID: number, SequnceNumber: number): Buffer => {
    const timeoutBuf = Buffer.alloc(6);
    timeoutBuf.writeUInt32LE(0x00, 0); // Interface Handle ID (Shall be 0 for CIP)
    timeoutBuf.writeUInt16LE(0x00, 4); // Timeout (sec) (Shall be 0 for Connected Messages)

    // Enclose in Common Packet Format
    const seqAddrBuf = Buffer.alloc(4);
    seqAddrBuf.writeUInt32LE(ConnectionID, 0);
    const seqNumberBuf = Buffer.alloc(2);
    seqNumberBuf.writeUInt16LE(SequnceNumber, 0);
    const ndata = Buffer.concat([seqNumberBuf, data]);

    let buf = CPF.build([
        {
            TypeID: TypeIDs.CONNECTION_BASED,
            data: seqAddrBuf,
        },
        {
            TypeID: TypeIDs.CONNECTED_TRANSPORT_PACKET,
            data: ndata,
        },
    ]);

    // Join Timeout Data with
    buf = Buffer.concat([timeoutBuf, buf]);

    // Build SendRRData Buffer
    return Header.build(Commands.SEND_UNIT_DATA, session, buf);
};

/**
 * Returns a Connected Message Datagram (Transport Class 3) Buffer
 *  -> Code Provided by GitHub@Penlane
 */
export const listIdentity = (): Buffer => {
    // Build ListIdentity Buffer
    return Header.build(Commands.LIST_IDENTITY, 0x00);
};

/**
 * Returns a ListServices Buffer
 *  -> Code Provided by GitHub@Penlane
 */
export const listServices = (): Buffer => {
    // Build ListServices Buffer
    return Header.build(Commands.LIST_SERVICES, 0x00);
};
