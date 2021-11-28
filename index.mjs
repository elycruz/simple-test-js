import {noop, jsonClone, log, error, info, table, milliSecondsNow, xMark} from "./utils.mjs";

import {
  DATA, SUITES,
  TEST_CASE_COMPLETE,
  TEST_CASE_DEFINE,
  TEST_CASE_RUN, TEST_SUITE_COMPLETE,
  TEST_SUITE_DEFINE,
  TEST_SUITE_RUN, TESTS
} from "./constants.mjs";

const successMsg = `"%s" after %sms`,
  errorMsg = `${xMark} + '  "%c%s" %o after %sms`,

  _ensureArgsFormat = (name, fn) => {
    if (typeof name != 'string' || typeof fn != 'function') {
      throw new Error(`\`${fn.name}\` arg types are incorrect`);
    }
  },

  defaultSuiteReporter = async suiteReport => {
    log(`${suiteReport.name} completed after ${suiteReport.timeElapsed}ms`);
    // table(suiteReport);
  },

  defaultSuitesReporter = async report => {
    log(`\n"${report.name}" test suites completed after ${report.timeElapsed}ms.  Results:`);
    table(report);
  }
;

const TestUnitSate = {
  Pending: 'pending',
  Running: 'running',
  Completed: 'completed',
  Failed: 'failed'
}

class TestSuiteData {
  name = '';
  testsCount = 0;
  testsRunCount = 0;
  testsFailedCount = 0;
  suitesCount = 0;
  suitesRunCount = 0;
  suitesFailedCount = 0;
  timeCountStart = 0;
  timeElapsed = 0;
  timeCountEnd = 0;

  constructor(props = {}) {
    Object.assign(this, props || {});
  }
}

export class TestUnit {
  idx = 0;
  name = '';
  onComplete = noop;
  runDefinition = noop;
  state = TestUnitSate.Pending;

  constructor(props = {}) {
    Object.assign(this, props || {});

    Object.defineProperties(this, {
      name: {
        value: this.name,
        enumerable: true
      },
      runDefinition: {
        value: this.runDefinition,
      },
      onComplete: {
        value: this.onComplete
      }
    });
  }
}

export class TestSuite extends TestUnit {
  it = this[TEST_CASE_DEFINE].bind(this);
  test = this.it;
  onComplete = defaultSuiteReporter;

  [DATA] = new TestSuiteData({name: this.name});
  [TESTS] = [];

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
    this[TESTS].push(fn);
    this[DATA].testsCount += 1;
    return this;
  }

  [TEST_CASE_RUN](name, fn) {
    _ensureArgsFormat(name, fn);

    const t0 = milliSecondsNow(),
      {[DATA]: data} = this;

    console.count(`"${name}" test`);

    data.testsRunCount += 1;

    try {
      const rslt = fn();
      if (rslt && rslt instanceof Promise) {
        return rslt
          .then(() => {
            // log(successMsg, name, milliSecondsNow() - t0);
          })
          .catch(err => {
            data.testsFailedCount += 1;
            error(`${xMark} "${name}" failed; %o`, `after ${milliSecondsNow() - t0}ms`, err);
            return err;
          });
      } else {
        // log(successMsg, name, milliSecondsNow() - t0);
      }
    } catch (err) {
      data.testsFailedCount += 1;
      error(`${xMark} "${name}" failed; %o`, `after ${milliSecondsNow() - t0}ms`, err);
      // error(errorMsg, name, err, milliSecondsNow() - t0);
    }
  }

  [TEST_SUITE_RUN]() {
    const {[TESTS]: tests, [DATA]: data} = this,
      onComplete = () => {
        data.timeElapsed =
          data.timeCountEnd = milliSecondsNow() - data.timeCountStart;
        this.state = TestUnitSate.Completed;
        return this.onComplete(data);
      };
    this.state = TestUnitSate.Running;
    log(`Running "${this.name}"`);
    data.timeCountStart = milliSecondsNow();
    return Promise.all(tests.map(f => this[TEST_CASE_RUN](f.testName, f)))
      .then(onComplete, onComplete);
  }
}

export class TestSuites extends TestSuite {
  static name = 'TestSuites';

  onComplete = defaultSuitesReporter;

  // beforeAll = noop;
  // beforeEach = noop;
  // afterAll = noop;
  // afterEach = noop;

  [DATA] = new TestSuiteData({name: this.name});
  [SUITES] = [];

  constructor(props = {}) {
    super(props);
    Object.defineProperties(this, {
      describe: {value: this[TEST_SUITE_DEFINE].bind(this)},
    });
  }

  [TEST_CASE_COMPLETE]() {
    throw new Error('Should not be called.');
  }

  [TEST_SUITE_COMPLETE](suite) {
    const {[DATA]: data} = this,
      suiteData = suite[DATA];

    data.suitesRunCount += 1;
    data.testsCount += suiteData.testsCount;
    data.testsRunCount += suiteData.testsRunCount;
    data.testsFailedCount += suiteData.testsFailedCount;
  }

  [TEST_SUITE_DEFINE](name, fn, idx = 0) {
    _ensureArgsFormat(name, fn);
    const testSuite = new TestSuite({
      name,
      runDefinition: fn,
      idx
    });
    testSuite.runDefinition(testSuite);
    this[SUITES].push(testSuite);
    this[DATA].suitesCount += 1;
    return this;
  }

  async [TEST_SUITE_RUN](suite) {
    const {name} = suite;
    const t0 = milliSecondsNow();
    const {[DATA]: data} = this;

    try {
      const rslt = suite[TEST_SUITE_RUN]();
      if (rslt && rslt instanceof Promise) {
        return rslt
          .then(() => {
            this[TEST_SUITE_COMPLETE](suite);
            // log(`"${name}" completed after ${milliSecondsNow() - t0}ms.`);
          })
          .catch(err => {
            data.suitesFailedCount += 1;
            this[TEST_SUITE_COMPLETE](suite);
            error(`${xMark} "${name}" suite ${err}; completed after ${milliSecondsNow() - t0}ms.`);
          });
      } else {
        this[TEST_SUITE_COMPLETE](suite);
        // log(`"${name}" completed after ${milliSecondsNow() - t0}ms.`);
      }
    } catch (err) {
      data.suitesFailedCount += 1;
      this[TEST_SUITE_COMPLETE](suite);
      error(`${xMark} "${name}" suite ${err} completed after  ${milliSecondsNow() - t0}ms.`);
    }
  }

  run = async () => {
    const {[SUITES]: suites, [DATA]: data} = this,
      onComplete = async () => {
        data.timeCountEnd =
          data.timeElapsed = milliSecondsNow() - data.timeCountStart;
        return this.onComplete(data);
      };
    data.timeCountStart = milliSecondsNow();
    return Promise.all(suites.map(s => this[TEST_SUITE_RUN](s)))
      .then(onComplete, onComplete);
  }
}
