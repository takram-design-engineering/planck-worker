(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Planck = global.Planck || {})));
}(this, (function (exports) { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var rngBrowser = createCommonjsModule(function (module) {
	  // Unique ID creation requires a high quality random # generator.  In the
	  // browser this is a little complicated due to unknown quality of Math.random()
	  // and inconsistent support for the `crypto` API.  We do the best we can via
	  // feature-detection

	  // getRandomValues needs to be invoked in a context where "this" is a Crypto
	  // implementation. Also, find the complete implementation of crypto on IE11.
	  var getRandomValues = typeof crypto != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto);

	  if (getRandomValues) {
	    // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
	    var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

	    module.exports = function whatwgRNG() {
	      getRandomValues(rnds8);
	      return rnds8;
	    };
	  } else {
	    // Math.random()-based (RNG)
	    //
	    // If all else fails, use Math.random().  It's fast, but is of unspecified
	    // quality.
	    var rnds = new Array(16);

	    module.exports = function mathRNG() {
	      for (var i = 0, r; i < 16; i++) {
	        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
	        rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
	      }

	      return rnds;
	    };
	  }
	});

	/**
	 * Convert array of 16 byte values to UUID string format of the form:
	 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
	 */
	var byteToHex = [];
	for (var i = 0; i < 256; ++i) {
	  byteToHex[i] = (i + 0x100).toString(16).substr(1);
	}

	function bytesToUuid(buf, offset) {
	  var i = offset || 0;
	  var bth = byteToHex;
	  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
	  return [bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]]].join('');
	}

	var bytesToUuid_1 = bytesToUuid;

	function v4(options, buf, offset) {
	  var i = buf && offset || 0;

	  if (typeof options == 'string') {
	    buf = options === 'binary' ? new Array(16) : null;
	    options = null;
	  }
	  options = options || {};

	  var rnds = options.random || (options.rng || rngBrowser)();

	  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
	  rnds[6] = rnds[6] & 0x0f | 0x40;
	  rnds[8] = rnds[8] & 0x3f | 0x80;

	  // Copy bytes to buffer, if provided
	  if (buf) {
	    for (var ii = 0; ii < 16; ++ii) {
	      buf[i + ii] = rnds[ii];
	    }
	  }

	  return buf || bytesToUuid_1(rnds);
	}

	var v4_1 = v4;

	// The MIT License
	// Copyright (C) 2016-Present Shota Matsuda

	/* eslint-env worker */
	/* eslint-disable no-new-func */

	var isBrowser = function () {
	  try {
	    if (new Function('return this === window')()) {
	      return true;
	    }
	  } catch (error) {}
	  return false;
	}();

	var isWorker = !isBrowser && function () {
	  try {
	    if (new Function('return this === self')()) {
	      return true;
	    }
	  } catch (error) {}
	  return false;
	}();

	var isNode = !isBrowser && !isWorker && function () {
	  try {
	    if (new Function('return this === global')()) {
	      return true;
	    }
	  } catch (error) {}
	  return false;
	}();

	var globalScope = function () {
	  if (isBrowser) {
	    return window;
	  }
	  if (isWorker) {
	    return self;
	  }
	  if (isNode) {
	    return global;
	  }
	  return undefined;
	}();

	var Global = {
	  isBrowser: isBrowser,
	  isWorker: isWorker,
	  isNode: isNode,
	  scope: globalScope
	};

	var pathBrowserify = createCommonjsModule(function (module, exports) {
	  // Copyright Joyent, Inc. and other Node contributors.
	  //
	  // Permission is hereby granted, free of charge, to any person obtaining a
	  // copy of this software and associated documentation files (the
	  // "Software"), to deal in the Software without restriction, including
	  // without limitation the rights to use, copy, modify, merge, publish,
	  // distribute, sublicense, and/or sell copies of the Software, and to permit
	  // persons to whom the Software is furnished to do so, subject to the
	  // following conditions:
	  //
	  // The above copyright notice and this permission notice shall be included
	  // in all copies or substantial portions of the Software.
	  //
	  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	  // USE OR OTHER DEALINGS IN THE SOFTWARE.

	  // resolves . and .. elements in a path array with directory names there
	  // must be no slashes, empty elements, or device names (c:\) in the array
	  // (so also no leading and trailing slashes - it does not distinguish
	  // relative and absolute paths)
	  function normalizeArray(parts, allowAboveRoot) {
	    // if the path tries to go above the root, `up` ends up > 0
	    var up = 0;
	    for (var i = parts.length - 1; i >= 0; i--) {
	      var last = parts[i];
	      if (last === '.') {
	        parts.splice(i, 1);
	      } else if (last === '..') {
	        parts.splice(i, 1);
	        up++;
	      } else if (up) {
	        parts.splice(i, 1);
	        up--;
	      }
	    }

	    // if the path is allowed to go above the root, restore leading ..s
	    if (allowAboveRoot) {
	      for (; up--; up) {
	        parts.unshift('..');
	      }
	    }

	    return parts;
	  }

	  // Split a filename into [root, dir, basename, ext], unix version
	  // 'root' is just a slash, or nothing.
	  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	  var splitPath = function splitPath(filename) {
	    return splitPathRe.exec(filename).slice(1);
	  };

	  // path.resolve([from ...], to)
	  // posix version
	  exports.resolve = function () {
	    var resolvedPath = '',
	        resolvedAbsolute = false;

	    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	      var path = i >= 0 ? arguments[i] : process.cwd();

	      // Skip empty and invalid entries
	      if (typeof path !== 'string') {
	        throw new TypeError('Arguments to path.resolve must be strings');
	      } else if (!path) {
	        continue;
	      }

	      resolvedPath = path + '/' + resolvedPath;
	      resolvedAbsolute = path.charAt(0) === '/';
	    }

	    // At this point the path should be resolved to a full absolute path, but
	    // handle relative paths to be safe (might happen when process.cwd() fails)

	    // Normalize the path
	    resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function (p) {
	      return !!p;
	    }), !resolvedAbsolute).join('/');

	    return (resolvedAbsolute ? '/' : '') + resolvedPath || '.';
	  };

	  // path.normalize(path)
	  // posix version
	  exports.normalize = function (path) {
	    var isAbsolute = exports.isAbsolute(path),
	        trailingSlash = substr(path, -1) === '/';

	    // Normalize the path
	    path = normalizeArray(filter(path.split('/'), function (p) {
	      return !!p;
	    }), !isAbsolute).join('/');

	    if (!path && !isAbsolute) {
	      path = '.';
	    }
	    if (path && trailingSlash) {
	      path += '/';
	    }

	    return (isAbsolute ? '/' : '') + path;
	  };

	  // posix version
	  exports.isAbsolute = function (path) {
	    return path.charAt(0) === '/';
	  };

	  // posix version
	  exports.join = function () {
	    var paths = Array.prototype.slice.call(arguments, 0);
	    return exports.normalize(filter(paths, function (p, index) {
	      if (typeof p !== 'string') {
	        throw new TypeError('Arguments to path.join must be strings');
	      }
	      return p;
	    }).join('/'));
	  };

	  // path.relative(from, to)
	  // posix version
	  exports.relative = function (from, to) {
	    from = exports.resolve(from).substr(1);
	    to = exports.resolve(to).substr(1);

	    function trim(arr) {
	      var start = 0;
	      for (; start < arr.length; start++) {
	        if (arr[start] !== '') break;
	      }

	      var end = arr.length - 1;
	      for (; end >= 0; end--) {
	        if (arr[end] !== '') break;
	      }

	      if (start > end) return [];
	      return arr.slice(start, end - start + 1);
	    }

	    var fromParts = trim(from.split('/'));
	    var toParts = trim(to.split('/'));

	    var length = Math.min(fromParts.length, toParts.length);
	    var samePartsLength = length;
	    for (var i = 0; i < length; i++) {
	      if (fromParts[i] !== toParts[i]) {
	        samePartsLength = i;
	        break;
	      }
	    }

	    var outputParts = [];
	    for (var i = samePartsLength; i < fromParts.length; i++) {
	      outputParts.push('..');
	    }

	    outputParts = outputParts.concat(toParts.slice(samePartsLength));

	    return outputParts.join('/');
	  };

	  exports.sep = '/';
	  exports.delimiter = ':';

	  exports.dirname = function (path) {
	    var result = splitPath(path),
	        root = result[0],
	        dir = result[1];

	    if (!root && !dir) {
	      // No dirname whatsoever
	      return '.';
	    }

	    if (dir) {
	      // It has a dirname, strip trailing slash
	      dir = dir.substr(0, dir.length - 1);
	    }

	    return root + dir;
	  };

	  exports.basename = function (path, ext) {
	    var f = splitPath(path)[2];
	    // TODO: make this comparison case-insensitive on windows?
	    if (ext && f.substr(-1 * ext.length) === ext) {
	      f = f.substr(0, f.length - ext.length);
	    }
	    return f;
	  };

	  exports.extname = function (path) {
	    return splitPath(path)[3];
	  };

	  function filter(xs, f) {
	    if (xs.filter) return xs.filter(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	      if (f(xs[i], i, xs)) res.push(xs[i]);
	    }
	    return res;
	  }

	  // String.prototype.substr - negative index don't work in IE8
	  var substr = 'ab'.substr(-1) === 'b' ? function (str, start, len) {
	    return str.substr(start, len);
	  } : function (str, start, len) {
	    if (start < 0) start = str.length + start;
	    return str.substr(start, len);
	  };
	});
	var pathBrowserify_1 = pathBrowserify.resolve;
	var pathBrowserify_2 = pathBrowserify.normalize;
	var pathBrowserify_3 = pathBrowserify.isAbsolute;
	var pathBrowserify_4 = pathBrowserify.join;
	var pathBrowserify_5 = pathBrowserify.relative;
	var pathBrowserify_6 = pathBrowserify.sep;
	var pathBrowserify_7 = pathBrowserify.delimiter;
	var pathBrowserify_8 = pathBrowserify.dirname;
	var pathBrowserify_9 = pathBrowserify.basename;
	var pathBrowserify_10 = pathBrowserify.extname;

	var asyncToGenerator = function (fn) {
	  return function () {
	    var gen = fn.apply(this, arguments);
	    return new Promise(function (resolve, reject) {
	      function step(key, arg) {
	        try {
	          var info = gen[key](arg);
	          var value = info.value;
	        } catch (error) {
	          reject(error);
	          return;
	        }

	        if (info.done) {
	          resolve(value);
	        } else {
	          return Promise.resolve(value).then(function (value) {
	            step("next", value);
	          }, function (err) {
	            step("throw", err);
	          });
	        }
	      }

	      return step("next");
	    });
	  };
	};

	var classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	var createClass = function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	      Object.defineProperty(target, descriptor.key, descriptor);
	    }
	  }

	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	}();

	var _extends = Object.assign || function (target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i];

	    for (var key in source) {
	      if (Object.prototype.hasOwnProperty.call(source, key)) {
	        target[key] = source[key];
	      }
	    }
	  }

	  return target;
	};

	var slicedToArray = function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;

	    try {
	      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);

	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }

	    return _arr;
	  }

	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if (Symbol.iterator in Object(arr)) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	}();

	var toConsumableArray = function (arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

	    return arr2;
	  } else {
	    return Array.from(arr);
	  }
	};

	// The MIT License

	function branchingImport(arg) {
	  // Assuming `process.browser` is defined via DefinePlugin on webpack, this
	  // conditional will be determined at transpilation time, and `else` block will
	  // be completely removed in order to prevent webpack from bundling module.
	  var name = void 0;
	  var id = void 0;
	  if (typeof arg === 'string') {
	    id = arg;
	    name = arg;
	  } else {
	    var _Object$keys = Object.keys(arg);

	    var _Object$keys2 = slicedToArray(_Object$keys, 1);

	    id = _Object$keys2[0];

	    name = arg[id];
	  }
	  if (process.browser) {
	    return globalScope[name];
	  } else {
	    if (!isNode) {
	      return undefined;
	    }
	    try {
	      return require(id);
	    } catch (error) {}
	    return undefined;
	  }
	}

	function runtimeImport(id) {
	  // This will throw error on browser, in which `process` is typically not
	  // defined in the global scope. Re-importing after defining `process.browser`
	  // in the global scope will evaluate the conditional in
	  // `branchingImport` for rollup's bundles.
	  try {
	    return branchingImport(id);
	  } catch (e) {
	    globalScope.process = {
	      browser: !isNode
	    };
	  }
	  return branchingImport(id);
	}

	function importOptional(id) {
	  var module = runtimeImport(id);
	  if (module === undefined) {
	    return {};
	  }
	  return module;
	}

	function importRequired(id) {
	  var module = runtimeImport(id);
	  if (module === undefined) {
	    if (isNode) {
	      throw new Error('Could not resolve module "' + id + '"');
	    } else {
	      throw new Error('"' + id + '" isn\u2019t defined in the global scope');
	    }
	  }
	  return module;
	}

	function importNode(id) {
	  var module = runtimeImport(id);
	  if (module === undefined) {
	    if (isNode) {
	      throw new Error('Could not resolve module "' + id + '"');
	    }
	    return {};
	  }
	  return module;
	}

	function importBrowser(id) {
	  var module = runtimeImport(id);
	  if (module === undefined) {
	    if (!isNode) {
	      throw new Error('"' + id + '" isn\u2019t defined in the global scope');
	    }
	    return {};
	  }
	  return module;
	}

	Object.assign(runtimeImport, {
	  optional: importOptional,
	  required: importRequired,
	  node: importNode,
	  browser: importBrowser
	});

	// The MIT License

	var nodePath = importNode('path');

	var _ref = function () {
	  if (isNode) {
	    return nodePath;
	  }
	  return _extends({}, pathBrowserify, {
	    resolve: function resolve() {
	      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
	      }

	      return pathBrowserify.resolve.apply(pathBrowserify, ['/'].concat(args));
	    }
	  });
	}();

	var resolve = _ref.resolve,
	    normalize = _ref.normalize,
	    join = _ref.join,
	    relative = _ref.relative,
	    dirname = _ref.dirname,
	    basename = _ref.basename,
	    extname = _ref.extname,
	    delimiter = _ref.delimiter,
	    sep = _ref.sep;


	var FilePath = {
	  resolve: resolve,
	  normalize: normalize,
	  join: join,
	  relative: relative,
	  dirname: dirname,
	  basename: basename,
	  extname: extname,
	  delimiter: delimiter,
	  sep: sep
	};

	// The MIT License
	// Copyright (C) 2016-Present Shota Matsuda

	function createNamespace(name) {
	  var symbol = Symbol(name);
	  return function namespace(object, init) {
	    if (object[symbol] == null) {
	      if (typeof init === 'function') {
	        object[symbol] = init({});
	      } else {
	        object[symbol] = {};
	      }
	    }
	    return object[symbol];
	  };
	}

	// The MIT License

	var internal = createNamespace('Worker');

	function handleApply(property, uuid) {
	  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
	    args[_key - 2] = arguments[_key];
	  }

	  var _this = this;

	  return new Promise(function (resolve$$1, reject) {
	    var scope = internal(_this);
	    var worker = scope.worker;

	    var callback = function callback(event) {
	      if (event.data.uuid !== uuid) {
	        return;
	      }
	      if (event.data.error) {
	        reject(new Error(event.data.error));
	      } else {
	        resolve$$1(_this.constructor.transform(event.data.result, property));
	      }
	      worker.removeEventListener('message', callback, false);
	      --scope.running;
	      if (scope.running < 0) {
	        throw new Error();
	      }
	    };
	    worker.addEventListener('message', callback, false);
	    worker.postMessage({ property: property, uuid: uuid, args: args });
	    ++scope.running;
	  });
	}

	var Worker = function () {
	  // This constructor provides for inheritance only
	  function Worker() {
	    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
	        name = _ref.name,
	        _ref$path = _ref.path,
	        path = _ref$path === undefined ? FilePath.self : _ref$path;

	    classCallCheck(this, Worker);

	    var scope = internal(this);
	    scope.running = 0;
	    scope.name = name || this.constructor.name;
	    scope.worker = new Global.scope.Worker(path);

	    // Post initial message
	    scope.worker.postMessage(scope.name);
	  }

	  createClass(Worker, [{
	    key: 'get',
	    value: function get$$1(target, property, receiver) {
	      if (property === 'running') {
	        return Reflect.get(this, property);
	      }
	      return handleApply.bind(this, property, v4_1());
	    }
	  }, {
	    key: 'running',
	    get: function get$$1() {
	      var scope = internal(this);
	      return scope.running;
	    }
	  }], [{
	    key: 'transform',
	    value: function transform(result) {
	      return result;
	    }
	  }, {
	    key: 'inverseTransform',
	    value: function inverseTransform(result) {
	      return result;
	    }
	  }, {
	    key: 'new',
	    value: function _new() {
	      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	        args[_key2] = arguments[_key2];
	      }

	      return new Proxy({}, new (Function.prototype.bind.apply(this, [null].concat(args)))());
	    }
	  }]);
	  return Worker;
	}();

	// The MIT License

	var Transferable = function Transferable(message) {
	  var list = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
	  classCallCheck(this, Transferable);

	  this.message = message;
	  this.list = list;
	};

	var internal$1 = createNamespace('WorkerInstance');

	var WorkerInstance = function () {
	  function WorkerInstance() {
	    classCallCheck(this, WorkerInstance);

	    var scope = internal$1(this);
	    scope.handleMessage = this.handleMessage.bind(this);
	  }

	  createClass(WorkerInstance, [{
	    key: 'start',
	    value: function start() {
	      if (!Global.isWorker) {
	        throw new Error('Attempt to start worker instance on non-worker');
	      }
	      var scope = internal$1(this);
	      self.addEventListener('message', scope.handleMessage, false);
	      console.log(this.constructor.name + ' started');
	    }
	  }, {
	    key: 'stop',
	    value: function stop() {
	      var scope = internal$1(this);
	      self.removeEventListener('message', scope.handleMessage, false);
	      console.log(this.constructor.name + ' stopped');
	    }
	  }, {
	    key: 'transfer',
	    value: function transfer(message) {
	      var list = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

	      throw new Transferable(message, list);
	    }
	  }, {
	    key: 'handleMessage',
	    value: function () {
	      var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(event) {
	        var _event$data, property, uuid, args, result;

	        return regeneratorRuntime.wrap(function _callee$(_context) {
	          while (1) {
	            switch (_context.prev = _context.next) {
	              case 0:
	                _event$data = event.data, property = _event$data.property, uuid = _event$data.uuid, args = _event$data.args;
	                result = void 0;
	                _context.prev = 2;
	                _context.next = 5;
	                return Promise.resolve(this[property].apply(this, toConsumableArray(args)));

	              case 5:
	                result = _context.sent;
	                _context.next = 16;
	                break;

	              case 8:
	                _context.prev = 8;
	                _context.t0 = _context['catch'](2);

	                if (!(_context.t0 instanceof Transferable)) {
	                  _context.next = 14;
	                  break;
	                }

	                result = _context.t0;
	                _context.next = 16;
	                break;

	              case 14:
	                // Post the error message to the caller to tell the work failed, and
	                // rethrow it to see the error in console.
	                self.postMessage({ uuid: uuid, error: _context.t0.message || _context.t0 });
	                throw _context.t0;

	              case 16:
	                if (result instanceof Transferable) {
	                  self.postMessage({ uuid: uuid, result: result.message }, result.list);
	                } else {
	                  self.postMessage({ uuid: uuid, result: result });
	                }

	              case 17:
	              case 'end':
	                return _context.stop();
	            }
	          }
	        }, _callee, this, [[2, 8]]);
	      }));

	      function handleMessage(_x3) {
	        return _ref.apply(this, arguments);
	      }

	      return handleMessage;
	    }()
	  }], [{
	    key: 'register',
	    value: function register() {
	      var _this = this;

	      var handler = function handler(event) {
	        if (event.data === _this.name) {
	          var instance = new _this();
	          instance.start();
	          self.removeEventListener('message', handler, false);
	        }
	      };
	      self.addEventListener('message', handler, false);
	    }
	  }]);
	  return WorkerInstance;
	}();

	// The MIT License

	exports.Worker = Worker;
	exports.WorkerInstance = WorkerInstance;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=planck-worker.js.map
