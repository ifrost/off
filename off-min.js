!function(n,t){"function"==typeof define&&define.amd?define(function(){return n.off=t()}):"object"==typeof module&&module.exports?module.exports=n.off=t():n.off=t()}(this,function(){var n=function(t){var r=[],e=[],o={};t=t||function(){};var f=function(){var n,t,r;return f.self=f.self||this,n=Array.prototype.slice.call(arguments,0),(t=e.some(function(t){return t.apply(this,n)}))?void 0:(r=f.func.apply(f.self,n),f.lock?f.lock=!1:(f.last=r,f._dispatch(r)),r)};return f._dispatch=function(n){r.forEach(function(t){n instanceof Function&&n._off?n.bind(t):t.call(f.self,n)})},f.before=function(n){return-1===e.indexOf(n)&&e.push(n),f},f.before.remove=function(n){var t=e.indexOf(n);-1!==t&&e.splice(t,1)},f.add=function(n){return-1===r.indexOf(n)&&r.push(n),f},f.bind=function(n){void 0!==f.last&&n(f.last),f.add(n)},f.remove=function(n){var t=r.indexOf(n);-1!==t&&r.splice(t,1)},f.override=function(n){var t=f.func;f.func=function(){var r=Array.prototype.slice.call(arguments,0);return r.unshift(t.bind(this)),n.apply(this,r)}},f.last=void 0,f.as=function(t){return o[t]=o[t]||n(f),o[t]},f._off=!0,f.func=t,f};return n.signal=function(){var t;return t=n(function(n){return n})},n.property=function(t){var r=n(function(n){return 1===arguments.length&&n!==r.last?n:(r.lock=!0,r.last)});return r.last=t,r},n.async=function(t){var r,e=n.signal();return r=n(function(){var n=[e].concat(Array.prototype.slice.call(arguments,0));return t.apply(this,n),e})},n.decorate=function(t){for(var r in t)"function"!=typeof t[r]||t[r]._off||(t[r]=n(t[r]));return t},n});