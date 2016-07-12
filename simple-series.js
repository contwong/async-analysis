'use strict';

var async = {};

async.series = function (tasks, callback) {
  var results = Array.isArray(tasks) ? [] : {};
  var keys = Object.keys(tasks);
  var key = keys.shift();
  callback = callback || noop;
  execute(tasks[key], key);

  // 执行当前任务
  function execute(task, key) {
    task(restParam(invoke));

    // 启动下一任务
    function invoke(err, args) {
      if (err) {
        // end
        return callback(err, results);
      }
      results[key] = args.length <= 1 ? args[0] : args;
      key = keys.shift();
      // next or end
      return key ? execute(tasks[key], key) : callback(err, results);
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

async.series(
  [
    function (callback) {
      console.log('1');
      callback(null, 'one');
    },
    function (callback) {
      console.log('2');
      // callback(true);
      callback(null, 'two');
    },
    function (callback) {
      console.log('3');
      callback(null, 'three');
    }
  ],
  function (err, results) {
    console.log('4');
    console.log(err, results);
  }
);

async.series(
  {
    one: function (callback) {
      setTimeout(function () {
        console.log('1');
        callback(null, 1);
      }, 2000);
    },
    two: function (callback) {
      setTimeout(function () {
        console.log('2');
        callback(null, 2);
      }, 1000);
    }
  },
  function (err, results) {
    console.log(err, results);
  }
);
