import { ATag, ITagOptions } from '../../../rockwell/tag/abstract-tag';

class Tester extends ATag<boolean> {
    constructor(tagname: string, options: ITagOptions = {}) {
        super(tagname, options);
    }

    buildReadRequest() {
        return Buffer.from('read request');
    }

    buildWriteRequest() {
        return Buffer.from('write request');
    }

    parseReadResponse(data: Buffer) {
        // do nothing
    }

    parseWriteResponse(data: Buffer) {
        // do nothing
    }

    _generatePath() {
        return Buffer.from('path');
    }

    _setInitialValue() {
        return true;
    }
}

describe('Tag Base Class', () => {
    describe('New Instance', () => {
        it('Throws on bad input', () => {
            const fn = (tagname: string, options?: ITagOptions) => {
                return () => (options ? new Tester(tagname, options) : new Tester(tagname));
            };

            expect(fn('someTag')).not.toThrow();
            expect(fn('__someTag')).toThrow();
            expect(fn('someTag', { program: 'prog', datatype: 0x31 })).toThrow();
            expect(fn('someTag', { program: 'prog', datatype: 0xc1 })).not.toThrow();
            expect(fn('someTag', { keepAlive: 10 })).not.toThrow();
            expect(fn('someTag', { keepAlive: -10 })).toThrow();
        });
    });

    describe('Tag Validator Method', () => {
        it('Judges correctly while accepting bit indexes', () => {
            const fn = (test: string) => Tester.isValidTagname(test);

            expect(fn('_sometagname')).toBeTruthy();
            expect(fn(`hello${311}`)).toBeTruthy();
            expect(fn('hello.how3')).toBeTruthy();
            expect(fn('randy.julian.bubbles')).toBeTruthy();
            expect(fn('a.b.c')).toBeTruthy();
            expect(fn('1.1.1')).toBeFalsy();
            expect(fn('fffffffffffffffffffffffffffffffffffffffff')).toBeFalsy();
            expect(fn('ffffffffffffffffffffffffffffffffffffffff')).toBeTruthy();
            expect(fn('4hello')).toBeFalsy();
            expect(fn('someTagArray[12]')).toBeTruthy();
            expect(fn('someTagArray[1a]')).toBeFalsy();
            expect(fn('hello[f]')).toBeFalsy();
            expect(fn('someOtherTag[0]a')).toBeFalsy();
            expect(fn('tagname')).toBeTruthy();
            expect(fn('tag_with_underscores45')).toBeTruthy();
            expect(fn('someTagArray[0]')).toBeTruthy();
            expect(fn('a')).toBeTruthy();
            expect(fn('tagBitIndex.0')).toBeTruthy();
            expect(fn('tagBitIndex.31')).toBeTruthy();
            expect(fn('tagBitIndex.0a')).toBeFalsy();
            expect(fn('tagBitIndex.-1')).toBeFalsy();
            expect(fn('tagArray[0,0]')).toBeTruthy();
            expect(fn('tagArray[0,0,0]')).toBeTruthy();
            expect(fn('tagArray[-1]')).toBeFalsy();
            expect(fn('tagArray[0,0,-1]')).toBeFalsy();
            expect(fn('Program:program.tag')).toBeTruthy();
            expect(fn('Program:noProgramArray[0].tag')).toBeFalsy();
            expect(fn('notProgram:program.tag')).toBeFalsy();
            expect(fn('Program::noDoubleColon.tag')).toBeFalsy();
            expect(fn('Program:noExtraColon:tag')).toBeFalsy();
            expect(fn('Program:program.tag.singleDimMemArrayOk[0]')).toBeTruthy();
            expect(fn('Program:program.tag.noMultiDimMemArray[0,0]')).toBeFalsy();
            expect(fn('Program:program.tag.memberArray[0]._0member[4]._another_1member.f1nal_member.5')).toBeTruthy();
            expect(fn('Program:9noNumberProgram.tag')).toBeFalsy();
            expect(fn('tag.9noNumberMember')).toBeFalsy();
            expect(fn('tag.noDouble__underscore1')).toBeFalsy();
            expect(fn('tag.__noDoubleUnderscore2')).toBeFalsy();
            expect(fn('tag.noEndInUnderscore_')).toBeFalsy();
            expect(fn('tag._member_Length_Ok_And_ShouldPassAt40Char')).toBeTruthy();
            expect(fn('tag._memberLengthTooLongAndShouldFailAt41Char')).toBeFalsy();
            expect(fn('tag..noDoubleDelimitters')).toBeFalsy();
            expect(fn('Local:1:I.Data')).toBeTruthy();
            expect(fn('Local:1:I.Data.3')).toBeTruthy();
            expect(fn('Remote_Rack:I.Data[1].5')).toBeTruthy();
            expect(fn('Remote_Rack:O.Data[1].5')).toBeTruthy();
            expect(fn('Remote_Rack:C.Data[1].5')).toBeTruthy();
            expect(fn('Remote_Rack:1:I.0')).toBeTruthy();
        });

        it('Judges correctly while not accepting bit indexes', () => {
            const fn = (test: string) => Tester.isValidTagname(test, false);

            expect(fn('_sometagname')).toBeTruthy();
            expect(fn(`hello${311}`)).toBeTruthy();
            expect(fn('hello.how3')).toBeTruthy();
            expect(fn('randy.julian.bubbles')).toBeTruthy();
            expect(fn('a.b.c')).toBeTruthy();
            expect(fn('1.1.1')).toBeFalsy();
            expect(fn('fffffffffffffffffffffffffffffffffffffffff')).toBeFalsy();
            expect(fn('ffffffffffffffffffffffffffffffffffffffff')).toBeTruthy();
            expect(fn('4hello')).toBeFalsy();
            expect(fn('someTagArray[12]')).toBeTruthy();
            expect(fn('someTagArray[1a]')).toBeFalsy();
            expect(fn('hello[f]')).toBeFalsy();
            expect(fn('someOtherTag[0]a')).toBeFalsy();
            expect(fn('tagname')).toBeTruthy();
            expect(fn('tag_with_underscores45')).toBeTruthy();
            expect(fn('someTagArray[0]')).toBeTruthy();
            expect(fn('a')).toBeTruthy();
            expect(fn('tagBitIndex.0')).toBeFalsy();
            expect(fn('tagBitIndex.31')).toBeFalsy();
            expect(fn('tagBitIndex.0a')).toBeFalsy();
            expect(fn('tagBitIndex.-1')).toBeFalsy();
            expect(fn('tagArray[0,0]')).toBeTruthy();
            expect(fn('tagArray[0,0,0]')).toBeTruthy();
            expect(fn('tagArray[-1]')).toBeFalsy();
            expect(fn('tagArray[0,0,-1]')).toBeFalsy();
            expect(fn('Program:program.tag')).toBeTruthy();
            expect(fn('Program:noProgramArray[0].tag')).toBeFalsy();
            expect(fn('notProgram:program.tag')).toBeFalsy();
            expect(fn('Program::noDoubleColon.tag')).toBeFalsy();
            expect(fn('Program:noExtraColon:tag')).toBeFalsy();
            expect(fn('Program:program.tag.singleDimMemArrayOk[0]')).toBeTruthy();
            expect(fn('Program:program.tag.noMultiDimMemArray[0,0]')).toBeFalsy();
            expect(fn('Program:program.tag.memberArray[0]._0member[4]._another_1member.f1nal_member.5')).toBeFalsy();
            expect(fn('Program:9noNumberProgram.tag')).toBeFalsy();
            expect(fn('tag.9noNumberMember')).toBeFalsy();
            expect(fn('tag.noDouble__underscore1')).toBeFalsy();
            expect(fn('tag.__noDoubleUnderscore2')).toBeFalsy();
            expect(fn('tag.noEndInUnderscore_')).toBeFalsy();
            expect(fn('tag._member_Length_Ok_And_ShouldPassAt40Char')).toBeTruthy();
            expect(fn('tag._memberLengthTooLongAndShouldFailAt41Char')).toBeFalsy();
            expect(fn('tag..noDoubleDelimitters')).toBeFalsy();
            expect(fn('Local:1:I.Data')).toBeTruthy();
            expect(fn('Local:1:I.Data.3')).toBeFalsy();
            expect(fn('Remote_Rack:I.Data[1].5')).toBeFalsy();
            expect(fn('Remote_Rack:O.Data[1].5')).toBeFalsy();
            expect(fn('Remote_Rack:C.Data[1].5')).toBeFalsy();
            expect(fn('Remote_Rack:1:I.0')).toBeFalsy();
        });
    });
});
