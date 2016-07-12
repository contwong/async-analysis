'use strict';

var async = {};

async.parallel = function (tasks, callback) {
  var results = Array.isArray(tasks) ? [] : {};
  var keys = Object.keys(tasks);
  var key = keys.shift();
  var completed = 0;
  callback = callback || noop;
  while (key) {
    completed++;
    execute(tasks[key], key);
    key = keys.shift();
  }

  // 执行当前任务
  function execute(task, key) {
    task(restParam(invoke));

    // 启动最终回调函数
    function invoke(err, args) {
      if (err) {
        return callback(err, results);
      }
      completed --;
      results[key] = args.length <= 1 ? args[0] : args;
      if (completed === 0) {
        return callback(err, results);
      }
    }
  }
};

function noop() {}

function restParam(fun) {
  return function () {
    var args = [].slice.apply(arguments);
    var err = args.shift();
    fun.call(null, err, args);
  };
}

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
