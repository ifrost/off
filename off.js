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
					if (result instanceof Function && result.off && result.bind) {
						result.bind(handler);
					}
					if (result instanceof Function && result._off) {
						result.add(handler);
					} else {
						handler.call(self, result);
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
		var last = undefined,
			triggered = false,
			result = off(function (value) {
				triggered = true;
				last = value;
				return value;
		});
		result.bind = function() {
			result.add(handler);
			if (triggered) {
				handler(last);
			}
		};
		return result;
	};

	off.property = function (setget) {
		if (typeof setget !== "function") {
			var _v = setget;
			setget = function(v) {
				return arguments.length === 1 ? _v = v : _v;
			}
		}

		var property = off(function(value){
			if (arguments.length === 1 && setget() !== value) {
				return setget(value);
			}
			else {
				property.lock = true;
				return setget();
			}
		});

		property.setget = setget;

		property.bind = function(handler) {
			property.add(handler);
			if (setget() !== undefined) {
				handler(setget());
			}
		};

		property._property = true;
		return property;
	};

	off.async = function (func) {
		var last_callback = null;
		return off(function () {
			var callback;
			if (last_callback) {
				last_callback.lock = true;
			}
			last_callback = callback = off(function (value) {return value}, this);
			var args = Array.prototype.slice.call(arguments, 0).concat(callback);
			func.apply(this, args);
			return callback;
		});
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