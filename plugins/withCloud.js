const {
  withEntitlementsPlist,
  withInfoPlist,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const withCloudPlugin = (config, options) => {
  const { iCloud } = options;

  if (iCloud) {
    const { kv, documents } = iCloud;
    config = withEntitlementsPlist(config, async (config) => {
      const e = config.modResults;
      e['com.apple.developer.icloud-container-identifiers'] = [];

      if (kv.enabled) {
        e['com.apple.developer.ubiquity-kvstore-identifier'] =
          '$(TeamIdentifierPrefix)$(CFBundleIdentifier)';
      }

      if (documents.enabled) {
        e['com.apple.developer.icloud-services'] = ['CloudDocuments'];
        e['com.apple.developer.ubiquity-container-identifiers'] = [];
        const id = documents.containerId;

        if (id) {
          if (!id.startsWith('iCloud')) {
            // https://developer.apple.com/documentation/uikit/documents_data_and_pasteboard/synchronizing_documents_in_the_icloud_environment#:~:text=An%20iCloud%20container%20identifier%20is%20case%2Dsensitive%20and%20must%20begin%20with%20%E2%80%9CiCloud.%E2%80%9D.
            throw new Error("containerId must start with 'iCloud.'");
          }
          e['com.apple.developer.icloud-container-identifiers'].push(id);
          e['com.apple.developer.ubiquity-container-identifiers'].push(id);
        }
      }
      return config;
    });
    config = withInfoPlist(config, async (config) => {
      const e = config.modResults;
      const id = documents.containerId;
      if (id && documents.visible) {
        const visibleName = documents.visibleName;
        if (!visibleName)
          throw new Error('you need apply a visibleName config');
        e.NSUbiquitousContainers = {
          [id]: {
            NSUbiquitousContainerIsDocumentScopePublic: true,
            NSUbiquitousContainerName: visibleName,
            NSUbiquitousContainerSupportedFolderLevels: 'Any',
          },
        };
      }
      return config;
    });
  }

  return config;
};

// should use `createRunOncePlugin` wrap，or `pluginHistory` of output of `expo config --type prebuild`  will not print this plugin
module.exports = createRunOncePlugin(withCloudPlugin, 'with-cloud', '0.0.1');
