import { onMessage, StorageValues } from '@/lib/messaging'
import { Tabs } from 'wxt/browser'

function getInjectCSSByFont(fontId: string) {
  return `
    * {
      font-family: '${fontId}', sans-serif !important;
    }
  `
}

function isValidTab(tab: Tabs.Tab) {
  return (
    tab.id &&
    tab.url &&
    tab.status === 'complete' &&
    !tab.url.startsWith('chrome://')
  )
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

  async function injectionCSS(tabId: number, injection: string) {
    try {
      await browser.scripting.insertCSS({
        target: { tabId },
        css: injection,
      })
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

  browser.runtime.onInstalled.addListener(refreshTabs)
  browser.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId === 0 && !details.url.startsWith('chrome://')) {
      await injectionCSS(details.tabId, css)
    }
  })

  onMessage('getFontList', () => chrome.fontSettings.getFontList())
  onMessage('refreshTabs', refreshTabs)
})
