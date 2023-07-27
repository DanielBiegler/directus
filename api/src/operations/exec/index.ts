import { defineOperationApi, toArray } from '@directus/utils';
import { isBuiltin, createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');

type Options = {
	code: string;
};

export default defineOperationApi<Options>({
	id: 'exec',
	handler: async ({ code }, { data, env }) => {
		const allowedModules = env['FLOWS_EXEC_ALLOWED_MODULES'] ? toArray(env['FLOWS_EXEC_ALLOWED_MODULES']) : [];
		const allowedModulesBuiltIn: string[] = [];
		const allowedModulesExternal: string[] = [];
		const allowedEnv = data['$env'] ?? {};

		// TODO: Check if we can make dependencies work
		for (const module of allowedModules) {
			if (isBuiltin(module)) {
				allowedModulesBuiltIn.push(module);
			} else {
				allowedModulesExternal.push(module);
			}
		}

		const isolateSizeMb = 64; // Arbitrary choice for testing
		const scriptTimeoutMs = 10000; // Arbitrary choice for testing
		const isolate = new ivm.Isolate({ memoryLimit: isolateSizeMb });

		const context = isolate.createContextSync();
		const jail = context.global;
		jail.setSync('global', jail.derefInto());

		// We will create a basic `log` function for the new isolate to use.
		// TODO: This is just for testing, else the logs get swallowed inside the isolate.
		jail.setSync('log', function (...args) {
			console.log(...args);
		});
		jail.setSync('process', { env: allowedEnv }, { copy: true });
		jail.setSync('module', { exports: null }, { copy: true });

		// We run the operation once to define the module.exports function
		const hostile = isolate.compileScriptSync(code);
		await hostile.run(context, { timeout: scriptTimeoutMs }).catch((err: any) => { console.error(err); throw err; })

		const inputData = new ivm.Reference({ data });
		// TODO: Learn about references inside the sandbox
		const resultRef = await context.evalClosure(
			`return module.exports($0.copySync().data)`, 
			[inputData],
			{ result: { reference: true, promise: true },  timeout: scriptTimeoutMs }
		).catch((err: any) => { 
			console.error(err)
			throw err;
		});
		
		// TODO: releasing the resources would be nice, lookup in which order
		return resultRef.copySync();
	},
});
