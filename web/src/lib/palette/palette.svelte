<script lang="ts">
    import type {PaletteRecord} from '$lib/data'

    export let palette: PaletteRecord

    let rows: Array<string>

    $: {
        rows = palette.colors
    }
</script>

<div class="row">
    {#each palette.colors as color}
        <div class="swatch" style:background={color}>

        </div>
    {/each}
</div>

<style>
    .row {
        display: flex;
        flex-direction: row;
        gap: .5rem;
        justify-content: center;
        align-items: center;
    }

    .swatch {
        height: 3rem;
        width: 5rem;
        border-radius: .1rem;
    }
</style>
