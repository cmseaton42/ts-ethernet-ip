import { ATag, ITagOptions, ITagData } from './abstract-tag';
import { DataTypes } from '../../enip/cip/data-types';
import { enip } from '../../enip';

const { CIP } = enip;
const { Services, MessageRouter: MsgRtr } = CIP;

export enum TagEvents {
    CHANGED = 'Changed',
    KEEP_ALIVE = 'Keep Alive',
    INITIALIZED = 'Initialized',
}

export class Tag extends ATag<number> {
    /***************************************************************************
     * Property Initializations
     ***************************************************************************/
    protected isBitIndex: boolean = false;
    protected bitOffset: number = 0;

    /***************************************************************************
     * New Instance Constructor
     ***************************************************************************/
    constructor(tagname: string, options: ITagOptions = {}) {
        super(tagname, options);
    }

    /***************************************************************************
     * Public Method Definitions
     ***************************************************************************/

    /**
     * Generates Read Tag Message
     *
     */
    public buildReadRequest() {
        const read_size: Buffer = Buffer.alloc(2);
        read_size.writeUInt16LE(1, 0);

        return MsgRtr.build(Services.READ_TAG, this.path, read_size);
    }

    /**
     * Generates Write Tag Message
     *
     */
    public buildWriteRequest(value: number | null = null) {
        if (value !== null) this.tag.value = value;

        let errorMsg = `Tag ${this.tag.name} has not been initialized. `;
        errorMsg += 'Try reading the tag from the controller first ';
        errorMsg += 'or manually providing a valid CIP datatype.';

        if (this.datatype === null) throw new Error(errorMsg);

        if (this.isBitIndex) {
            if (typeof this.tag.value === 'boolean') return this._buildWriteRequestBit();
            else throw new Error('Must assign a value of type boolean to bit');
        }

        return this._buildWriteRequest();
    }

    public parseReadResponse(data: Buffer) {
        // Set Type of Tag Read
        this.datatype = data.readUInt16LE(0);

        if (this.isBitIndex) this._parseReadResponseBit(data);
        else this._parseReadResponse(data);
    }

    /***************************************************************************
     * Private and Protected Method Definitions
     ***************************************************************************/

    /**
     * Generates Write Tag Message - Atomics
     *
     */
    protected _buildWriteRequest() {
        const { SINT, INT, DINT, REAL, BOOL, USINT, UINT, UDINT } = DataTypes;

        let errorMsg = `Tag ${this.tag.name} has not been initialized. `;
        errorMsg += 'Try reading the tag from the controller first ';
        errorMsg += 'or manually providing a valid CIP datatype.';

        if (this.datatype === null) throw new Error(errorMsg);

        // Build Message Router to Embed in Packet
        let buf = Buffer.alloc(4);
        let valBuf: Buffer;
        buf.writeUInt16LE(this.datatype, 0);
        buf.writeUInt16LE(1, 2);

        /* eslint-disable indent */
        switch (this.datatype) {
            case SINT:
                valBuf = Buffer.alloc(1);
                valBuf.writeInt8(this.tag.value, 0);
                break;
            case USINT:
                valBuf = Buffer.alloc(1);
                valBuf.writeUInt8(this.tag.value, 0);
                break;
            case INT:
                valBuf = Buffer.alloc(2);
                valBuf.writeInt16LE(this.tag.value, 0);
                break;
            case UINT:
                valBuf = Buffer.alloc(2);
                valBuf.writeUInt16LE(this.tag.value, 0);
                break;
            case DINT:
                valBuf = Buffer.alloc(4);
                valBuf.writeInt32LE(this.tag.value, 0);
                break;
            case UDINT:
                valBuf = Buffer.alloc(4);
                valBuf.writeUInt32LE(this.tag.value, 0);
                break;
            case REAL:
                valBuf = Buffer.alloc(4);
                valBuf.writeFloatLE(this.tag.value, 0);
                break;
            case BOOL:
                valBuf = Buffer.alloc(1);
                valBuf.writeInt8(this.tag.value, 0);
                break;
            default:
                throw new Error(
                    `Unrecognized Type to Write to Controller: ${DataTypes[this.datatype]} <${this.datatype}>`,
                );
        }

        buf = Buffer.concat([buf, valBuf]);

        // Build Current Message
        return MsgRtr.build(Services.WRITE_TAG, this.path, buf);
    }

    /**
     * Generates Write Tag Message - Bit Indexes
     * --> eg. someTag.5
     * --> originally contributed by GitHub@jhenson29
     */
    protected _buildWriteRequestBit() {
        // Build Message Router to Embed in Packet
        let buf = null;
        const value = this.tag.value;

        switch (this.datatype) {
            case DataTypes.SINT:
                buf = Buffer.alloc(4); // 2 bytes + 1 byte + 1 byte
                buf.writeInt16LE(1, 0); //mask length
                buf.writeUInt8(value === 1 ? 1 << this.bitOffset : 0, 2); // or mask
                buf.writeUInt8(value === 1 ? 255 : 255 & ~(1 << this.bitOffset), 3); // and mask
                break;
            case DataTypes.INT:
                buf = Buffer.alloc(6); // 2 bytes + 2 bytes + 2 bytes
                buf.writeInt16LE(2, 0); //mask length
                buf.writeUInt16LE(value === 1 ? 1 << this.bitOffset : 0, 2); // or mask
                buf.writeUInt16LE(value === 1 ? 65535 : 65535 & ~(1 << this.bitOffset), 4); // and mask
                break;
            default:
                // DINT, BIT_STRING
                buf = Buffer.alloc(10); // 2 bytes + 4 bytes + 4 bytes
                buf.writeInt16LE(4, 0); //mask length
                buf.writeInt32LE(value === 1 ? 1 << this.bitOffset : 0, 2); // or mask
                buf.writeInt32LE(value === 1 ? -1 : -1 & ~(1 << this.bitOffset), 6); // and mask
                break;
        }

        // Build Current Message
        return MsgRtr.build(Services.READ_MODIFY_WRITE_TAG, this.path, buf);
    }

