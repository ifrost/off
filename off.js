(function (g) {

	var off = function (func) {
		var _handlers = [],
			result;

		var runner = function () {
			var self = this;
			var args;

			args = Array.prototype.slice.call(arguments, 0);
			result = func.apply(self, args);

			if (runner.lock) {
				runner.lock = false;
			} else {
				_handlers.forEach(function (handler) {
					if (result instanceof Function && result._off) {
						result.add(handler);
					} else {
						handler.apply(self, [result]);
					}
				});
			}

			return result;
		};

		runner.add = function (handler) {
			_handlers.push(handler);
		};

		runner.remove = function (handler) {
			var index = _handlers.indexOf(handler);
			if (index !== -1) {
				_handlers.splice(index, 1);
			}
		};

		runner._off = true;

		return runner;
	};

	off.signal = function () {
		return off(function (value) {
			return value;
		});
	};

	off.property = function (setter) {
		var _value, new_value;
		var property = off(function (value) {
			if (arguments.length === 0) {
				property.lock = true;
				return _value;
			} else {
				new_value = setter ? setter(value) : value;
				if (_value === new_value) {
					property.lock = true;
				}
				else {
					_value = new_value;
				}
				return _value;
			}
		});
		return property;
	};

	(typeof module != "undefined" && module.exports) ? (module.exports = off) : (typeof define != "undefined" ? (define("off", [], function () {
		return off;
	})) : (g.off = off));

})(this);