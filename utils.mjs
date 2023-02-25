export const {log, info, table, error} = console,

  jsonClone = x => JSON.parse(JSON.stringify(x)),

  noop = () => undefined,

  milliSecondsNow = () => typeof performance != 'undefined' ? Math.round(performance.now()) * 100 : Date.now(),

  // Error symbol
  xMark = String.fromCodePoint(0x274C)
;
