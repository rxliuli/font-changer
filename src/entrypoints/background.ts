import { onMessage, StorageValues } from '@/lib/messaging'
import { Scripting, Tabs } from 'wxt/browser'

function getInjectCSSByFont(fontId: string) {
  return `
    * {
      font-family: '${fontId}';
    }
    input,
    textarea {
        font-family: '${fontId}' !important;
    }
  `
}

function isValidURL(url: string) {
  return url.startsWith('http')
}

function isValidTab(tab: Tabs.Tab) {
  return tab.id && tab.url && isValidURL(tab.url!) && tab.status === 'complete'
}

export default defineBackground(() => {
  let css: string = ''
  const initCSS = async () => {
    const fontId = (
      (await browser.storage.local.get('selectedFontId')) as StorageValues
    ).selectedFontId
    css = getInjectCSSByFont(fontId)
  }
  browser.runtime.onStartup.addListener(initCSS)
  browser.runtime.onInstalled.addListener(initCSS)
  Promise.resolve().then(initCSS)
  browser.storage.local.onChanged.addListener((changes) => {
    if ('selectedFontId' in changes) {
      if (changes.selectedFontId.newValue) {
        css = getInjectCSSByFont(changes.selectedFontId.newValue)
      } else {
        css = ''
      }
    }
  })

  const list: Scripting.CSSInjection[] = []

  async function injectionCSS(tabId: number, css: string) {
    const exists = list.findIndex((it) => it.target.tabId === tabId)
    if (exists >= 0) {
      const injection = list.splice(exists, 1)[0]
      try {
        await browser.scripting.removeCSS(injection)
      } catch (err) {
        console.warn(
          'Failed to remove font',
          err,
          await browser.tabs.get(tabId),
        )
      }
    }
    try {
      const injection = {
        target: { tabId },
        css: css,
      }
      await browser.scripting.insertCSS(injection)
      list.push(injection)
    } catch (err) {
      console.warn('Failed to insert font', err, await browser.tabs.get(tabId))
    }
  }

  async function refreshTabs() {
    const fontId = (
      (await browser.storage.local.get('selectedFontId')) as StorageValues
    ).selectedFontId
    if (!fontId) {
      return
    }
    const tabs = (await browser.tabs.query({})).filter(isValidTab)
    for (const tab of tabs) {
      await injectionCSS(tab.id!, getInjectCSSByFont(fontId))
    }
  }

  async function uninit() {
    await Promise.all(
      list.map(async (injection) => {
        await browser.scripting.removeCSS(injection)
      }),
    )
    list.length = 0
  }

  browser.runtime.onInstalled.addListener(refreshTabs)
  browser.runtime.onUpdateAvailable.addListener(async () => {
    console.log('Update available')
    await uninit()
    await refreshTabs()
  })
  browser.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId === 0 && isValidURL(details.url)) {
      await injectionCSS(details.tabId, css)
    }
  })
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isValidTab(tab)) {
      await injectionCSS(tabId, css)
    }
  })
  browser.tabs.onRemoved.addListener(async (tabId) => {
    const index = list.findIndex((it) => it.target.tabId === tabId)
    if (index >= 0) {
      list.splice(index, 1)[0]
    }
  })

  onMessage('getFontList', () => chrome.fontSettings.getFontList())
  onMessage('refreshTabs', refreshTabs)
})
