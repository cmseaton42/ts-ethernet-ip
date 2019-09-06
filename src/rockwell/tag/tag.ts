import { ATag, ITagOptions, ITagData } from './abstract-tag';
import { DataTypes } from '../../enip/cip/data-types';
import { enip } from '../../enip';

const { CIP } = enip;
const { Services, MessageRouter: MsgRtr } = CIP;

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
        // TODO: complete
    }

    public parseWriteResponse(data: Buffer) {
        // TODO: complete
    }

    /***************************************************************************
     * Private and Protected Method Definitions
     ***************************************************************************/

    /**
     * Generates Write Tag Message - Atomics
     *
     */
    protected _buildWriteRequest() {
        const { SINT, INT, DINT, REAL, BOOL } = DataTypes;

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
            case INT:
                valBuf = Buffer.alloc(2);
                valBuf.writeInt16LE(this.tag.value, 0);
                break;
            case DINT:
                valBuf = Buffer.alloc(4);
                valBuf.writeInt32LE(this.tag.value, 0);
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
                buf.writeUInt8(value ? 1 << this.bitOffset : 0, 2); // or mask
                buf.writeUInt8(value ? 255 : 255 & ~(1 << this.bitOffset), 3); // and mask
                break;
            case DataTypes.INT:
                buf = Buffer.alloc(6); // 2 bytes + 2 bytes + 2 bytes
                buf.writeInt16LE(2, 0); //mask length
                buf.writeUInt16LE(value ? 1 << this.bitOffset : 0, 2); // or mask
                buf.writeUInt16LE(value ? 65535 : 65535 & ~(1 << this.bitOffset), 4); // and mask
                break;
            default:
                // DINT, BIT_STRING
                buf = Buffer.alloc(10); // 2 bytes + 4 bytes + 4 bytes
                buf.writeInt16LE(4, 0); //mask length
                buf.writeInt32LE(value ? 1 << this.bitOffset : 0, 2); // or mask
                buf.writeInt32LE(value ? -1 : -1 & ~(1 << this.bitOffset), 6); // and mask
                break;
        }

        // Build Current Message
        return MsgRtr.build(Services.READ_MODIFY_WRITE_TAG, this.path, buf);
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
