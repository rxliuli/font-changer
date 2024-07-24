<script lang="ts">
  import { sendMessage } from '@/lib/messaging'
  import type { StorageValues } from '@/lib/messaging'

  let fonts: chrome.fontSettings.FontName[] = []
  let selected: string = ''

  onMount(async () => {
    fonts = await sendMessage('getFontList', undefined)
    selected =
      ((await browser.storage.local.get('selectedFontId')) as StorageValues)
        .selectedFontId ?? ''
  })

  async function onChangeFont(
    event: Event & { currentTarget: EventTarget & HTMLSelectElement },
  ) {
    selected = event.currentTarget.value
    await browser.storage.local.set({
      selectedFontId: selected,
    } as Partial<StorageValues>)
    await sendMessage('refreshTabs', undefined)
  }
</script>

<main>
  <form>
    <div style:font-family={selected} class="mb-6">
      <label for="font" class="block mb-2">Select Font</label>
      <select
        class="w-full p-2 rounded border"
        bind:value={selected}
        disabled={fonts.length === 0}
        id="font"
        on:change={onChangeFont}
      >
        {#each fonts as font}
          <option value={font.fontId}>{font.displayName}</option>
        {/each}
      </select>
    </div>
  </form>
</main>

<style>
</style>
