import { EventEmitter } from 'events';
import uuid from 'uuid/v4';
import { DataTypes } from '../../enip/cip/data-types';

export interface ITagOptions {
    program?: string | null;
    datatype?: DataTypes | null;
    keepAlive?: number;
    instance_id?: number | null;
}

export interface ITagData<T> {
    program: null | string;
    name: string;
    instance_id: number | null;
    value: T;
}

export abstract class ATag<T> extends EventEmitter {
    static instances: number = 0;
    public readonly instance_id: string;
    public readonly path: Buffer;

    protected stage_write: boolean;
    protected datatype: DataTypes | null;
    protected keep_alive: number;
    protected tag: ITagData<T>;

    constructor(tagname: string, options: ITagOptions) {
        super();

        // Setup default options
        const opts: ITagOptions = {};
        opts.datatype = options.datatype || null;
        opts.keepAlive = options.keepAlive || 0;
        opts.program = options.program || null;
        opts.instance_id = options.instance_id || null;

        // Perform error checking
        if (!ATag.isValidTagname(tagname)) throw new Error('Invalid tagname given');
        if (opts.keepAlive < 0) throw new Error('Keepalive must be greater than 0');
        if (opts.datatype && !(opts.datatype in DataTypes)) {
            throw new Error('Invalid CIP DataType given');
        }

        this.path = this._generatePath();

        // Perform general instance setup
        ATag.instances += 1;
        this.stage_write = false;
        this.instance_id = uuid();
        this.datatype = opts.datatype;
        this.keep_alive = opts.keepAlive;
        this.tag = {
            program: opts.program,
            name: tagname,
            instance_id: opts.instance_id,
            value: this._setInitialValue(),
        };
    }

    public abstract buildReadRequest(): Buffer;
    public abstract parseReadResponse(data: Buffer): void;
    public abstract buildWriteRequest(value: T | null): Buffer;
    public abstract parseWriteResponse(data: Buffer): void;

    protected abstract _setInitialValue(): T;
    protected abstract _generatePath(): Buffer;

    /**
     * Determines if a Tagname is Valid
     *
     * --> Originially contributed by GitHub@jhenson29
     */
    static isValidTagname(tagname: string, acceptBitIndex: boolean = true): boolean {
        // regex components
        const nameRegex = (captureIndex: number) => {
            return `(_?[a-zA-Z]|_\\d)(?:(?=(_?[a-zA-Z0-9]))\\${captureIndex})*`;
        };

        const multDimArrayRegex = '(\\[\\d+(,\\d+){0,2}])';
        const arrayRegex = '(\\[\\d+])';
        const bitIndexRegex = '(\\.\\d{1,2})';

        // user regex for user tags
        let userRegString = '^(Program:' + nameRegex(3) + '\\.)?'; // optional program name
        userRegString += nameRegex(5) + multDimArrayRegex + '?'; // tag name
        userRegString += '(\\.' + nameRegex(10) + arrayRegex + '?)*'; // option member name
        userRegString += bitIndexRegex + '?$';

        const userRegex = new RegExp(userRegString); // optional bit index

        // module regex for module tags
        let moduleRegString = '^' + nameRegex(2); // module name
        moduleRegString += '(:\\d{1,2})?'; // optional slot num (not required for rack optimized connections)
        moduleRegString += ':[IOC]'; // input/output/config
        moduleRegString += '(\\.' + nameRegex(6) + arrayRegex;
        moduleRegString += '?)?'; // optional member with optional array index
        moduleRegString += bitIndexRegex + '?$';

        const moduleRegex = new RegExp(moduleRegString); // optional bit index

        if (!userRegex.test(tagname) && !moduleRegex.test(tagname)) return false;

        if (!acceptBitIndex) {
            const bitRegex = new RegExp(`${bitIndexRegex}$`);
            if (bitRegex.test(tagname)) return false;
        }

        // check segments
        if (tagname.split(/[:.[\],]/).filter(segment => segment.length > 40).length > 0) return false; // check that all segments are <= 40 char

        // passed all tests
        return true;
    }
}
