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
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _quickselect = __webpack_require__(174);

	var _quickselect2 = _interopRequireDefault(_quickselect);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
	}; /* eslint-env worker */


	var norm = function norm(n, x, y) {
	  var sum = 0;
	  for (var i = 0; i < n; ++i) {
	    var diff = x[i] - y[i];
	    sum += diff * diff;
	  }
	  return Math.sqrt(sum);
	};

	var normMatrix = function normMatrix(E, XE) {
	  var n = XE.length;
	  var matrix = new Array(n);
	  for (var i = 0; i < n; ++i) {
	    var row = new Array(n);
	    for (var j = 0; j < n; ++j) {
	      row[j] = norm(E, XE[i], XE[j]) || 1e-8;
	    }
	    matrix[i] = row;
	  }
	  return matrix;
	};

	var weight = function weight(E, xi, i, library, matrix) {
	  (0, _quickselect2.default)(library, E + 1, null, null, function (j1, j2) {
	    return matrix[i][j1] - matrix[i][j2];
	  });
	  var w = new Array(E);
	  for (var k = 0; k < E + 1; ++k) {
	    var j = library[k];
	    w[k] = { norm: matrix[i][j], index: j };
	  }
	  (0, _quickselect2.default)(w, 1, null, null, function (v1, v2) {
	    return v1.norm - v2.norm;
	  });
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

	var ccm = function ccm(n, X, Y, E, tau, lMin, step, repeatMax) {
	  var delta = (E - 1) * tau;
	  var m = n - delta;
	  var XE = new Array(m);
	  for (var i = delta; i < n; ++i) {
	    var x = new Array(E);
	    for (var j = 0; j < E; ++j) {
	      x[j] = X[i - tau * j];
	    }
	    XE[i - delta] = x;
	  }
	  var matrix = normMatrix(E, XE);
	  var rho = [];
	  var Yexact = Y.slice(n - m);
	  for (var l = lMin; l < m; l += step) {
	    var rhoAvg = 0;

	    var _loop = function _loop(repeat) {
	      var library = new Array(l);
	      for (var _i2 = 0; _i2 < l; ++_i2) {
	        library[_i2] = Math.floor(Math.random() * m);
	      }
	      var Yest = XE.map(function (x, i) {
	        var w = weight(E, x, i, library, matrix);
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

	        return Yesti;
	      });
	      rhoAvg += correl(m, Yexact, Yest);
	    };

	    for (var repeat = 0; repeat < repeatMax; ++repeat) {
	      _loop(repeat);
	    }
	    rhoAvg /= repeatMax;
	    rho.push([l, rhoAvg]);
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
	  var lStep = _event$data.lStep;
	  var repeatMax = _event$data.repeatMax;

	  var result = ccm(n, X, Y, E, tau, lMin, lStep, repeatMax);
	  postMessage(result);
	};

/***/ },

/***/ 174:
/***/ function(module, exports) {

	'use strict';

	module.exports = partialSort;

	// Floyd-Rivest selection algorithm:
	// Rearrange items so that all items in the [left, k] range are smaller than all items in (k, right];
	// The k-th element will have the (k - left + 1)th smallest value in [left, right]

	function partialSort(arr, k, left, right, compare) {
	    left = left || 0;
	    right = right || (arr.length - 1);
	    compare = compare || defaultCompare;

	    while (right > left) {
	        if (right - left > 600) {
	            var n = right - left + 1;
	            var m = k - left + 1;
	            var z = Math.log(n);
	            var s = 0.5 * Math.exp(2 * z / 3);
	            var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
	            var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
	            var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
	            partialSort(arr, k, newLeft, newRight, compare);
	        }

	        var t = arr[k];
	        var i = left;
	        var j = right;

	        swap(arr, left, k);
	        if (compare(arr[right], t) > 0) swap(arr, left, right);

	        while (i < j) {
	            swap(arr, i, j);
	            i++;
	            j--;
	            while (compare(arr[i], t) < 0) i++;
	            while (compare(arr[j], t) > 0) j--;
	        }

	        if (compare(arr[left], t) === 0) swap(arr, left, j);
	        else {
	            j++;
	            swap(arr, j, right);
	        }

	        if (j <= k) left = j + 1;
	        if (k <= j) right = j - 1;
	    }
	}

	function swap(arr, i, j) {
	    var tmp = arr[i];
	    arr[i] = arr[j];
	    arr[j] = tmp;
	}

	function defaultCompare(a, b) {
	    return a < b ? -1 : a > b ? 1 : 0;
	}


/***/ }

/******/ });