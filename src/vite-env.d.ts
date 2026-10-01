/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

/** App version from package.json, injected at build time (see vite.config.ts). */
declare const __APP_VERSION__: string;
/** Short commit SHA of the build ("dev" for local builds), injected at build time. */
declare const __APP_BUILD__: string;
