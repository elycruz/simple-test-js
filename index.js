const {log, warn, assert, error} = console,

    jsonClone = x => JSON.parse(JSON.stringify(x)),
    noop = () => undefined,

    successMsg = `"%s" completed after %sms`,
    errorMsg = '%o errored out after %sms',

    _ensureArgsFormat = (name, fn) => {
        if (typeof name != 'string' || typeof fn != 'function') {
            throw new Error(`\`${fn.name}\` arg types are incorrect`);
        }
    },

    // Symbols
    // ----
    AFTER_ALL_METHOD = Symbol('afterAll'),
    AFTER_EACH_METHOD = Symbol('afterEach'),
    BEFORE_ALL_METHOD = Symbol('beforeAll'),
    BEFORE_EACH_METHOD = Symbol('beforeEach'),
    TEST_SUITE_DEFINE = Symbol('testSuiteDefine'),
    TEST_SUITE_RUN = Symbol('testSuiteRun'),
    TEST_CASE_DEFINE = Symbol('testCaseDefine'),
    TEST_CASE_RUN = Symbol('testCaseRun'),
    DATA = Symbol('data')
;

export {jsonClone, assert, log, warn, error};

class TestSuite {
    name;
    idx;

    [DATA] = {
        testsMap: new Map(),
        tests: {
            failed: 0,
            passed: 0,
        },
        timeElapsed: 0,
    };

    constructor(props = {}) {
        Object.assign(this, {name: '', value: noop, idx: 0}, props);
        Object.defineProperties(this, {
            name: {value: this.name, configurable: false},
            idx: {value: this.idx, configurable: false},
            value: {value: this.value, configurable: false},
        });
    }

    [TEST_CASE_DEFINE](name, fn) {
        _ensureArgsFormat(name, fn);
        this[DATA].testsMap.set(name, fn);
        return this;
    }

    [TEST_CASE_RUN](name, fn) {
        _ensureArgsFormat(name, fn);

        const t0 = performance.now();

        try {
            const rslt = fn();
            if (rslt && rslt instanceof Promise) {
                return rslt
                    .then(() => {
                        log(successMsg, name, (performance.now() - t0) * 1000);
                        this[DATA].tests.passed += 1;
                    })
                    .catch(err => {
                        error(`"${name}" ${err};  Errored out after ${Math.round((performance.now() - t0) * 1000)}ms`);
                        this[DATA].tests.failed += 1;
                        return err;
                    });
            } else {
                this[DATA].tests.passed += 1;
                log(successMsg, name, Math.round((performance.now() - t0) * 1000));
            }
        } catch (e) {
            this[DATA].tests.failed += 1;
            error(errorMsg, e, Math.round((performance.now() - t0) * 1000));
        }
    }

    [TEST_SUITE_RUN]() {
        const {[DATA]: {testsMap}} = this,
            entries = testsMap.entries(),
            out = new Array(testsMap.size).fill(null, testsMap.size);
        let i = 0;
        for (const [k, f] of entries) {
            out[i++] = this[TEST_CASE_RUN](k, f);
        }
        return Promise.all(out);
    }
}

export class TestSuites extends TestSuite {
    beforeAll = noop;
    beforeEach = noop;
    afterAll = noop;
    afterEach = noop;
    describe = noop;
    it = noop;
    test = noop;

    [DATA] = {
        suites: {
            failed: 0,
            passed: 0,
        },
        suitesMap: new Map(),
        tests: {
            failed: 0,
            passed: 0,
        },
        timeElapsed: 0,
    };

    constructor(options = {}) {
        super(options);
        Object.defineProperties(this, {
            it: {value: this[TEST_CASE_RUN].bind(this), configurable: false},
            test: {value: this[TEST_CASE_RUN].bind(this), configurable: false},
            describe: {value: this[TEST_SUITE_DEFINE].bind(this), configurable: false},
            numSuitesPassed: {
                get() {
                    return this[DATA].suites.passed;
                },
                enumerable: true
            },
            numSuitesFailed: {
                get() {
                    return this[DATA].suites.count - this.numSuitesPassed;
                },
                enumerable: true
            },
        });
    }

    [TEST_CASE_DEFINE](suite, name, fn) {
        _ensureArgsFormat(name, fn);
        suite[TEST_SUITE_DEFINE](name, fn);
        return this;
    }

    [TEST_SUITE_DEFINE](name, fn, idx = 0) {
        _ensureArgsFormat(name, fn);
        this[DATA].suitesMap.set(name, new TestSuite({name, value: fn, idx}));
    }

    [TEST_SUITE_RUN](suite) {
        const {name, value: fn} = suite;

        _ensureArgsFormat(name, fn);

        console.group(name);

        const t0 = performance.now();

        try {
            const rslt = fn();
            if (rslt && rslt instanceof Promise) {
                rslt
                    .then(() => {
                        log(`"${name}" completed after ${Math.round((performance.now() - t0) * 1000)}ms.`);
                        this[DATA].suites.passed += 1;
                    })
                    .catch(err => {
                        error(`${name} \`${err}\`, errored out after ${Math.round((performance.now() - t0) * 1000)}ms.`);
                        this[DATA].suites.failed += 1;
                    })
                    .finally(() => {
                        console.groupEnd();
                    });
            } else {
                log(`"${name}" completed after ${Math.round((performance.now() - t0) * 1000)}ms.`);
                this[DATA].suites.passed += 1;
                console.groupEnd();
            }
        } catch (err) {
            error(`"${name}" \`${err}\`, errored out after  ${Math.round((performance.now() - t0) * 1000)}ms.`);
            this[DATA].suites.failed += 1;
            console.groupEnd();
        }
    }

    run = async () => {
        const {[DATA]: {suitesMap}} = this,
            entries = suitesMap.entries(),
            out = new Array(suitesMap.size).fill(null, suitesMap.size);
        let i = 0;
        for (const [k, s] of entries) {
            out[i++] = this[TEST_SUITE_RUN](k, s);
        }
        return Promise.all(out).then(() => {

        });
    }
}
