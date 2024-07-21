import { PublicPath } from 'wxt/browser'

function getInjectCSS() {
  const fontFiles: {
    name: string
    file: PublicPath
    weight: string
    style: string
  }[] = [
    {
      name: 'LXGW WenKai Lite',
      file: '/LXGWWenKaiLite-Regular.woff2',
      weight: 'normal',
      style: 'normal',
    },
    {
      name: 'LXGW WenKai Lite',
      file: '/LXGWWenKaiLite-Bold.woff2',
      weight: 'bold',
      style: 'normal',
    },
    {
      name: 'LXGW WenKai Lite',
      file: '/LXGWWenKaiLite-Light.woff2',
      weight: '300',
      style: 'normal',
    },
  ]

  const css =
    fontFiles
      .map(
        (font) => `
@font-face {
  font-family: '${font.name}';
  src: url('${browser.runtime.getURL(font.file)}') format('woff2');
  font-weight: ${font.weight};
  font-style: ${font.style};
}
`,
      )
      .join('\n') +
    `
* {
  font-family: 'LXGW WenKai Lite', sans-serif !important;
}
`
  return css
}

export default defineBackground(() => {
  const css = getInjectCSS()

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (
      changeInfo.status === 'complete' &&
      tab.url &&
      !tab.url.startsWith('chrome://')
    ) {
      try {
        await browser.scripting.insertCSS({
          target: { tabId },
          css,
        })
        console.log('Font inserted')
      } catch (err) {
        console.error('Failed to insert font', err)
      }
    }
  })
})
