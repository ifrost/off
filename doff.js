(function (g, off) {

	var doff = {};

	doff.component = function () {
		var component = {};

		component.initialized = off.property();
		component.property = function (default_value) {
			return off.property(default_value, function (value, guard) {
				if (guard() === value) {
					guard.property.lock = true;
				}
				guard(value);
				return component.initialized() ? guard() : component.initialized;
			});
		};

		component.renderer = doff.renderer;

		component.render = function () {};

		component.$render = function () {
			this.render();
		};

		component.init = off(function () {
			this.initialized(true);
		});

		component.destroy = off(function () {
			this.initialized(false);
		});

		component.render_property = function () {
			var property = this.property();
			property.add(this.$render);
			return property;
		};

		component.children = off.property([]);
		component.add = off(function (child) {
			this.children().push(child);
			if (this.initialized()) {
				child.init();
			}
		});

		component.initialized.add(function () {
			this.children().forEach(function (child) {
				child.init();
			});
		});

		component.destroy.add(function () {
			this.children().forEach(function (child) {	
				child.destroy();
			});
		});

		return component;
	};

	doff.extend = function (factory, base_component) {
		return function () {
			base_component = base_component || doff.component;
			var proto = base_component(),
				component = Object.create(proto);
			component.proto = proto;
			if (factory) {
				factory(component);
			}
			return component;
		}
	};

	doff.renderer = function (func) {
		var requestNextFrame;
		if (typeof window !== "undefined" && window.requestAnimationFrame) {
			requestNextFrame = window.requestAnimationFrame;
		} else {
			requestNextFrame = function (step) {
				setTimeout(step, 24);
			}
		}
		return off.deferred(func, requestNextFrame);
	};

	doff.check_any_not_set = function () {
		var properties = Array.prototype.slice.call(arguments, 0);
		return function () {
			return properties.some(function (property) {
				return typeof (property()) === "undefined" || property() === null;
			});
		};
	};

	(typeof module != "undefined" && module.exports) ? (module.exports = doff) : (typeof define != "undefined" ? (define("doff", [], function () {
		return doff;
	})) : (g.doff = doff));

})(this, require('../off'));