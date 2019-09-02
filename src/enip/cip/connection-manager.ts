/**************************************************
 * Original author of this file is GitHub@Penlane *
 **************************************************/

import { generateEncodedTimeout } from './util';

// Redundant Owner (Vol.1 - Table 3-5.8 Field 15)
export enum Owner {
    EXCLUSIVE = 0,
    MULTIPLE = 1,
}

// Connection Priority (Vol.1 - Table 3-5.8 Field 14,13)
export enum ConnectionType {
    NULL = 0,
    MULTICAST = 1,
    POINT_TO_POINT = 2,
    RESERVED = 3,
}

// Connection Priority (Vol.1 - Table 3-5.8 Field 11,10)
export enum Priority {
    LOW = 0,
    HIGH = 1,
    SCHEDULED = 2,
    URGENT = 3,
}

// Fixed or variable parameter (Vol.1 - Table 3-5.8 Field 9)
export enum FixedVar {
    FIXED = 0,
    VARIABLE = 1,
}

// Time Tick Value (Vol.1 - Table 3-5.11)
export enum TimePerTick {
    '1ms' = 0b0000,
    '2ms' = 0b0001,
    '4ms' = 0b0010,
    '8ms' = 0b0011,
    '16ms' = 0b0100,
    '32ms' = 0b0101,
    '64ms' = 0b0110,
    '128ms' = 0b0111,
    '256ms' = 0b1000,
    '512ms' = 0b1001,
    '1024ms' = 0b1010,
    '2048ms' = 0b1011,
    '4096ms' = 0b1100,
    '8192ms' = 0b1101,
    '16384ms' = 0b1110,
    '32768ms' = 0b1111,
}

// Timeout Multiplier (Vol.1 - Table 3-5.12)
export enum TimeoutMultiplier {
    'x4' = 0,
    'x8' = 1,
    'x16' = 2,
    'x32' = 3,
    'x64' = 4,
    'x128' = 5,
    'x256' = 6,
    'x512' = 7,
}

// Define useful constants
const ORIG_VENDOR_ID = 0x3333;
const ORIG_SERIAL_NUM = 0x1337; // :sunglasses: :rocket:
const CONN_SERIAL_NUM = 0x4242; // Jackie Robinson + The life the universe and everything :smile:

export abstract class ConnectionManager {
    /**
     * Build for Object specific connection parameters (Vol.1 - Table 3-5.8)
     */
    public static buildConnParameters(
        owner: Owner,
        type: ConnectionType,
        priority: Priority,
        fixedVar: FixedVar,
        size: number,
    ): number {
        if (owner !== 0 && owner !== 1) throw new Error('Owner can only be exclusive (0) or multiple (1)');
        if (fixedVar !== 0 && fixedVar !== 1) throw new Error('Fixedvar can only be Fixed(0) or VariableI(1)');
        if (size > 10000 || size <= 1) throw new Error('Size must be a positive number between 1 and 10000');

        if (type > 3 || type < 0) {
            throw new Error('Type can only be Null(0), Multicast(1), PointToPoint(2) or Reserved(3)');
        }

        if (priority > 3 || priority < 0) {
            throw new Error('Priority can only be Low(0), High(1), Scheduled(2) or Urgent(3)');
        }

        return (owner << 15) | (type << 13) | (priority << 10) | (fixedVar << 9) | size;
    }

    /**
     * Builds the data portion of a forwardOpen packet (Vol.1 - Table 3-5.16)
     *
     * @param {number} [RPI=10000] - Request packet interval in microseconds.
     */
    public static buildForwardOpen(
        RPI: number = 10000,
        netConnParams: number = 0x43f4, // Determined for most EIP connections
        timeOutMs: number = 2000,
        timeOutMult: TimeoutMultiplier = TimeoutMultiplier.x32,
        connSerialNum: number = CONN_SERIAL_NUM, // TODO: Make this unique
        vendorOrig: number = ORIG_VENDOR_ID,
    ): Buffer {
        if (timeOutMs <= 999) throw new Error('Timeouts Must be Positive Integers at least 1000');
        if (RPI <= 9999) throw new Error('RPI should be at least 10000us (10ms)');

        if (!(timeOutMult in TimeoutMultiplier)) {
            throw new Error('Timeout Multiplier must be a number and a multiple of 4');
        }

        const buf = Buffer.alloc(35); // Normal forward open request
        const timeout = generateEncodedTimeout(timeOutMs);

        buf.writeUInt8(timeout.timeTick, 0); // Priority / TimePerTick
        buf.writeUInt8(timeout.ticks, 1); // Timeout Ticks
        buf.writeUInt32LE(0x11111111, 2); // O->T Connection ID
        buf.writeUInt32LE(0x22222222, 6); // T->O Connection ID
        buf.writeUInt16LE(connSerialNum, 10); // Connection Serial Number
        buf.writeUInt16LE(vendorOrig, 12); // Originator VendorID
        buf.writeUInt32LE(ORIG_SERIAL_NUM, 14); // Originator Serial Number
        buf.writeUInt32LE(timeOutMult, 18); // TimeOut Multiplier
        buf.writeUInt32LE(RPI, 22); // O->T RPI
        buf.writeUInt16LE(netConnParams, 26); // O->T Network Connection Params
        buf.writeUInt32LE(RPI, 28); // T->O RPI
        buf.writeUInt16LE(netConnParams, 32); // T->O Network Connection Params
        buf.writeUInt8(0xa3, 34); // TransportClass_Trigger (Vol.1 - 3-4.4.3) -> Target is a Server, Application object of Transport Class 3.

        return buf;
    }

    /**
     * Builds the data portion of a forwardClose packet (Vol.1 - Table 3-5.19)
     *
     */
    public static buildForwardClose(
        connSerialNum: number = CONN_SERIAL_NUM, // TODO: Make this unique
        timeOutMs: number = 2000,
        vendorOrig: number = ORIG_VENDOR_ID,
        serialOrig: number = ORIG_SERIAL_NUM,
    ) {
        if (timeOutMs <= 999) throw new Error('Timeouts Must be Positive Integers at least 1000');

        const buf = Buffer.alloc(10);
        const timeout = generateEncodedTimeout(timeOutMs);

        buf.writeUInt8(timeout.timeTick, 0); // Priority / TimePerTick
        buf.writeUInt8(timeout.ticks, 1); // Timeout Ticks
        buf.writeUInt16LE(connSerialNum, 2); // Connection Serial Number
        buf.writeUInt16LE(vendorOrig, 4); // Originator VendorID
        buf.writeUInt32LE(serialOrig, 6); // Originator Serial Number

        return buf;
    }
}
