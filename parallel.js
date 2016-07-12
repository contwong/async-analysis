'use strict';

var async = {};
// 空函数
function noop() {}

// 并行无关联，结果有顺序
async.parallel = function (tasks, callback) {
  _parallel(async.eachOf, tasks, callback);
};

// 并行，eachfn流程执行方式，callback最终回调函数
function _parallel(eachfn, tasks, callback) {
  // 最终回调函数设默认参数
  callback = callback || noop;
  // 最终结果数组
  var results = _isArrayLike(tasks) ? [] : {};

  eachfn(
    tasks,
    // 执行单任务
    function (task, key, callback) {
      // task为单任务，传参并调用
      task(
        // 生成内部callback
        _restParam(
          // 内部callback的具体操作，args是被调用的参数
          function (err, args) {
            if (args.length <= 1) {
              args = args[0];
            }
            // 结果数组
            results[key] = args;
            // 启动下一任务
            callback(err);
          }
        )
      );
    },
    // 少一个参数的最终回调函数
    function (err) {
      callback(err, results);
    }
  );
}

// 并行无关联执行方式
async.forEachOf =
// obj=tasks总任务，iterator任务迭代器，callback少一个参数的最终回调函数
async.eachOf = function (object, iterator, callback) {
  // 使最终回调函数只执行一次
  callback = _once(callback || noop);
  object = object || [];
  // 下一键名函数
  var iter = _keyIterator(object);
  var key, completed = 0;

  while ((key = iter()) != null) {
    completed += 1;
    // 执行任务
    iterator(object[key], key, only_once(done));
  }

  if (completed === 0) callback(null);

  // 启动最终回调函数
  function done(err) {
    completed--;
    if (err) {
      callback(err);
    }
    // Check key is null in case iterator isn't exhausted
    // and done resolved synchronously.
    else if (key === null && completed <= 0) {
      callback(null);
    }
  }
};

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

// 伪数组
function _isArrayLike(arr) {
  return _isArray(arr) || (
      // has a positive integer length property
      typeof arr.length === "number" &&
      arr.length >= 0 &&
      arr.length % 1 === 0
    );
}

var _isArray = Array.isArray || function (obj) {
  return _toString.call(obj) === '[object Array]';
};


// 回调执行一次，再次执行会报错
function only_once(fn) {
  return function() {
    if (fn === null) throw new Error("Callback was already called.");
    // 当前函数this和args，替代fn的this和args
    fn.apply(this, arguments);
    fn = null;
  };
}

function _once(fn) {
  return function() {
    if (fn === null) return;
    fn.apply(this, arguments);
    fn = null;
  };
}

// 键名迭代器，coll=obj
function _keyIterator(coll) {
  var i = -1;
  var len;
  var keys;
  if (_isArrayLike(coll)) {
    len = coll.length;
    return function next() {
      i++;
      return i < len ? i : null;
    };
  } else {
    keys = _keys(coll);
    len = keys.length;
    return function next() {
      i++;
      return i < len ? keys[i] : null;
    };
  }
}

// 键名数组
var _keys = Object.keys || function (obj) {
  var keys = [];
  for (var k in obj) {
    if (obj.hasOwnProperty(k)) {
      keys.push(k);
    }
  }
  return keys;
};

async.parallel(
  [
    function (callback) {
      setTimeout(function () {
        console.log('1');
        callback(null, 'one');
      }, 200);
    },
    function (callback) {
      setTimeout(function () {
        console.log('2');
        callback(null, 'two');
      }, 100);
    }
  ],
  function (err, results) {
    console.log(err, results);
  }
);

async.parallel(
  {
    one: function (callback) {
      setTimeout(function () {
        console.log('one');
        callback(null, 1);
      }, 200);
    },
    two: function (callback) {
      setTimeout(function () {
        console.log('two');
        callback(null, 2);
      }, 100);
    }
  },
  function (err, results) {
    console.log(err, results);
  }
);
