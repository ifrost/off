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

		it('should not allow to add same handler multiple times', function () {
			fn.add(handler);
			fn.add(handler);

			fn();
			expect(handler.calls.count()).toEqual(1);

		});

		it('should allow to run the last async callback when called multiple times', function (done) {
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
		
		it('should allow deffered call', function(done) {
			var action = function(value) {
				expect(value).toEqual(10);				
				return 10;				
			};
			var handler = function(value) {
				expect(value).toEqual(10);
				done();
			}
			var deferred = off.deferred(action, function(fn){
				setTimeout(fn, 40);
			});
			
			deferred.add(handler);
			
			deferred(1);
			deferred(5);
			deferred(10);
			
		});
		
		it('should allow to a before handler', function() {
			var result = '';
			var before = function() {
				result += 'a';
			};
			var action = off(function() {
				result += 'b';
			});
			var after = function() {
				result += 'c';
			};
		
			action.add(after);
			action.before(before);
			
			action();
			
			expect(result).toEqual("abc");
		});
		
		it('should allow to lock action', function() {
			var result = '';
			var before = function() {
				result += 'a';
				return true;
			};
			var action = off(function() {
				result += 'b';
			});
			var after = function() {
				result += 'c';
			};
		
			action.add(after);
			action.before(before);
			
			action();
			
			expect(result).toEqual("a");		
		});
		
	});

})