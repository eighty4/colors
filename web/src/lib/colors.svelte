<script lang="ts">
    import Palette from './palette/palette.svelte'
    import {onMount} from 'svelte'
    import {addPalette, getPalettes, type PaletteRecord} from '$lib/data'

    let palettes: Array<PaletteRecord>
    let saving: Partial<PaletteRecord> | null

    onMount(async () => {
        palettes = await getPalettes()
    })

    async function onAddPaletteButtonClick() {
        saving = {
            name: 'asdf',
            colors: [
                '#ff00ff',
                'rgb(66, 158, 157)',
                'rgb(100, 149, 237)',
                'rgb(0, 0, 139)',
            ],
        }
        const saved = await addPalette(saving)
        saving = null
        palettes.push(saved)
        palettes = palettes
    }
</script>

<button on:click={onAddPaletteButtonClick} disabled={!!saving}>Click me</button>

{#if palettes}
    {#each palettes as palette}
        <Palette palette={palette}/>
    {/each}
{/if}

<style>
    /*.row {*/
    /*    display: flex;*/
    /*    flex-direction: row;*/
    /*    justify-content: center;*/
    /*    width: 100%;*/
    /*    padding: 0 .5rem;*/
    /*}*/

    /*.row + .row {*/
    /*    margin-top: 1rem;*/
    /*}*/
</style>
