off.js
======

Observable functions.

Install
-------

```bash
$ npm install off
```

About
-----

off.js creates observable functions by wrapping exsiting functions. An observable function can have handlers attached before or after invocation. You can use it to do AOP, create event/signals based data-flow, observe changes in your objects, etc.

Simple usage
------------

To create you first observable function, run the code below:

```js
var observable = off(function(){
   console.log('observable called');
});

var handler = function(){
   console.log('handler called');
}

observable.add(handler);
```

The handler will be run each time after observable is invoked:

```
> observable();
> observable called
> handler called
```

Result of the observable function is passed to all handlers:

```js
var observable = off(function(a, b){
	return a + b;
});
observable.add(function(value){
	console.log('sum:', value);
});

> observable(1,2);
> sum: 3
```

Signals
-------

Signals are  simple observable functions that pass call argument to handlers. You can use them to control your data-flow.

```js
function Component() {
   this.changed = off.signal();
}
Component.prototype.setLabel = function(value) {
   this.label = value;
   this.changed();
}
Component.prototype.setSize = function(width, height) {
   this.width = width;
   this.height = height;
   this.changed();
}

> var component = new Component();
> component.changed.add(function(){console.log('LOG: component changed')});
> component.setLabel("text");
> LOG: component changed
> component.setSize(10,10);
> LOG: component changed
```

Properties
----------

A property is an observable function that works as a getter/setter. It saves the value passed to the function or returns the last value if no arguments are passed.

A property handler is called only if the value of the property changes. (If you need to re-invoke all the handlers with the same value you can run property.reset());

```
> var property = off.property();
> property(10);
> property()
> 10
> property(11)
> 11
```

Before / Blocking
-----------------

Handlers added by .add() are run after observable functions. It's also possible to run a handler before the main body of the observable function is executed. Additionally, if any of before-handlers returns true, the observable function is blocked and not invoked.

```js
var moreThan10 = off(function(value) {
    console.log(value);
});

moreThan10.before(function(value){
    return value <= 10;
})

> moreThan10(1);
> moreThan10(9);
> moreThan10(10);
> moreThan10(11)
> 11
```

Locking
-------

Another way of interrupting the flow is locking handlers, e.g.:

```js
var foo = off(function(value){
    if (value <= 10) {
        foo.lock = true;
    }
    else {
        return value;
    }
});

foo.add(function(value){console.log("Value =",value)});

> foo(1);
> foo(11);
> Value = 11
```

Async
-----

Observable function may be asynchronous. The last param passed to the observable function is done callback. Running this callback finished async call and run all assigned handlers. Value passed to the done() callback is the result of async call and it's passed to all handlers;

```js
var async = off.async(function(text, done){
    setTimeout(function(){
        done("Text =", text);
    }, 1000);
})

> async.add(function(text){console.log(text)});
> async("test");
> console.log("LOG: invoked before async is finishes")
> LOG: invoked before async is finishes
> Text = test
```

Deferred
--------

off provides a simple helper for running deferred functions. If a function is ivoked multiple times, handlers will be run only once per each deferred cycle.

```js
var property = off.property();
var render = off.deferred(function(value){console.log("rendering",value)}, window.requestAnimationFrame);
property.add(render);

> property(1); property(2); property(3);
> rendering 3
```

Force-add
---------

By default all you can't add the same handler twice. To enforce adding the same handles multiple times pass options object to the add handler function:

```js
observable.add(handler, {force_add: true});
```

Custom setters
--------------

Default property behaviour is to update the value and run handlers only if the value changes. Even so, you can override the setter:

```js

/**
 * The guard object behaves as a property but doesn't run automatically any handlers when invoked
 */
var custom_setter = function (value, guard) {
   guard(guard() + value);
}
var increment = off.property(0, custom_setter);

> increment(2);
> expect(increment()).toEqual(2);
> increment(3);
> expect(increment()).toEqual(5);
```

Removing handlers
-----------------

A handler can be removed using .remove()
