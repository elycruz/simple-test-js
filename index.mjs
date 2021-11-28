import {noop, jsonClone, log, error} from "./utils.mjs";

import {
  DATA,
  TEST_CASE_COMPLETE,
  TEST_CASE_DEFINE,
  TEST_CASE_RUN, TEST_SUITE_COMPLETE,
  TEST_SUITE_DEFINE,
  TEST_SUITE_RUN
} from "./constants.mjs";

const successMsg = `"%s" completed after %sms`,
  errorMsg = '%o errored out after %sms',

  _ensureArgsFormat = (name, fn) => {
    if (typeof name != 'string' || typeof fn != 'function') {
      throw new Error(`\`${fn.name}\` arg types are incorrect`);
    }
  },

  defaultOnTestCaseComplete = suite => null,

  defaultOnTestSuiteComplete = suite => null
;

class TestUnit {
  idx = 0;
  name = '';
  onComplete = noop;
  run = noop;

  constructor(props = {}) {
    Object.assign(this, props || {});

    Object.defineProperties(this, {
      name: {
        value: this.name,
        enumerable: true
      },
      run: {
        value: this.run,
      },
      onComplete: {
        value: this.onComplete
      }
    });
  }
/*
  async runUnit() {
    const rslt = this.run();
    if (rslt && rslt instanceof Promise) return rslt.then(() => {
      log('test case message');
    }).catch(err => {
      log('err message', err);
    });
  }*/
}

export class TestSuite extends TestUnit {
  it = this[TEST_CASE_DEFINE].bind(this);
  test = this.it;

  // showTestCaseTimeElapsed = false;
  // showTimeElapsed = true;

  [DATA] = {
    testsList: [],
    testsMap: new Map(),
    tests: {
      count: 0,
      runCount: 0,
      failed: 0,
      passed: 0,
    },
    timeElapsed: 0,
  };

  constructor(props = {}) {
    super(props);
    Object.defineProperties(this, {
      it: {value: this.it},
      test: {value: this.it},
    });
  }

  [TEST_CASE_DEFINE](name, fn) {
    _ensureArgsFormat(name, fn);
    fn.testName = name;
    this[DATA].testsList.push(fn);
    this[DATA].testsMap.set(fn, name);
    this[DATA].tests.count += 1;
    return this;
  }

  [TEST_CASE_COMPLETE]() {
    const rslt =
      this[DATA].tests.runCount += 1;
    if (rslt === this[DATA].tests.count) {
      this.onComplete(this);
    }
  }

  [TEST_CASE_RUN](name, fn) {
    _ensureArgsFormat(name, fn);

    const t0 = performance.now(),
      {[DATA]: data} = this;

    console.count(`"${this.name}" test`)

    try {
      const rslt = fn();
      if (rslt && rslt instanceof Promise) {
        return rslt
          .then(() => {
            log(successMsg, name, (performance.now() - t0) * 1000);
            data.tests.passed += 1;
            this[TEST_CASE_COMPLETE]();
          })
          .catch(err => {
            error(`"${name}" ${err};  Errored out after ${Math.round((performance.now() - t0) * 1000)}ms`);
            this[DATA].tests.failed += 1;
            this[TEST_CASE_COMPLETE]();
            return err;
          });
      } else {
        this[DATA].tests.passed += 1;
        this[TEST_CASE_COMPLETE]();
        log(successMsg, name, Math.round((performance.now() - t0) * 1000));
      }
    } catch (e) {
      this[DATA].tests.failed += 1;
      this[TEST_CASE_COMPLETE]();
      error(errorMsg, e, Math.round((performance.now() - t0) * 1000));
    }
  }

  [TEST_SUITE_RUN]() {
    const {[DATA]: {testsList}} = this;
    return Promise.all(testsList.map(f => this[TEST_CASE_RUN](f.name, f)))
      .then(() => log(jsonClone(this[DATA])));
  }
}

export class TestSuites extends TestSuite {
  static name = 'TestSuites';

  // beforeAll = noop;
  // beforeEach = noop;
  // afterAll = noop;
  // afterEach = noop;

  [DATA] = {
    suites: {
      count: 0,
      runCount: 0,
      failed: 0,
      passed: 0,
    },
    suitesList: [],
    tests: {
      failed: 0,
      passed: 0,
    },
    timeElapsed: 0,
  };

  constructor(props = {}) {
    super(props);
    Object.defineProperties(this, {
      describe: {value: this[TEST_SUITE_DEFINE].bind(this)}
    });
  }

  [TEST_CASE_COMPLETE]() {
    throw new Error('Should not be called.');
  }

  [TEST_SUITE_COMPLETE](suite) {
    log(`Suite ${suite.name} completed`, suite);
  }

  [TEST_SUITE_DEFINE](name, fn, idx = 0) {
    _ensureArgsFormat(name, fn);
    const testSuite = new TestSuite({
      name,
      run: fn,
      idx,
      onComplete: this[TEST_SUITE_COMPLETE].bind(this)
    });
    testSuite.run(testSuite);
    this[DATA].suitesList.push(testSuite);
    this[DATA].suites.count += 1;
    return this;
  }

  async [TEST_SUITE_RUN](suite) {
    const {name, run: fn} = suite;

    _ensureArgsFormat(name, fn);

    const t0 = performance.now();

    try {
      const rslt = suite[TEST_SUITE_RUN]();
      if (rslt && rslt instanceof Promise) {
        rslt
          .then(() => {
            log(`"${name}" completed after ${Math.round((performance.now() - t0) * 1000)}ms.`);
            this[DATA].suites.passed += 1;
            this[TEST_SUITE_COMPLETE](suite);
          })
          .catch(err => {
            error(`${name} \`${err}\`, errored out after ${Math.round((performance.now() - t0) * 1000)}ms.`);
            this[TEST_SUITE_COMPLETE](suite);
            this[DATA].suites.failed += 1;
          })
          .finally(() => {
            // console.groupEnd();
          });
      } else {
        log(`"${name}" completed after ${Math.round((performance.now() - t0) * 1000)}ms.`);
        this[TEST_SUITE_COMPLETE](suite);
        this[DATA].suites.passed += 1;
        // console.groupEnd();
      }
    } catch (err) {
      error(`"${name}" \`${err}\`, errored out after  ${Math.round((performance.now() - t0) * 1000)}ms.`);
      this[TEST_SUITE_COMPLETE](suite);
      this[DATA].suites.failed += 1;
      // console.groupEnd();
    }
  }

  run = async () => {
    const {[DATA]: {suitesList}} = this;
    return Promise.all(suitesList.map(s => this[TEST_SUITE_RUN](s))).then(() => {
      log('print report');
    });
  }
}
