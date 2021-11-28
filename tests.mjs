import {TestSuites, TestSuite} from "./index.mjs";
import {jsonClone, milliSecondsNow, xMark} from "./utils.mjs";
import {TEST_SUITE_RUN} from "./constants.mjs";

const {assert, log, error, group: testGroup, groupEnd: testGroupEnd} = console,

  hasOwnProperty = (str, x) => Object.prototype.hasOwnProperty.call(x, str),

  assertHasOwnProperties = (strList = [], xTypeStr = '', x = null) => strList.forEach(k => {
    assert(hasOwnProperty(k, x),
      `${xMark} ${xTypeStr} should have own property "${k}".`)
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
    const t0 = milliSecondsNow();
    const rslt = testSuite();
    if (rslt && rslt instanceof Promise) {
      return rslt.then(() => {
          log(`${name} completed after ${milliSecondsNow() - t0}ms`);
        },
        err => {
          error(`${name} failed after ${milliSecondsNow() - t0}ms; ${err}`);
        });
    } else if (!isAsyncFunction(testSuite)) {
      testGroupEnd();
      log(`/${name} completed after ${milliSecondsNow() - t0}ms`)
    }
  };

log(`Running test suites ...`)
log(`... if no errors, suites passed ...`);

_suite('#TestSuite', () => {
  _suite('Constructor', () => {
    assert(TestSuite instanceof Function, `${xMark} ${TestSuite.name} constructor should be an \`instanceof Function\``);
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
          throw new Error(`${xMark} Expected \`onComplete\` to be called with calling instance of \`TestSuite\``);
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
  _suite('Constructor', () => {
    assert(TestSuites instanceof Function, `${xMark} ${TestSuites.name} constructor should be an \`instanceof Function\``);
    assert((new TestSuites()) instanceof TestSuite, `${xMark} \`#${TestSuites.name}\` should be instanceof \`${TestSuite.name}\``);
  });

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

  _suite('#.describe', () => {
    const suites = new TestSuites({name: 'Test Suites Test'}),
      {describe} = suites;

    let captured = null;

    describe('Sync describe', ({it}) => {
      it('Should run this test case', () => {
        log('sync "describe" test ran');
        captured = true;
      });
    });

    suites.run().then(() => {
      if (!captured) throw new Error('');
    }).catch(err => error(`${xMark}`, err));
    if (!captured) throw new Error('');
  });
});
