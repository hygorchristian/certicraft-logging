import { CloudLogger, Logger } from '..';

describe('CloudLogger', () => {
  let logger: Logger;

  beforeAll(() => {
    logger = CloudLogger();
  });

  it('should work while testing', () => {
    expect(() =>
      logger.info(
        { labels: { companyId: 'dummyCompanyId', userId: 'dummyUserId' } },
        'Blaat'
      )
    ).not.toThrow();
  });
});
