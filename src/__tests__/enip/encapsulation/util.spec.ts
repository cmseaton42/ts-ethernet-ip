import {
    registerSession,
    unregisterSession,
    sendRRData,
    sendUnitData,
    listIdentity,
    listServices,
} from '../../../enip/encapsulation/util';

describe('Encapsulation utility functions', () => {
    describe('Register session utility', () => {
        it('Generates correct buffer', () => {
            const data = registerSession();

            expect(data).toMatchSnapshot();
        });
    });

    describe('Unregister session utility', () => {
        it('Generates correct buffer', () => {
            const data = unregisterSession(98705);

            expect(data).toMatchSnapshot();
        });
    });

    describe('SendRRData session utility', () => {
        it('Generates correct buffer', () => {
            const data = sendRRData(98705, Buffer.from('hello world'));

            expect(data).toMatchSnapshot();
        });
    });

    describe('SendUnitData session utility', () => {
        it('Generates correct buffer', () => {
            const data = sendUnitData(98705, Buffer.from('hello world'), 32145, 456);

            expect(data).toMatchSnapshot();
        });
    });

    describe('List Identity utility', () => {
        it('Generates correct buffer', () => {
            const data = listIdentity();

            expect(data).toMatchSnapshot();
        });
    });

    describe('List Services utility', () => {
        it('Generates correct buffer', () => {
            const data = listServices();

            expect(data).toMatchSnapshot();
        });
    });
});
