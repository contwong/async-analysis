'use strict';

var async = {};
// 空函数
function noop() {}

// 瀑布（串行有关联）
async.waterfall = function (tasks, callback) {
  // 最终回调函数设默认参数
  callback = _once(callback || noop);
  if (!_isArray(tasks)) {
    var err = new Error('First argument to waterfall must be an array of functions');
    return callback(err);
  }
  if (!tasks.length) {
    // 任务结束
    return callback();
  }
  // 包裹迭代器，iterator=fn，包裹fn
  function wrapIterator(iterator) {
    console.log('包裹任务');
    // 生成内部callback
    return _restParam(
      // 内部callback的具体操作，args是被调用的参数
      function (err, args) {
        console.log('内部callback');
        if (err) {
          // 最终回调函数，带上err和传递的参数
          callback.apply(null, [err].concat(args));
        }
        else {
          console.log('参数加入callback');
          // 获取下一任务
          var next = iterator.next();
          if (next) {
            // 包裹下一任务，用于内部callback启动
            console.log('包裹下一任务');
            // args.push(wrapIterator(makeCallback(index + 1));
            args.push(wrapIterator(next));
          }
          else {
            // 最终回调函数推入args
            args.push(callback);
          }
          // 执行当前任务并带上传递的参数
          ensureAsync(iterator).apply(null, args);
        }
      }
    );
  }
  // 生成单任务调用一次，包裹单任务调用一次，生成内部callback调用一次
  // warpIterator(makeCallback(0))();
  wrapIterator(async.iterator(tasks))();
};

async.iterator = function (tasks) {
  function makeCallback(index) {
    console.log('生成单任务');
    function fn() {
      if (tasks.length) {
        console.log('执行当前任务');
        // 执行单个任务，arguments包含内部callback
        tasks[index].apply(null, arguments);
      }
      return fn.next();
    }
    fn.next = function () {
      return (index < tasks.length - 1) ? makeCallback(index + 1): null;
    };
    return fn;
  }
  // 返回单任务;
  return makeCallback(0);
};

// 确保异步
function ensureAsync(fn) {
  return _restParam(
    // 执行当前任务
    function (args) {
      console.log('内部callback加上参数');
      // 下一任务或最终回调函数
      var callback = args.pop();
      args.push(
        // 内部callback
        function () {
          var innerArgs = arguments;
          // 启动下一任务并带上参数
          if (sync) {
            async.setImmediate(function () {
              callback.apply(null, innerArgs);
            });
          } else {
            callback.apply(null, innerArgs);
          }
        }
      );
      var sync = true;
      // 执行当前任务，args包含内部callback
      fn.apply(this, args);
      sync = false;
    }
  );
}

// 剩余参数，startIndex为除去error的参数位置
// Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
// This accumulates the arguments passed into an array, after a given index.
// From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
function _restParam(func, startIndex) {
  // +startIndex 转换数字类型
  startIndex = startIndex == null ? func.length - 1 : +startIndex;
  // 返回内部callback，调用传参将绑定到func
  return function() {
    // 参数从实际调用获得
    var length = Math.max(arguments.length - startIndex, 0);
    var rest = Array(length);
    for (var index = 0; index < length; index++) {
      rest[index] = arguments[index + startIndex];
    }
    // func是内部callback具体操作，return为了省去break
    // func确定则case选择也确定
    switch (startIndex) {
      case 0: return func.call(this, rest);
      case 1: return func.call(this, arguments[0], rest);
    }
    // Currently unused but handle cases outside of the switch statement:
    // var args = Array(startIndex + 1);
    // for (index = 0; index < startIndex; index++) {
    //     args[index] = arguments[index];
    // }
    // args[startIndex] = rest;
    // return func.apply(this, args);
  };
}

function _once(fn) {
  return function() {
    if (fn === null) return;
    fn.apply(this, arguments);
    fn = null;
  };
}

var _isArray = Array.isArray || function (obj) {
  return _toString.call(obj) === '[object Array]';
};

// 立即函数
// capture the global reference to guard against fakeTimer mocks
var _setImmediate = typeof setImmediate === 'function' && setImmediate;

var _delay = _setImmediate
  ? function(fn) {
  // not a direct alias for IE10 compatibility
  _setImmediate(fn);
}
  : function(fn) {
  setTimeout(fn, 0);
};

if (typeof process === 'object' && typeof process.nextTick === 'function') {
  async.nextTick = process.nextTick;
} else {
  async.nextTick = _delay;
}
async.setImmediate = _setImmediate ? _delay : async.nextTick;

async.waterfall(
  [
    function (callback) {
      console.log('first');
      callback(null, 'one', 'two');
    },
    function (arg1, arg2, callback) {
      console.log(arg1, arg2);
      callback(null, 'three');
    },
    function (arg1, callback) {
      console.log(arg1);
      callback(null, 'done');
    }
  ],
  function (err, result) {
    console.log(err, result);
  }
);
