/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	"use strict";

	/* eslint-env worker */

	var correl = function correl(n, x, y) {
	  var xbar = 0;
	  var ybar = 0;
	  for (var i = 0; i < n; ++i) {
	    xbar += x[i];
	    ybar += y[i];
	  }
	  xbar /= n;
	  ybar /= n;
	  var xx = 0;
	  var xy = 0;
	  var yy = 0;
	  for (var _i = 0; _i < n; ++_i) {
	    xx += (x[_i] - xbar) * (x[_i] - xbar);
	    xy += (x[_i] - xbar) * (y[_i] - ybar);
	    yy += (y[_i] - ybar) * (y[_i] - ybar);
	  }
	  return xy / Math.sqrt(xx * yy);
	};

	var norm = function norm(n, x, y) {
	  var sum = 0;
	  for (var i = 0; i < n; ++i) {
	    var diff = x[i] - y[i];
	    sum += diff * diff;
	  }
	  return Math.sqrt(sum);
	};

	var weight = function weight(E, xi, i, library) {
	  var values = library.map(function (xj, j) {
	    return { norm: norm(E, xi, xj), index: j };
	  }).filter(function (_, j) {
	    return i !== j;
	  });
	  values.sort(function (v1, v2) {
	    return v1.norm - v2.norm;
	  });
	  var w = [];
	  for (var j = 0; j < E + 1; ++j) {
	    w.push(values[j]);
	  }
	  var sumw = 0;
	  w.forEach(function (_, j) {
	    w[j].weight = Math.exp(-w[j].norm / w[0].norm);
	    sumw += w[j].weight;
	  });
	  w.forEach(function (_, j) {
	    w[j].weight /= sumw;
	  });
	  return w;
	};

	var ccm = function ccm(n, X, Y, E, tau, lMin, step) {
	  var XE = [];
	  for (var i = (E - 1) * tau; i < n; ++i) {
	    var x = [];
	    for (var j = 0; j < E; ++j) {
	      x.push(X[i - tau * j]);
	    }
	    XE.push(x);
	  }
	  var rho = [];
	  var Yexact = Y.slice(n - XE.length);

	  var _loop = function _loop(l) {
	    var library = XE.slice(0, l);
	    var Yest = [];
	    XE.forEach(function (x, i) {
	      var w = weight(E, x, i, library);
	      var Yesti = 0;
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;

	      try {
	        for (var _iterator = w[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var _step$value = _step.value;
	          var _weight = _step$value.weight;
	          var index = _step$value.index;

	          Yesti += _weight * Y[index];
	        }
	      } catch (err) {
	        _didIteratorError = true;
	        _iteratorError = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion && _iterator.return) {
	            _iterator.return();
	          }
	        } finally {
	          if (_didIteratorError) {
	            throw _iteratorError;
	          }
	        }
	      }

	      Yest.push(Yesti);
	    });
	    rho.push([l, correl(XE.length, Yexact, Yest)]);
	  };

	  for (var l = lMin; l < XE.length; l += step) {
	    _loop(l);
	  }
	  return rho;
	};

	onmessage = function onmessage(event) {
	  var _event$data = event.data;
	  var n = _event$data.n;
	  var X = _event$data.X;
	  var Y = _event$data.Y;
	  var E = _event$data.E;
	  var tau = _event$data.tau;
	  var lMin = _event$data.lMin;
	  var step = _event$data.step;

	  postMessage(ccm(n, X, Y, E, tau, lMin, step));
	};

/***/ }
/******/ ]);