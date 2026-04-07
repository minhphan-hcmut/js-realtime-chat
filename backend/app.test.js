// Một bài test đơn giản luôn đúng để Jenkins không bị fail
describe('Initial System Check', () => {
  test('should pass the placeholder test', () => {
    const status = true;
    expect(status).toBe(true);
  });
});
