<script>
    import Header from './header.svelte'
    import Menu from './menu.svelte'
    import Palette from './palette/palette.svelte'
    import ScrapeUrlForm from './url-form.svelte'

    let palettes = null

    new Promise((res) => {
        setTimeout(() => {
            res([
                'Palette 1', 'Palette 2', 'Palette 3'
            ])
        }, 500)
    }).then((p) => palettes = p)

    function addPalette() {
        palettes = [...palettes, `Swatch ${palettes.length + 1}`]
    }
</script>

<Header/>
<main>
    <div class="content-spacing">
        <ScrapeUrlForm/>
    </div>
    {#if palettes === null}
        <p>Loading</p>
    {:else}
        {#each palettes as palette}
            <Palette name={palette}/>
        {/each}
    {/if}
</main>
<Menu on:add-palette={addPalette}/>

<style>
    :root {
        --header-height: 3.5rem;
        --aside-width: 4.5rem;
        --half-aside-width: calc(var(--aside-width) * .5);
        --text-primary-color: #fff;
        --background-header: #000;
        --background-aside: #060606;
        --background-main: #0b0b0b;
        --border-size: .05rem;
        --border-color: #333;
        --border-medium-highlight-color: #444;
        --border-lite-highlight-color: #222;
        --border-hover-color: #aaa;
    }

    main {
        background: var(--background-main);
        color: var(--text-primary-color);
        padding: var(--half-aside-width);
        padding-left: calc(1.5 * var(--aside-width));
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        top: var(--header-height);
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: start;
    }

    .content-spacing {
        margin-bottom: var(--half-aside-width);
    }
</style>
