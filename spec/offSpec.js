describe('off', function () {

	var off = require('../off'),
		handler,
		fn,
		async;

	beforeEach(function () {
		handler = jasmine.createSpy();
		fn = off(function () {});
		async = off(function () {
			var result_callback = off.signal();
			setTimeout(result_callback, 10);
			return result_callback;
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
			var prefix = off.property(function (value) {
				return 'prefix: ' + value;
			});

			prefix('test');

			expect(prefix()).toEqual('prefix: test');

		});

	});

})