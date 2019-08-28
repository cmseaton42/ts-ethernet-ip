const LOGICAL_SEGMENT = 1 << 5;

export enum Types {
    CLASS_ID = 0 << 2,
    INSTANCE_ID = 1 << 2,
    MEMBER_ID = 2 << 2,
    CONN_POINT = 3 << 2,
    ATTRIBUTE_ID = 4 << 2,
    SPECIAL = 5 << 2,
    SERVICE_ID = 6 << 2,
}

/**
 * Builds Single Logical Segment Buffer
 *
 * @param {Types} type - Valid Logical Segment Type
 * @param {number} address - Logical Segment Address
 * @param {boolean} [padded=true] - Padded or Packed EPATH format
 */
export const build = (type: Types, address: number, padded = true) => {
    const isValid = type in Types;
    if (!isValid) throw new Error('Invalid Logical Type Code Passed to Segment Builder');

    if (address <= 0) throw new Error('Passed Address Must be a Positive Integer');

    let buf: Buffer | null = null; // Initialize Output Buffer

    // Determine Size of Logical Segment Value and Build Buffer
    let format: number | null = null;
    if (address <= 255) {
        format = 0;

        buf = Buffer.alloc(2);
        buf.writeUInt8(address, 1);
    } else if (address > 255 && address <= 65535) {
        format = 1;

        if (padded) {
            buf = Buffer.alloc(4);
            buf.writeUInt16LE(address, 2);
        } else {
            buf = Buffer.alloc(3);
            buf.writeUInt16LE(address, 1);
        }
    } else {
        format = 2;

        if (padded) {
            buf = Buffer.alloc(6);
            buf.writeUInt32LE(address, 2);
        } else {
            buf = Buffer.alloc(5);
            buf.writeUInt32LE(address, 1);
        }
    }

    // Build Segment Byte
    const segmentByte = LOGICAL_SEGMENT | type | format;
    buf.writeUInt8(segmentByte, 0);

    return buf;
};
