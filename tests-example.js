import {TestSuites, assert, log, error} from "./index.js";

const {describe, run: runTestSuites} = new TestSuites();

describe("Example Test Suite", ({it}) => {
  it('Successful test', () => {
    assert(true, 'Expected `true`');
  });

  it('Successful async test', () => {
    assert(true, 'Expected `true`');
  });

  it('Failing test', () => {
    assert(false, 'Expected `true`');
  });

  it('Failing async test', async () => {
    assert(false, 'Expected `true`');
  });

  describe('Nested suite', ({it}) => {
    it('Failing test 3', () => {
      assert(false, 'Expected `true`');
    });
    it('Failing test 3 async', async () => {
      assert(false, 'Expected `true`');
    });
  });

  describe('Nested "async" suite', async ({it}) => {
    it('Failing test 4', () => {
      assert(false, 'Expected `true`');
    });
    it('Failing test 4 async', async () => {
      assert(false, 'Expected `true`');
    });
  });
});

runTestSuites()
  .then(log, error);

