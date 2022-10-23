export type AnyClass = new (...args: any[]) => any;
export type ModuleMetadata = {
	imports?: any[];
	exports?: any[];
	controllers?: any[];
	providers?: any[];
};
export type Routes = { path: string; method: string; httpMethod: string }[];
export type MasterArg = { body: any; url: string };
export type DB = { [K in string]: string };
export type Params = { [K in string]: any };
