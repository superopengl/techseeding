import * as httpAssert from 'http-assert';

export function assert(condition, httpCode = 500, message?) {
  httpAssert(condition, httpCode, message);
}