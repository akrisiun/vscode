// $
// node scripts/debug.js --inspect-brk=9229
// node scripts/debug.js --inspect=9229 --inspect-brk

// To start debugging, open the following URL in Chrome:
// chrome-devtools://devtools/remote/serve_file/@60cd6e859b9f557d2312f5bf532f6aec5f284980/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:5858/3a6d0a9e-0707-48f8-a7c6-48f157b67ab5
// ws://127.0.0.1:9229/0f2c936f-b1cd-4ac9-aab3-f63b0f33d55e


var vm = require('vm');

console.warn("Debug starting");
new vm.Script('debugger;').runInContext(vm.createContext());

console.warn("Debug break");
// Debugger listening on ws://127.0.0.1:9229/d6c9855e-ec64-43bc-84c6-f08e2262e950
debugger;

var i = 0;
setInterval(() => {
   console.log('hello world:' + i++);
   debugger;
}, 1000);

console.warn("OK? Debug.");

// https://nodejs.org/en/docs/guides/debugging-getting-started/
// TODO:
// remote:
// ssh -L 9221:localhost:9229 user@remote.example.com
