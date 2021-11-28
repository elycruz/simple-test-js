import {TestSuites, TestSuite} from "./index.mjs";
import {jsonClone} from "./utils.mjs";
import {TEST_SUITE_RUN} from "./constants.mjs";

const {assert, log, error, group: testGroup, groupEnd: testGroupEnd} = console,

  hasOwnProperty = (str, x) => Object.prototype.hasOwnProperty.call(x, str),

  assertHasOwnProperties = (strList = [], xTypeStr = '', x = null) => strList.forEach(k => {
    assert(hasOwnProperty(k, x),
      `${xTypeStr} should have own property "${k}".`)
  }),

  expectedTestSuitePropNames = ['idx', 'it', 'name', 'onComplete', 'runDefinition', 'test'],
  expectedTestSuitesPropNames = ['describe'].concat(expectedTestSuitePropNames),

  AsyncFunction = (async () => {
  }).constructor,
  isAsyncFunction = x => x instanceof AsyncFunction,

  _suite = (name, testSuite) => {
    if (!isAsyncFunction(testSuite)) {
      testGroup(name);
    } else {
      log(name);
    }
    const t0 = performance.now();
    const rslt = testSuite();
    if (rslt && rslt instanceof Promise) {
      return rslt.then(() => {
          log(`${name} completed after ${Math.round((performance.now() - t0) * 1000)}ms`);
        },
        err => {
          error(`${name} failed after ${Math.round((performance.now() - t0) * 1000)}ms; ${err}`);
        });
    } else if (!isAsyncFunction(testSuite)) {
      testGroupEnd();
      log(`/${name} completed after ${Math.round((performance.now() - t0) * 1000)}ms`)
    }
  };

log(`Running test suites ...`)
log(`... if no errors, suites passed ...`);

_suite('#TestSuite', () => {
  _suite('Constructor', () => {
    assert(TestSuite instanceof Function, `${TestSuite.name} constructor should be an \`instanceof Function\``);
  });

  _suite('Properties', () => {
    const testSuite = new TestSuite();
    assertHasOwnProperties(expectedTestSuitePropNames, testSuite.constructor.name, testSuite);
  });

  _suite('#.onComplete', async () => {
    const ts = new TestSuite({
      name: 'Testing',
      onComplete: x => {
        log('onComplete hit');
        if (!(x instanceof TestSuite) || x !== ts) {
          throw new Error('Expected `onComplete` to be called with calling instance of `TestSuite`');
        }
      }
    });

    ts.runDefinition();

    await ts[TEST_SUITE_RUN]().catch(err => {
      throw err;
    });
  });
});

_suite('#TestSuites', () => {
  // Constructor
  // ----
  _suite('Constructor', () => {
    assert(TestSuites instanceof Function, `${TestSuites.name} constructor should be an \`instanceof Function\``);
    assert((new TestSuites()) instanceof TestSuite, `\`#${TestSuites.name}\` should be instanceof \`${TestSuite.name}\``);
  });

  // Properties
  // ----
  _suite('Properties', () => {
    // ----
    _suite('Own Properties', () => {
      const testSuites = new TestSuites();
      assertHasOwnProperties(expectedTestSuitesPropNames, testSuites.constructor.name, testSuites);
    });

    // Enumerable props
    // ----
    _suite('Enumerable Properties (should show via `toJSON()` etc.)', () => {
      const testSuites2 = new TestSuites(),
        asData = jsonClone(testSuites2);
      assertHasOwnProperties(['name', 'idx'], testSuites2.constructor.name, asData);
    });
  });

});
