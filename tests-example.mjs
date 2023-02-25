import {TestSuites} from "./index.mjs";
import {log, error} from "./utils.mjs";

const {describe, run: runSuites} = new TestSuites({name: 'tests-example.mjs'}),

  assert = (rslt, msg) => {
    if (!rslt) {
      throw new Error(`Assertion Failed: ${msg}`);
    }
    return rslt;
  };

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

  it('directly throwing an error', () => {
    if (!false) {
      throw new Error('Expected `true`');
    }
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

runSuites()
  .then(log, error);

