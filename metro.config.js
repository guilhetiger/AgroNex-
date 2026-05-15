const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.resolver.resolverMainFields = ['react-native', 'module', 'main'];
config.resolver.unstable_enablePackageExports = false;

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle platform-specific files
  if (moduleName.startsWith('@services/')) {
    const serviceName = moduleName.replace('@services/', '');
    const fs = require('fs');
    const path = require('path');

    // Try platform-specific file first
    const platformFile = path.join(__dirname, 'src', 'services', `${serviceName}.${platform}.ts`);
    if (fs.existsSync(platformFile)) {
      return {
        filePath: platformFile,
        type: 'sourceFile',
      };
    }

    // Fallback to native for non-web platforms
    if (platform !== 'web') {
      const nativeFile = path.join(__dirname, 'src', 'services', `${serviceName}.native.ts`);
      if (fs.existsSync(nativeFile)) {
        return {
          filePath: nativeFile,
          type: 'sourceFile',
        };
      }
    }

    // Fallback to web for web platform
    if (platform === 'web') {
      const webFile = path.join(__dirname, 'src', 'services', `${serviceName}.web.ts`);
      if (fs.existsSync(webFile)) {
        return {
          filePath: webFile,
          type: 'sourceFile',
        };
      }
    }

    // Fallback to default file
    const defaultFile = path.join(__dirname, 'src', 'services', `${serviceName}.ts`);
    if (fs.existsSync(defaultFile)) {
      return {
        filePath: defaultFile,
        type: 'sourceFile',
      };
    }
  }

  if (moduleName === '@supabase/supabase-js') {
    return {
      filePath: require.resolve('@supabase/supabase-js/dist/index.cjs'),
      type: 'sourceFile',
    };
  }
  if (moduleName === '@supabase/postgrest-js') {
    return {
      filePath: require.resolve('@supabase/postgrest-js/dist/index.cjs'),
      type: 'sourceFile',
    };
  }
  return defaultResolveRequest ? defaultResolveRequest(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
