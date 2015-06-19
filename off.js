(function (root, factory) {
	if (typeof define === "function" && define.amd) {
		define(function () {
			return (root.off = factory());
		});
	} else if (typeof module === "object" && module.exports) {
		module.exports = (root.off = factory());
	} else {
		root.off = factory();
	}
})(this, function () {
	var off = function (func, context) {
		var _handlers = [],
			_before = [];

		func = func || function () {};

		var runner = function () {
			var self = context || this,
				args, blocked, result;

			args = Array.prototype.slice.call(arguments, 0);

			blocked = _before.some(function (handler) {
				return handler.apply(this, args);
			});

			if (blocked) {
				return;
			}

			result = runner.func.apply(self, args);

			if (runner.lock) {
				runner.lock = false;
			} else {
				_handlers.forEach(function (handler) {
					if (result instanceof Function && result._off) {
						result.add(handler);
					} else {
						handler.apply(self, [result, args, self]);
					}
				});
			}

			return result;
		};

		runner.before = function (handler, options) {
			options = options || {};
			if (_before.indexOf(handler) === -1 || options.force_add) {
				_before.push(handler);
			}
			return runner;
		};

		runner.add = function (handler, options) {
			options = options || {};
			if (_handlers.indexOf(handler) === -1 || options.force_add) {
				_handlers.push(handler);
			}
			return runner;
		};

		runner.override = function(override) {
			var func = runner.func;
			runner.func = function() {
				var args = Array.prototype.slice.call(arguments, 0);
				args.unshift(func.bind(this));
				return override.apply(this, args);
			}
		};

		runner.remove = function (handler) {
			var index = _handlers.indexOf(handler);
			if (index !== -1) {
				_handlers.splice(index, 1);
			}
		};

		runner._scopes = {};

		runner.as = function(name) {
			runner._scopes[name] = runner._scopes[name] || off(runner);
			return runner._scopes[name];
		};

		runner._off = true;

		runner.func = func;

		return runner;
	};

	off.signal = function () {
		return off(function (value) {
			return value;
		});
	};

	off.property = function (initial_value, setter) {
		var _value = initial_value,
			property, $guard, _reset = {};

		setter = setter || function (value, guard) {
			if (guard() === value) {
				guard.property.lock = true;
			}
			return guard(value);
		};

		property = off(function (value, reset) {
			if (arguments.length === 0 && reset !== _reset) {
				property.lock = true;
				return $guard();
			} else {
				return setter(value, $guard);
			}
		});
		property.bind = function (handler) {
			property.add(handler);
			if (property() !== undefined) {
				handler(property());
			}
		};
		property.reset = function () {
			return property(_reset);
		};

		$guard = function (value) {
			if (arguments.length) {
				_value = value;
			}
			return _value;
		};

		if (typeof initial_value === 'function' && initial_value._property) {
			$guard = initial_value;
		}

		$guard.property = property;
		property._property = true;

		return property;
	};

	off.async = function (func, throttle) {
		var last_callback = null;
		return off(function () {
			var callback;
			if (throttle && last_callback) {
				last_callback.lock = true;
			}
			last_callback = callback = off(function (value) {return value}, this);
			var args = Array.prototype.slice.call(arguments, 0).concat(callback);
			func.apply(this, args);
			return callback;
		});
	};

	off.deferred = function (func, deferring_function) {
		var _pending = false,
			last_args = null,
			final_callback = off.signal(),
			$final_callback,
			deferred, result;
		deferred = off(function () {
			last_args = Array.prototype.slice.call(arguments, 0);
			$final_callback = final_callback;
			if (!_pending) {
				_pending = true;
				deferring_function(function () {
					result = func.apply(this, last_args);
					_pending = false;
					final_callback(result);
				});
				return final_callback;
			}
			return final_callback;
		});

		return deferred;
	};

	off.decorate = function (obj) {
		for (var property in obj) {
			if (typeof (obj[property]) === "function" && ! (obj[property]._off)) {
				obj[property] = off(obj[property]);
			}
		}
		return obj;
	};

	return off;
});