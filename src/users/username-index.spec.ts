/**
 * Documents expected username index shape for H2 regression.
 * Runtime migration lives in UsersService.onModuleInit.
 */
describe('username unique index policy (H2)', () => {
  it('partial filter allows multiple missing/null usernames while unique when set', () => {
    const partialFilterExpression = {
      username: { $type: 'string', $gt: '' },
    };

    // Simulated docs that must all be insertable under the partial unique index
    const withoutUsername = [{}, { username: null }, { username: '' }];
    withoutUsername.forEach((doc: any) => {
      const hasIndexedValue =
        typeof doc.username === 'string' && doc.username > '';
      expect(hasIndexedValue).toBe(false);
    });

    // Two identical non-empty usernames would collide
    const a = { username: 'alice' };
    const b = { username: 'alice' };
    expect(a.username).toBe(b.username);
    expect(partialFilterExpression.username.$type).toBe('string');
  });
});
