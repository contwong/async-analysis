'use strict';

var async = {};

async.waterfall = function (tasks, callback) {
  var task = tasks.shift();
  callback = callback || noop;
  execute(task);

  // 执行当前任务
  function execute(task, args) {
    args = args || [];
    // 参数加上启动函数
    args.push(restParam(invoke));
    task.apply(null, args);

    // 启动下一任务
    function invoke(err, args) {
      var errs = [err].concat(args);
      if (err) {
        // end
        return callback.apply(null, errs);
      }
      task = tasks.shift();
      // next or end
      return task ? execute(task, args) : callback.apply(null, errs);
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
