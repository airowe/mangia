// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the monorepo root (two levels up from apps/mobile)
const monorepoRoot = path.resolve(__dirname, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Watch the monorepo root for changes in shared packages
config.watchFolders = [monorepoRoot];

// Ensure Metro resolves node_modules from both the app and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
