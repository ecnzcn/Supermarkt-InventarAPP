/** Single source of the displayed app version (package.json, injected by Vite at build time). */
export const APP_VERSION: string = __APP_VERSION__;
/** Short commit SHA of the running build, or "dev" for local builds. */
export const APP_BUILD: string = __APP_BUILD__;
