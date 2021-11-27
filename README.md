# simple-test-js (work-in-progress)

A "no dependency" javascript testing library targeting "in browser" testing and "no tooling" projects (though can work with "tooling" projects).

## Ideas' Spec
- Library should be a factory method that can accept options and returns an object that contains `describe`, `it`, `test`, and other, methods.

## Usage

The library consist of functions that run and keep their own state and functions that are fashioned after 'mochajs', 'jasmine' and/or 'jest' (provides describe, it, and test etc. methods).

The other main difference is we expect the user to bring their own assertion libraries to the party (or better yet, use \`console\`'s \`assert\` (and other built-in methods) to acheive their testing requirements (examples to come later).

@todo

## API

@todo

- `(describe | testSuite)(string, (() => any) | (() => Promise<any>)): Promise<any>`
- `(it | test)(string, (() => any) | (() => Promise<any>)): Promise<any>`

## License
GPL

