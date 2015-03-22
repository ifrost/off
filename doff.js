(function (g, off) {

	var doff = {};

	doff.component = function (node) {
		var component = {};

		component.node = off.property(node);
		component.container = off.property(node);

		component.initialized = off.property( !! node);
		
		component.property = function(default_value) {
			return component.reflow(default_value, true);
		}
		
		component.flow_property = function(default_value) {
			return component.reflow(default_value, false);
		};
		
		component.render_property = function(default_value) {
			var property = this.flow_property(default_value);
			property.add(this.$render);	
			return property;
		};
		
		component.reflow = function (default_value, single) {
			var reset = {};			
			var ready;
			
			if (single) {
				ready = off(function(){
					return property();
				});
				component.initialized.add(ready);
			}
			else {
				ready = component.initialized;
			}
			
			var property = off.property(default_value, function (value, guard) {
				if (guard() === value && value !== reset) {
					guard.property.lock = true;
				}
				guard(value === reset ? guard() : value);
				return component.initialized() ? guard() : ready;
			});
			
			// reset value to invoke handlers added after default value is set
			if (default_value) {
				var _add = property.add;
				property.add = function(handler) {
					var result = _add(handler);
					property(reset);
					return result;
				};
			}
			return property;
		};

		component.renderer = doff.renderer;

		component.render = function () {};

		component.$render = function () {
			this.render();
		};

		component.init_dom = function () {};
		component.init = off(function () {
			this.node(this.init_dom());
			this.initialized(true);
		});

		component.destroy = off(function () {
			this.initialized(false);
		});

		component.init_child = function (child) {
			child.init();
			if (this.container()) {
				this.container().appendChild(child.node());
			}
		};

		component.children = off.property([]);
		component.add = off(function (child) {
			this.children().push(child);
			if (this.initialized()) {
				this.init_child(child);
			}
		});

		component.initialized.add(function () {
			this.children().forEach(function (child) {
				this.init_child(child);
			}.bind(this));
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
				factory.bind(component)(component);
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

	doff.check_any_not_true = function () {
		var properties = Array.prototype.slice.call(arguments, 0);
		return function () {
			return properties.some(function (property) {
				return !property();
			});
		};
	};

	(typeof module != "undefined" && module.exports) ? (module.exports = doff) : (typeof define != "undefined" ? (define("doff", [], function () {
		return doff;
	})) : (g.doff = doff));

})(this, typeof require != "undefined" ? require('../off') : off);