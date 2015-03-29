off.js
======

Observable functions.

Install
-------

```bash
$ npm install off
```

Usage
-----

You can wrap any function to make it observable.

```js
var observable = off(function(){
	console.log('observable called');
});
```

To observe a function, use add:

```js
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
```

```
> observable(1,2);
> sum: 3
```

Signals
-------

Signals are just simple observable functions that pass call argument to handlers. You can use them to control your data-flow.

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
```

```
> var component = new Component();
> component.changed.add(function(){console.log('component changed')});
> component.setLabel("text");
> component changed
> component.setSize(10,10);
> component changed
```

Properties
----------

A property is an observable function that saves the passed value. To set the value pass it as an argument. To get the value run the property without any arguments.

A property handler is called only if value of the property changes.

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

Handlers added by .add are run after the observable functions. It's also possible to run a handler before the main body of the observable function is executed. If any of before-handlers returns "true", the observable function is blocked.

```
var moreThan10 = off(function(value) {
    console.log(value);
});

moreThan10.before(function(value){
    return value <= 10;
})
```

```
> moreThan10(1);
> moreThan10(9);
> moreThan10(10);
> moreThan10(11)
> 11

Async
-----

Observable function may be asynchronous:

```js
var async = off.async(function(text, done){
    setTimeout(function(){
        done(text+"!");
    }, 1000)
})
```

```
> async.add(function(text){console.log(text)});
> async("test");
> console.log("invoked before async is finishes")
> invoked before async is finishes
> test!
```

Cancelling
----------

Deferred
--------

Force-add
---------

Custom setters
--------------

Removing handlers
-----------------

A handler can be removed using .remove
