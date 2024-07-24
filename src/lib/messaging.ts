import { defineExtensionMessaging } from '@webext-core/messaging'

interface ProtocolMap {
  getFontList(): chrome.fontSettings.FontName[]
  refreshTabs(): void
}

export interface StorageValues {
  selectedFontId: string
  disabledList: string[]
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>()
