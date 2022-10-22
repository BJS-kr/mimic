export type AnyClass = new (...args:any[]) => any;
export type Owns = {owns: AnyClass[]};
export type ModuleMetadata = {
  controllers?: any[];
  providers?: any[];
}