describe('off', function () {

	var off = require('../off'),
		handler,
		fn,
		async,
		throttled_async;

	beforeEach(function () {
		handler = jasmine.createSpy();
		fn = off(function () {});
		async = off.async(function (callback) {
			setTimeout(callback, 10);
		});

		throttled_async = off.async(function (callback) {
			setTimeout(callback, 10);
		}, true);
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

	it('should run only the last async callback when called multiple times', function (done) {
		throttled_async.add(handler);

		throttled_async();
		throttled_async();
		throttled_async();

		setTimeout(function () {
			expect(handler.calls.count()).toEqual(1);
			done();
		}, 20);
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

	it('should correctly handle context of the async handler', function (done) {
		var context = {
			action: async,
			handler: function () {
				expect(this).toEqual(context);
				done();
			}
		};

		context.action.add(context.handler);
		context.action();
	});

	it('should allow making a deffered call', function (done) {
		var action = function (value) {
			expect(value).toEqual(10);
			return 10;
		};
		var handler = function (value) {
			expect(value).toEqual(10);
			done();
		}
		var deferred = off.deferred(action, function (fn) {
			setTimeout(fn, 40);
		});

		deferred.add(handler);

		deferred(1);
		deferred(5);
		deferred(10);

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

		expect(handler).toHaveBeenCalledWith(2, [1], jasmine.any(Object));
	});

	describe('signal', function () {

		var signal;

		beforeEach(function () {
			signal = off.signal();
		});

		it('should pass value passed when exeucting signal', function () {
			signal.add(handler);

			signal('test');

			expect(handler).toHaveBeenCalledWith('test', jasmine.any(Object), jasmine.any(Object));

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
			expect(base_spy).toHaveBeenCalledWith('BASE', jasmine.any(Object), jasmine.any(Object));
			expect(foo_spy).not.toHaveBeenCalledWith('BASE', jasmine.any(Object), jasmine.any(Object));
			expect(foobar_spy).not.toHaveBeenCalledWith('BASE', jasmine.any(Object), jasmine.any(Object));

			foo('FOO');
			expect(base_spy).toHaveBeenCalledWith('FOO', jasmine.any(Object), jasmine.any(Object));
			expect(foo_spy).toHaveBeenCalledWith('FOO', jasmine.any(Object), jasmine.any(Object));
			expect(foobar_spy).not.toHaveBeenCalledWith('FOO', jasmine.any(Object), jasmine.any(Object));

			foobar('FOOBAR');
			expect(base_spy).toHaveBeenCalledWith('FOOBAR', jasmine.any(Object), jasmine.any(Object));
			expect(foo_spy).toHaveBeenCalledWith('FOOBAR', jasmine.any(Object), jasmine.any(Object));
			expect(foobar_spy).toHaveBeenCalledWith('FOOBAR', jasmine.any(Object), jasmine.any(Object));
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

		it('should accept custom setters', function () {
			var increment = off.property(0, function (value, guard) {
				guard(guard() + value);
			});

			increment(2);
			expect(increment()).toEqual(2);

			increment(3);
			expect(increment()).toEqual(5);

		});

		it('should run handler added with bind() if value is defined', function () {

			property(20);

			property.bind(handler);

			expect(handler).toHaveBeenCalledWith(20);
		});

		it('should allow to reset the value to re-run all handlers', function () {
			property.add(handler);

			property(11);
			property(11);

			expect(handler.calls.count()).toEqual(1);

			property.reset();
			expect(handler.calls.count()).toEqual(2);
		});

		it('should allow to create private/public properties', function(){
			var _foo = off.property(),
				foo = off.property(_foo);

			foo.add(handler);
			_foo(1);
			expect(handler.calls.count()).toEqual(0);
			expect(foo()).toEqual(1);
			expect(_foo()).toEqual(1);

			foo(2);
			expect(handler.calls.count()).toEqual(1);
			expect(foo()).toEqual(2);
			expect(_foo()).toEqual(2);
		});
	});

})