!function(n,r){"function"==typeof define&&define.amd?define(function(){return n.off=r()}):"object"==typeof module&&module.exports?module.exports=n.off=r():n.off=r()}(this,function(){var n=function(n,r){var t=[],e=[];n=n||function(){};var o=function(){var n,u,f,i=r||this;return n=Array.prototype.slice.call(arguments,0),(u=e.some(function(r){return r.apply(this,n)}))?void 0:(f=o.func.apply(i,n),o.lock?o.lock=!1:t.forEach(function(r){f instanceof Function&&f._off?f.add(r):r.apply(i,[f,n])}),f)};return o.before=function(n,r){return r=r||{},(-1===e.indexOf(n)||r.force_add)&&e.push(n),o},o.add=function(n,r){return r=r||{},(-1===t.indexOf(n)||r.force_add)&&t.push(n),o},o.override=function(n){var r=o.func;o.func=function(){var t=Array.prototype.slice.call(arguments,0);return t.unshift(r.bind(this)),n.apply(this,t)}},o.remove=function(n){var r=t.indexOf(n);-1!==r&&t.splice(r,1)},o._off=!0,o.func=n,o};return n.signal=function(){return n(function(n){return n})},n.property=function(r,t){var e,o,u=r,f={};return t=t||function(n,r){return r()===n&&(r.property.lock=!0),r(n)},e=n(function(n,r){return 0===arguments.length&&r!==f?(e.lock=!0,u):t(n,o)}),e.bind=function(n){e.add(n),void 0!==e()&&n(e())},e.reset=function(){return e(f)},o=function(n){return arguments.length&&(u=n),u},o.property=e,e.property=!0,e},n.async=function(r,t){var e=null;return n(function(){var o;t&&e&&(e.lock=!0),e=o=n(function(n){return n},this);var u=Array.prototype.slice.call(arguments,0).concat(o);return r.apply(this,u),o})},n.deferred=function(r,t){var e,o,u,f=!1,i=null,c=n.signal();return o=n(function(){return i=Array.prototype.slice.call(arguments,0),e=c,f?c:(f=!0,t(function(){u=r.apply(this,i),f=!1,c(u)}),c)})},n.decorate=function(r){for(var t in r)"function"!=typeof r[t]||r[t]._off||(r[t]=n(r[t]));return r},n});