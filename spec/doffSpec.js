describe('doff', function () {

	var doff = require('../doff'),
		off = require('../off');

	it('...', function () {

		var textf = doff.extend(function (comp) {
			comp.text = comp.render_property();
			comp.size = comp.render_property();
			comp.render = jasmine.createSpy();
		}, doff.component);

		var component = textf();

		component.text("test");
		component.size(10);
		component.text("test 2");
		component.size(11);
		expect(component.render.calls.count()).toEqual(0);

		component.init();
		expect(component.render.calls.count()).toEqual(1);

		component.text("test 3");
		expect(component.render.calls.count()).toEqual(2);

		component.size(12);
		expect(component.render.calls.count()).toEqual(3);

		component.text("test 3");
		expect(component.render.calls.count()).toEqual(3);

	});

	it('runs associated render methods', function () {
		var compf = doff.extend(function (comp) {
			comp.render_foo = jasmine.createSpy();
			comp.foo = comp.property().add(comp.render_foo);
			comp.render_bar = jasmine.createSpy();
			comp.bar = comp.property().add(comp.render_bar);
			comp.render_late = jasmine.createSpy();
			comp.late = comp.property().add(comp.render_late);

			comp.init = function () {
				this.initialized(true);
			}
		});

		var comp = compf();

		comp.bar(1);
		comp.foo(2);
		comp.foo(3);

		expect(comp.bar()).toEqual(1);
		expect(comp.foo()).toEqual(3);

		expect(comp.render_foo.calls.count()).toEqual(0);
		expect(comp.render_bar.calls.count()).toEqual(0);
		expect(comp.render_late.calls.count()).toEqual(0);

		comp.init();

		expect(comp.render_foo.calls.count()).toEqual(1);
		expect(comp.render_bar.calls.count()).toEqual(1);
		expect(comp.render_late.calls.count()).toEqual(0);

		comp.foo(2);

		expect(comp.render_foo.calls.count()).toEqual(2);
		expect(comp.render_bar.calls.count()).toEqual(1);
		expect(comp.render_late.calls.count()).toEqual(0);

	});

	it('should run render function passing correct property value', function (done) {
		var compf = doff.extend(function (comp) {
			comp.render_text = doff.renderer(function (text) {
				expect(text).toEqual("foobar");
				done();
			});
			comp.text = comp.property().add(comp.render_text);
		}, doff.component);

		var comp = compf();
		comp.init();
		comp.text("foo");
		comp.text("bar");
		comp.text("foobar");
	});

	it('should run render function only once per frame', function (done) {
		var spy = jasmine.createSpy(),
			compf = doff.extend(function (comp) {
				comp.render = doff.renderer(spy);
				comp.foo = comp.property().add(comp.render);
			});

		var comp = compf();
		comp.init();
		comp.foo(1);
		comp.foo(2);
		comp.foo(3);

		setTimeout(function () {
			expect(spy.calls.count()).toEqual(1);
			done();
		}, 40);
	});

	it('should allow to block render if not all observed properties are set', function () {
		var spy = jasmine.createSpy();
			compf = doff.extend(function (comp) {
				comp.render = off(spy);
				comp.foo = comp.property().add(comp.render);
				comp.bar = comp.property().add(comp.render);
				
				comp.render.before(doff.check_any_not_set(comp.foo, comp.bar));
			});
		
		var comp = compf();
		
		comp.foo(1);
		expect(spy.calls.count()).toEqual(0);
		
		comp.init();
		expect(spy.calls.count()).toEqual(0);
		
		comp.foo(2);
		expect(spy.calls.count()).toEqual(0);
		
		comp.bar(3);
		expect(spy.calls.count()).toEqual(1);

	});

});