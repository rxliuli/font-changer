import { defineConfig } from 'wxt'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'Font Changer',
    version: '0.1.0',
    description: 'Changes the font of all web pages',
    permissions: [
      'tabs',
      'scripting',
      'fontSettings',
      'storage',
      'webNavigation',
    ],
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: ['*.woff2'],
        matches: ['<all_urls>'],
      },
    ],
  },
  runner: {
    disabled: true,
  },
})
