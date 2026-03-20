import '@testing-library/jest-dom';


if (typeof global.Request === 'undefined') {
  (global as any).Request = class {
    constructor() {}
  };
}

if (typeof global.Headers === 'undefined') {
  (global as any).Headers = class {
    getSetCookie() { return []; }
    get() { return null; }
    set() {}
    append() {}
    forEach() {}
  };
}

if (typeof global.Response === 'undefined' || !(global.Response as any).json) {
  const ResponseMock = function(this: any, body: any, init?: any) {
    this._body = body;
    this.status = init && typeof init.status === 'number' ? init.status : 200;
    this.headers = { get: () => null, set: () => {}, append: () => {}, forEach: () => {}, getSetCookie: () => [] };
  } as any;
  ResponseMock.prototype.json = async function() {
    return this._body;
  };
  ResponseMock.json = (data: any, init?: any) => {
    return new ResponseMock(data, init);
  };
  (global as any).Response = ResponseMock;
}
