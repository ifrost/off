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
            }

            runner.last = result;

            return result;
        };

        runner.context = context;

        runner.refresh = function() {
            _handlers.forEach(function(handler){
                handler.call(runner.self, runner.last);
            })
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
            if (arguments.length === 1 && value !== property.value) {
                property.value = value;
            }
            else {
                property.lock = true;
            }
            return property.value;
        });

        property.value = default_value;

        return property;
    };

    off.list = function() {
        var list = off.property([]);
        list.push = off(function(object){
            list.value.push(object);
            list.last = list.value;
            list.refresh();
            return object;
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

    off.repo = function(fn) {
        var _triggers = {},
            _bindings = {};
        var factory = off(fn);
        factory.when = function(trigger, action) {
            _triggers[trigger] = action;
        };
        factory.feed = function(destination, source) {
            _bindings[destination] = source;
        };
        factory.add(function(instance){
            factory.one(instance);
            factory.all.push(instance);
            Object.keys(_triggers).forEach(function(trigger){
                instance[trigger].add(_triggers[trigger]);
            });
            Object.keys(_bindings).forEach(function(destination){
                if (!instance[destination]) {
                    throw new Error('Missing ' + destination);
                }
                _bindings[destination].bind(instance[destination]);
            });
        });
        factory.one = off.property();
        factory.all = off.list();

        factory._scopes = {};
        factory.as = function(name) {
            factory._scopes[name] = factory._scopes[name] || off.repo(factory);
            return factory._scopes[name];
        };

        factory.copy = function() {
            return off.repo(fn);
        };

        return factory;
    };

    return off;
});