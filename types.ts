export type AnyClass = new (...args: any[]) => any;
export type Owns = { owns: AnyClass[] };
export type ModuleMetadata = {
	controllers?: any[];
	providers?: any[];
};
export type Routes = { path: string; method: string; httpMethod: string }[];
export type MasterArg = {body:any, url:string}