export enum ItemID {
    NULL = 0x00,
    LIST_IDENTITY = 0x0c,
    CONNECTION_BASED = 0xa1,
    CONNECTED_TRANSPORT_PACKET = 0xb1,
    UCMM = 0xb2,
    LIST_SERVICES = 0x100,
    SOCKET_ADDR_O2T = 0x8000,
    SOCKET_ADDR_T2O = 0x8001,
    SEQUENCED_ADDR_ITEM = 0x8002
}

export interface IDataItems {
    TypeID: ItemID;
    data: Buffer;
}

export abstract class CPF {
    /**
    * Builds a Common Packet Formatted Buffer to be
    * Encapsulated.
    */
    public static build(dataItems: IDataItems[]): Buffer {
        // Write Item Count and Initialize Buffer
        let buf = Buffer.alloc(2);
        buf.writeUInt16LE(dataItems.length, 0);

        for (const item of dataItems) {
            const { TypeID, data } = item;

            // Check valid command id passed
            const isCmd = TypeID in ItemID;
            if (!isCmd) throw new Error("Invalid CPF Type ID!");

            const cpfHeader = Buffer.alloc(4);
            const dataBuf = Buffer.from(data);

            // Write type id to first UINT
            cpfHeader.writeUInt16LE(TypeID, 0);

            // Write data length to second UINT
            cpfHeader.writeUInt16LE(dataBuf.length, 2);

            // Build buffer by concatenating all data items in packet
            buf = dataBuf.length > 0 ? Buffer.concat([buf, cpfHeader, dataBuf]) : Buffer.concat([buf, cpfHeader]);
        }

        return buf;
    }

    /**
    * Parses Incoming Common Packet Formatted Buffer
    * and returns an Array of Objects.
    */
    public static parse(buf: Buffer): IDataItems[] {
        const itemCount = buf.readUInt16LE(0);
        const arr = [];

        let ptr = 2;

        for (let i = 0; i < itemCount; i++) {
            // Get Type ID
            const TypeID: ItemID = buf.readUInt16LE(ptr);
            ptr += 2;

            // Get Data Length
            const length = buf.readUInt16LE(ptr);
            ptr += 2;

            // Get Data from Data Buffer
            const data = Buffer.alloc(length);
            buf.copy(data, 0, ptr, ptr + length);

            // Append Gathered Data Object to Return Array
            arr.push({ TypeID, data });

            ptr += length;
        }

        return arr;
    }
}