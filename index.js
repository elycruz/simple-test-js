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
    TEST_CASE_RUN = Symbol('testCaseRun'),
    DATA = Symbol('data')
;

export {jsonClone, assert, log, warn, error};

class TestSuite {

}

export class TestSuites {
    beforeAll = noop;
    beforeEach = noop;
    afterAll = noop;
    afterEach = noop;
    describe = noop;
    it = noop;

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
        Object.assign(this, options);
    }

    [TEST_SUITE_DEFINE](name, fn) {
        _ensureArgsFormat(name, fn);
        this[DATA].suitesMap.set(name, fn);
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

    [TEST_SUITE_RUN](name, fn) {
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
