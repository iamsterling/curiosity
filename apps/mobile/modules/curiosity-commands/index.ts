// Re-export the native module. On web, it will be resolved to CuriosityCommandsModule.web.ts
// and on native platforms to CuriosityCommandsModule.ts
export { default } from './src/CuriosityCommandsModule';
export * from './src/CuriosityCommands.types';