    /**
     *  Parses Good Read Request Messages Using A Mask For A Specified Bit Index
     *
     */
    _parseReadResponseBit(data: Buffer) {
        const { SINT, USINT, INT, UINT, DINT, UDINT, BIT_STRING } = DataTypes;
        const offsetWord = 1 << this.bitOffset;

        let value: number;

        // Read Tag Value
        switch (this.datatype) {
            case SINT:
                value = (data.readInt8(2) & offsetWord) == 0 ? 0 : 1;
                break;
            case USINT:
                value = (data.readUInt8(2) & offsetWord) == 0 ? 0 : 1;
                break;
            case INT:
                value = (data.readInt16LE(2) & offsetWord) == 0 ? 0 : 1;
                break;
            case UINT:
                value = (data.readUInt16LE(2) & offsetWord) == 0 ? 0 : 1;
                break;
            case DINT:
            case BIT_STRING:
                value = (data.readInt32LE(2) & offsetWord) == 0 ? 0 : 1;
                break;
            case UDINT:
                value = (data.readUInt32LE(2) & offsetWord) == 0 ? 0 : 1;
                break;
            default:
                throw new Error('Invalid datatype returned when a Bit Index was requested');
        }

        this._setControllerValue(value);
    }

    /**
     *  Parses Good Read Request Messages
     *
     */
    _parseReadResponse(data: Buffer) {
        const { SINT, USINT, INT, UINT, DINT, UDINT, REAL } = DataTypes;

        let value: number;

        // Read Tag Value
        switch (this.datatype) {
            case SINT:
                value = data.readInt8(2);
                break;
            case USINT:
                value = data.readUInt8(2);
                break;
            case INT:
                value = data.readInt16LE(2);
                break;
            case UINT:
                value = data.readUInt16LE(2);
                break;
            case DINT:
                value = data.readInt32LE(2);
                break;
            case UDINT:
                value = data.readUInt32LE(2);
                break;
            case REAL:
                value = data.readFloatLE(2);
                break;
            default:
                throw new Error('Invalid datatype returned when a Bit Index was requested');
        }

        this._setControllerValue(value);
    }

    /**
     * Set initial value of tag upon new instance creation
     *
     */
    protected _setInitialValue(): number {
        return 0;
    }

    /**
     * Extract bit index from tag
     * --> someTag.5 would extract 5
     *
     */
    protected _extractBitIndex(tagname: string): number | null {
        // Check if tagname implies a bit type
        const bitRegex = /\.\d{1,2}$/;
        const bitResult = bitRegex.exec(tagname);

        if (bitResult) {
            this.isBitIndex = true;
            this.bitOffset = parseInt(bitResult[0].slice(1));
        } else {
            this.isBitIndex = false;
            this.bitOffset = 0;
        }

        return bitResult ? bitResult['index'] : null;
    }

    /**
     * Generates CIP EPATH for tag
     *
     */
    protected _generatePath(): Buffer {
        const { name } = this.tag;
        const bitIndex = this._extractBitIndex(name);

        let tagname = bitIndex ? name.slice(0, bitIndex) : name;

        // Split by "." for memebers
        // Split by "[" or "]" for array indexes
        // Split by "," for array indexes with more than 1 dimension
        // Filter for length > 0 to remove empty elements (happens if tag ends with array index)
        const pathArr = tagname.split(/[.[\],]/).filter(segment => segment.length > 0);
        const bufArr: Buffer[] = [];

        // Push Program Path to buffer array if Present
        if (this.tag.program) {
            bufArr.push(CIP.EPATH.segments.DATA.build(`Program:${this.tag.program}`));
        }

        // Build EPATH Buffer
        for (const path of pathArr) {
            bufArr.push(CIP.EPATH.segments.DATA.build(path));
        }

        return Buffer.concat(bufArr);
    }

    /**
     * Sets Controller Tag Value and Emits Changed Event
     *
     */
    protected _setControllerValue(value: number) {
        if (value !== this.tag.controllerValue) {
            // Cache last read value from Controller
            const last = this.tag.controllerValue;

            // Update read value with new value
            this.tag.controllerValue = value;

            // Set tag value if not write
            //   value present from user
            if (!this.stage_write) this.tag.value = value;

            if (this.initialized) this.emit(TagEvents.CHANGED, this, last);
            else this.emit(TagEvents.INITIALIZED, this);

            this.tag.timestamp = new Date();

            // If unchanged then check keep alive
        } else if (this.keep_alive > 0) {
            const now = new Date(); // cache current time
            const elapsed = now.getTime() - this.tag.timestamp.getTime();
            const maxElapse = this.keep_alive * 1000; // microsec

            if (elapsed >= maxElapse) {
                this.tag.timestamp = now;
                this.emit(TagEvents.KEEP_ALIVE, this);
            }
        }
    }

    /***************************************************************************
     * Property Accessors
     ***************************************************************************/
    public get value() {
        if (this.datatype === DataTypes.BOOL || this.isBitIndex) {
            return this.tag.value === 1 ? true : false;
        }

        return this.tag.value;
    }
}
