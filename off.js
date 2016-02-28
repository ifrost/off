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
    var off = function (func) {
        var _handlers = [],
            _before = [],
            _scopes = {};

        func = func || function () {};

        var runner = function () {
            var args, blocked, result;

            runner.self = runner.self || this;

            args = Array.prototype.slice.call(arguments, 0);

            blocked = _before.some(function (handler) {
                return handler.apply(this, args);
            });

            if (blocked) {
                return;
            }

            result = runner.func.apply(runner.self, args);

            if (runner.lock) {
                runner.lock = false;
            } else {
                runner.last = result;
                runner._dispatch(result);
            }

            return result;
        };

        runner._dispatch = function(result) {
            _handlers.forEach(function (handler) {
                if (result instanceof Function && result._off) {
                    result.bind(handler);
                } else {
                    handler.call(runner.self, result);
                }
            });
        };

        runner.before = function (handler) {
            if (_before.indexOf(handler) === -1) {
                _before.push(handler);
            }
            return runner;
        };

        runner.before.remove = function(handler) {
            var index = _before.indexOf(handler);
            if (index !== -1) {
                _before.splice(index, 1);
            }
        };

        runner.add = function (handler) {
            if (_handlers.indexOf(handler) === -1) {
                _handlers.push(handler);
            }
            return runner;
        };

        runner.bind = function(handler) {
            if (runner.last !== undefined) {
                handler(runner.last);
            }
            runner.add(handler);
        };

        runner.remove = function (handler) {
            var index = _handlers.indexOf(handler);
            if (index !== -1) {
                _handlers.splice(index, 1);
            }
        };

        runner.override = function(override) {
            var func = runner.func;
            runner.func = function() {
                var args = Array.prototype.slice.call(arguments, 0);
                args.unshift(func.bind(this));
                return override.apply(this, args);
            }
        };

        runner.last = undefined;

        runner.as = function(name) {
            _scopes[name] = _scopes[name] || off(runner);
            return _scopes[name];
        };

        runner._off = true;

        runner.func = func;

        return runner;
    };

    off.signal = function () {
        var result;
        result = off(function (value) {
            return value;
        });
        return result;
    };

    off.property = function (default_value) {
        var property = off(function(value){
            if (arguments.length === 1 && value !== property.last) {
                return value;
            }
            else {
                property.lock = true;
                return property.last;
            }
        });

        property.last = default_value;

        return property;
    };

    off.async = function(func) {
        var done = off.signal(), result;
        result = off(function(){
            var args = [done].concat(Array.prototype.slice.call(arguments, 0));
            func.apply(this, args);
            return done;
        });
        return result;
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