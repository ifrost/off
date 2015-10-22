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
                runner._dispatch(result);
                runner.last = result;
            }

            return result;
        };

        runner.context = context;

        runner._dispatch = function(result) {
            _handlers.forEach(function (handler) {
                if (result instanceof Function && result.off && result.bind) {
                    result.bind(handler);
                }
                if (result instanceof Function && result._off) {
                    result.add(handler);
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

    off.list = function(default_list) {
        var list = off.property(default_list || []);
        list.push = off(function(object){
            list.last.push(object);
            list._dispatch(this.last);
            return object;
        });
        list.remove = off(function(object){
            var index = list.last.indexOf(object);
            if (index !== -1) {
                list.last.splice(index, 1);
                list._dispatch(list.last);
            }
        });
        return list;
    };

    off.async = function(func) {
        var done = off.signal();
        var result = off(function(){
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

    off.extend = function(factory) {
        var proto = Object.create(this === off ? Object.prototype : this), constructor;
        factory(proto, this);
        constructor = function() {
            var instance = Object.create(proto);
            if (instance.init instanceof  Function) {
                instance.init.apply(instance, arguments);
            }
            return instance;
        };
        constructor.extend = off.extend.bind(proto);
        return constructor;
    };

    return off;
});