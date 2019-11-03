// Once our entry file is loaded we no longer need nbin to bypass normal Node
// execution. We can still shim the fs into the binary even when bypassing. This
// will ensure for example that a spawn like `${process.argv[0]} -e` will work
// while still allowing us to access files within the binary.
process.env.NBIN_BYPASS = true;

const spawn = require("child_process").spawn;
const plat = require("os").platform();

process.on("error", (e) => {
   console.log("server.main error:", e);
});

// console.log("ls ~/.local/share/code-server/extensions");
console.log("('os').platform", plat);
if (plat === "win32") {
	/* try {
		var child = spawn("pwsh.exe -c 'ls ~/.local/share/code-server/extensions'", [],
			{stdio:'inherit', shell: true});
		// process.stdin.pipe(child.stdin);
		child.on("error", (e) => console.log("pwsh err", e));
		child.unref();
	} catch (e) {
		console.log("spawn err", e);
	} */
}

// http://localhost:8080/static/out/vs/loader.js

const amd = require("../../bootstrap-amd");
amd.load("vs/server/src/node/cli");

// cli problem: Cannot read property 'extensionsPath' of undefined
