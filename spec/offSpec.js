describe('off', function () {

    var off = require('../off'),
        handler,
        fn,
        async;

    beforeEach(function () {
        handler = jasmine.createSpy();
        fn = off(function () {});
        async = off.async(function (callback) {
            setTimeout(callback, 10);
        });

    });

    it('should run handlers after running wrapped function', function () {
        fn.add(handler);
        expect(handler).not.toHaveBeenCalled();

        fn();
        expect(handler).toHaveBeenCalled();
    });

    it('should remove handlers', function () {
        fn.add(handler);
        expect(handler).not.toHaveBeenCalled();

        fn();
        expect(handler).toHaveBeenCalled();

        fn.remove(handler);
        fn();
        expect(handler.calls.count()).toEqual(1);
    });

    it('should run handlers for async calls', function (done) {
        async.add(handler);

        async();

        setTimeout(function () {
            expect(handler).toHaveBeenCalled();
            done();
        }, 20);

    });

    it('should lock handlers if function is locked', function () {
        var locker = off(function (value) {
            if (value) {
                locker.lock = true;
            }
        });

        locker.add(handler);

        locker(false);
        locker(true);

        expect(handler.calls.count()).toEqual(1);
    });

    it('should lock handlers if async function is locked', function (done) {
        var async_locker = off(function (value) {
            var result_callback = off.signal();
            if (value) {
                async_locker.lock = true;
            }
            setTimeout(result_callback, 10);
            return result_callback;
        });

        async_locker.add(handler);

        async_locker(false);
        async_locker(true);

        setTimeout(function () {
            expect(handler.calls.count()).toEqual(1);
            done();
        }, 40);
    });

    it('should not allow to add same handler multiple times', function () {
        fn.add(handler);
        fn.add(handler);

        fn();
        expect(handler.calls.count()).toEqual(1);

    });

    it('should correctly handle context of the sync handler', function () {
        var context = {
            action: fn,
            handler: function () {
                expect(this).toEqual(context);
            }
        };

        context.action.add(context.handler);
        context.action();
    });

    it('should run all handlers for async calls', function(done){
        var handler2 = jasmine.createSpy();
        async.add(handler);
        async.add(handler2);

        async();
        async();

        setTimeout(function(){
            expect(handler.calls.count()).toEqual(2);
            expect(handler2.calls.count()).toEqual(2);
            done();
        }, 30);
    });

    it('should allow to add a before handler', function () {
        var result = '';
        var before = function () {
            result += 'a';
        };
        var action = off(function () {
            result += 'b';
        });
        var after = function () {
            result += 'c';
        };

        action.add(after);
        action.before(before);

        action();

        expect(result).toEqual("abc");
    });

    it('should allow to lock an action', function () {
        var result = '';
        var before = function () {
            result += 'a';
            return true;
        };
        var action = off(function () {
            result += 'b';
        });
        var after = function () {
            result += 'c';
        };

        action.add(after);
        action.before(before);

        action();

        expect(result).toEqual("a");
    });

    it('should decorate all object methods', function() {
        var test = function() {};

        var obj = {
            foo: 'bar',
            test: test
        };

        var obj = off.decorate(obj);

        expect(obj.foo).toEqual('bar');
        expect(obj.test).not.toBe(test);
        expect(obj.test._off).toBe(true);
    });

    it('should not decorate already wrapped methods', function() {
        var wrapped_test = off(function(){});

        var obj = {
            wrapped_test: wrapped_test
        };

        obj = off.decorate(obj);
        expect(obj.wrapped_test).toBe(wrapped_test);
    });

    it('should allow to override functions', function(){
        var base = {
            create_text: off(function(value){
                this.text = value;
                return value;
            })
        };

        var foo = Object.create(base);
        foo.create_text.override(function($super, value){
            this.text = 'foo: ' + $super(value);
            return this.text;
        });

        var bar = Object.create(foo);
        bar.create_text.override(function($super, value){
            this.text = $super(value) + '!';
            return this.text;
        });

        bar.create_text('test');
        expect(bar.text).toBe('foo: test!');
    });

    it('should pass result and args to handlers', function() {
        var method = off(function(a) {
                return a + 1;
            });

        method.add(handler);
        method(1);

        expect(handler).toHaveBeenCalledWith(2);
    });

    describe('signal', function () {

        var signal;

        beforeEach(function () {
            signal = off.signal();
        });

        it('should pass value passed when exeucting signal', function () {
            signal.add(handler);

            signal('test');

            expect(handler).toHaveBeenCalledWith('test');

        });


        it('should run handler added with bind() if signal has been already dispatched', function () {

            signal(20);

            signal.bind(handler);

            expect(handler).toHaveBeenCalledWith(20);
        });

    });

    describe('scopes', function() {

        it('should cache scoped methods', function() {
            var base = off.signal(),
                foo = base.as('foo'),
                foo2 = base.as('foo'),
                bar = base.as('bar');

            expect(foo).toEqual(foo2);
            expect(foo).not.toEqual(bar);
        });

        it('should create cascaded scopes', function() {
            var base = off.signal(),
                foo = base.as('foo'),
                foobar = base.as('foo').as('bar');

            var base_spy = jasmine.createSpy(),
                foo_spy = jasmine.createSpy(),
                foobar_spy = jasmine.createSpy();

            base.add(base_spy);
            foo.add(foo_spy);
            foobar.add(foobar_spy);

            base('BASE');
            expect(base_spy).toHaveBeenCalledWith('BASE');
            expect(foo_spy).not.toHaveBeenCalledWith('BASE');
            expect(foobar_spy).not.toHaveBeenCalledWith('BASE');

            foo('FOO');
            expect(base_spy).toHaveBeenCalledWith('FOO');
            expect(foo_spy).toHaveBeenCalledWith('FOO');
            expect(foobar_spy).not.toHaveBeenCalledWith('FOO');

            foobar('FOOBAR');
            expect(base_spy).toHaveBeenCalledWith('FOOBAR');
            expect(foo_spy).toHaveBeenCalledWith('FOOBAR');
            expect(foobar_spy).toHaveBeenCalledWith('FOOBAR');
        });

    });

    describe('property', function () {

        var property;

        beforeEach(function () {
            property = off.property();
        });

        it('should store the last value', function () {
            property(10);
            expect(property()).toEqual(10);

            property('test');
            property('test2');
            expect(property()).toEqual('test2');
        });

        it('should run handler only when setting the value', function () {
            property.add(handler);

            property(10);
            property();

            expect(handler.calls.count()).toEqual(1);
        });

        it('should run handlers only when value changes', function () {
            property.add(handler);

            property(10);
            property(11);
            property(11);

            expect(handler.calls.count()).toEqual(2);
        });

        it('should run handler added with bind() if value is defined', function () {

            property(20);

            property.bind(handler);

            expect(handler).toHaveBeenCalledWith(20);
        });
    });

    describe('list', function() {

        it('should allow to add elements', function(){
            var list = off.list();

            list.push(1);
            list.push(2);

            expect(list()[0]).toBe(1);
            expect(list()[1]).toBe(2);
        });

        it('should allow to remove elements', function(){
            var list = off.list([1,2]);

            list.remove(1);

            expect(list()[0]).toBe(2);
            expect(list().length).toBe(1);
        });

        it('should dispatch changes when array changes', function(){
            var list = off.list();

            list.push(1);

            list.add(function(v){
                expect(v[0]).toBe(1);
                expect(v[1]).toBe(2);
            });

            list.push(2);
        });

        it('should allow to listen to push', function(){
            var list = off.list();

            list.push(1);

            list.push.add(function(v){
                expect(v).toBe(2);
            });

            list.push(2);
        });
    });

    describe('extend', function(){

        it('should run init when object is initialized', function() {

            var Foo = off.extend(function(proto){
                proto.init = function(value) {
                    this.value = value;
                }
            });

            var foo = Foo(10);

            expect(foo.value).toBe(10);

        });

        it('should allow simple inheritance', function() {

            var Base = off.extend(function(proto){
                proto.name = function() {
                    return 'BASE'
                };
                proto.test = function() {
                    return this.name() + '!';
                }
            });

            var Foo = Base.extend(function(proto){
                proto.name = function() {
                    return 'FOO';
                }
            });

            var foo = Foo();
            expect(foo.test()).toBe('FOO!');

        });

        it('should allow to access base methods', function(){

            var Base = off.extend(function(proto){
                proto.test = function() {
                    return 2;
                }
            });

            var Foo = Base.extend(function(proto, base){
                proto.test = function() {
                    return base.test.call(this) + 3;
                }
            });

            var foo = Foo();
            expect(foo.test()).toBe(5);
        });

    });

});