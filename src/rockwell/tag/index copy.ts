import { EventEmitter } from 'events';
import { enip } from '../../enip';
import { DataTypes } from '../../enip/cip/data-types';
import dateFormat from 'dateformat';

const { MessageRouter, Services } = enip.CIP;

export interface ITagOptions {
    program?: string | null;
    datatype?: DataTypes | null;
    keepAlive?: number;
}

type Atomic = number | boolean;

export interface ITagName {
    program: null | string;
    name: string;
    value: Atomic;
}

export class Tag extends EventEmitter {
    static instances: number = 0;
    public readonly instance: string;
    public readonly bitIndex: number | null;
    public read_size: number;

    protected stage_write: boolean;
    protected datatype: DataTypes;
    protected tag: ITagData;

    constructor(tagname: string, options: ITagOptions = {}) {
        super();

        const opts: ITagOptions = {};
        opts.datatype = options.datatype || null;
        opts.keepAlive = options.keepAlive || 0;
        opts.program = options.program || null;

        if (!Tag.isValidTagname(tagname)) throw new Error('Invalid tagname given');
        if (opts.keepAlive < 0) throw new Error('Keepalive must be greater than 0');
        if (opts.datatype && !(opts.datatype in DataTypes)) {
            throw new Error('Invalid CIP DataType given');
        }

        Tag.instances += 1;

        // Split by "." for memebers
        // Split by "[" or "]" for array indexes
        // Split by "," for array indexes with more than 1 dimension
        // Filter for length > 0 to remove empty elements (happens if tag ends with array index)
        let pathArr = tagname.split(/[.[\],]/).filter(segment => segment.length > 0);
        this.bitIndex = null;

        // Check for bit index (tag ends in .int) - this only applies to SINT, INT, DINT or array elements of
        // Split by "." to only check udt members and bit index.
        let memArr = tagname.split('.');
        let isNum = !isNaN(parseInt(memArr[memArr.length - 1]));
        let isBitIndex = memArr.length > 1 && isNum;

        // Check if BIT_STRING data type was passed in
        let isBitString = opts.datatype === DataTypes.BIT_STRING && isNum;

        // Tag can not be both a bit index and BIT_STRING
        if (isBitString && isBitIndex) {
            throw new Error('Tag cannot be defined as a BIT_STRING and have a bit index');
        }

        if (isBitString) {
            // BIT_STRING need to be converted to array with bit index
            // tag[x] converts to tag[(x-x%32)/32].x%32
            // e.g. tag[44] turns into tag[1].12
            this.bitIndex = parseInt(pathArr[pathArr.length - 1]) % 32;
            pathArr[pathArr.length - 1] = ((parseInt(pathArr[pathArr.length - 1]) - this.bitIndex) / 32).toString();
        } else {
            if (isBitIndex) {
                // normal bit index handling
                this.bitIndex = parseInt(pathArr.pop() || '0');
                if (this.bitIndex < 0 || this.bitIndex > 31) {
                    throw new Error(`Tag bit index must be between 0 and 31, received ${this.bitIndex}`);
                }
            }
        }
    }

    /**
     * Determines if a Tagname is Valid
     *
     * --> Originially contributed by GitHub@jhenson29
     */
    static isValidTagname(tagname: string): boolean {
        if (typeof tagname !== 'string') return false;

        // regex components
        const nameRegex = (captureIndex: number) => {
            return `(_?[a-zA-Z]|_\\d)(?:(?=(_?[a-zA-Z0-9]))\\${captureIndex})*`;
        };

        const multDimArrayRegex = '(\\[\\d+(,\\d+){0,2}])';
        const arrayRegex = '(\\[\\d+])';
        const bitIndexRegex = '(\\.\\d{1,2})';

        // user regex for user tags
        const userRegex = new RegExp(
            '^(Program:' +
            nameRegex(3) +
            '\\.)?' + // optional program name
            nameRegex(5) +
            multDimArrayRegex +
            '?' + // tag name
            '(\\.' +
            nameRegex(10) +
            arrayRegex +
            '?)*' + // option member name
                bitIndexRegex +
                '?$',
        ); // optional bit index
        // full user regex
        // ^(Program:(_?[a-zA-Z]|_\d)(?:(?=(_?[a-zA-Z0-9]))\3)*\.)?(_?[a-zA-Z]|_\d)(?:(?=(_?[a-zA-Z0-9]))\5)*(\[\d+(,\d+){0,2}])?(\.(_?[a-zA-Z]|_\d)(?:(?=(_?[a-zA-Z0-9]))\10)*(\[\d+])?)*(\.\d{1,2})?$

        // module regex for module tags
        const moduleRegex = new RegExp(
            '^' +
            nameRegex(2) + // module name
            '(:\\d{1,2})?' + // optional slot num (not required for rack optimized connections)
            ':[IOC]' + // input/output/config
            '(\\.' +
            nameRegex(6) +
            arrayRegex +
            '?)?' + // optional member with optional array index
                bitIndexRegex +
                '?$',
        ); // optional bit index
        // full module regex
        // ^(_?[a-zA-Z]|_\d)(?:(?=(_?[a-zA-Z0-9]))\2)*(:\d{1,2})?:[IOC](\.(_?[a-zA-Z]|_\d)(?:(?=(_?[a-zA-Z0-9]))\6)*(\[\d+])?)?(\.\d{1,2})?$

        if (!userRegex.test(tagname) && !moduleRegex.test(tagname)) return false;

        // check segments
        if (tagname.split(/[:.[\],]/).filter(segment => segment.length > 40).length > 0) return false; // check that all segments are <= 40 char

        // passed all tests
        return true;
    }
}
