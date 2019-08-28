export enum Types {
    SIMPLE = 0x80,
    ANSI_EXTD = 0x91,
}

export enum ElementTypes {
    UINT8 = 0x28,
    UINT16 = 0x29,
    UINT32 = 0x2a,
}

/**
 * Builds EPATH Data Segment
 *
 */
export const build = (data: number | string, ANSI = true) => {
    // Build Element Segment If Int
    if (typeof data === 'number') return elementBuild(data);

    // Build symbolic segment by default
    return symbolicBuild(data, ANSI);
};

/**
 * Builds EPATH Symbolic Segment
 *
 */
export const symbolicBuild = (data: string, ANSI: boolean = true): Buffer => {
    // Initialize Buffer
    let buf = Buffer.alloc(2);

    // Write Appropriate Segment Byte
    buf.writeUInt8(ANSI ? Types.ANSI_EXTD : Types.SIMPLE, 0);

    // Write Appropriate Length
    buf.writeUInt8(ANSI ? data.length : Math.ceil(data.length / 2), 1);

    // Append Data
    buf = Buffer.concat([buf, Buffer.from(data)]);

    // Add Pad Byte if Odd Length
    if (buf.length % 2 === 1) buf = Buffer.concat([buf, Buffer.alloc(1)]); // Pad Odd Length Strings

    return buf;
};

/**
 * Builds EPATH Element Segment
 *
 */
export const elementBuild = (data: number): Buffer => {
    // Get Element Length - Data Access 2 - IOI Segments - Element Segments
    let type: ElementTypes;
    let dataBuf: Buffer;

    if (data < 256) {
        type = ElementTypes.UINT8; // UNIT8 x28 xx
        dataBuf = Buffer.alloc(1);
        dataBuf.writeUInt8(data, 0);
    } else if (data < 65536) {
        type = ElementTypes.UINT16; // UINT16 x29 00 xx xx
        dataBuf = Buffer.alloc(3);
        dataBuf.writeUInt16LE(data, 1);
    } else {
        type = ElementTypes.UINT32; // UINT32 x2a 00 xx xx xx xx
        dataBuf = Buffer.alloc(5);
        dataBuf.writeUInt32LE(data, 1);
    }

    // Initialize Buffer
    let buf = Buffer.alloc(1);

    // Write Appropriate Segment Byte
    buf.writeUInt8(type, 0);

    // Append Data
    buf = Buffer.concat([buf, dataBuf]);

    return buf;
};
