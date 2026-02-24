const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configuração para monorepo
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

// Observa o diretório raiz do monorepo (para hot reload)
config.watchFolders = [
    ...(config.watchFolders || []),
    workspaceRoot
];

// Permite resolução a partir do app e também do monorepo (para pnpm hoisting)
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// Garante que extensões específicas de plataforma web sejam resolvidas com prioridade.
// O Metro resolve na ordem do array: .web.tsx antes de .tsx, etc.
config.resolver.sourceExts = [
    'web.tsx', 'web.ts', 'web.js',
    ...(config.resolver.sourceExts || ['tsx', 'ts', 'jsx', 'js', 'json']),
];

// Aliases explícitos para fixar a origem dos módulos nativos críticos
try {
    const expoModulesCorePath = path.dirname(require.resolve('expo-modules-core/package.json'));
    const reactNativePath = path.dirname(require.resolve('react-native/package.json'));

    config.resolver.extraNodeModules = {
        ...(config.resolver.extraNodeModules || {}),
        'expo-modules-core': expoModulesCorePath,
        'react-native': reactNativePath,
    };
} catch (e) {
    // Mantém sem alias se não estiver resolvível no ambiente de build
}

module.exports = config;
