"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
describe('CloudLogger', () => {
    let logger;
    beforeAll(() => {
        logger = (0, __1.CloudLogger)();
    });
    it('should work while testing', () => {
        expect(() => logger.info({ labels: { companyId: 'dummyCompanyId', userId: 'dummyUserId' } }, 'Blaat')).not.toThrow();
    });
});
