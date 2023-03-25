<script>
    import ScrapeUrlForm from '$lib/url-form.svelte'
    import Palette from '$lib/palette/palette.svelte'

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

<header>
    <div id="app-title">
        <a id="eighty4-link" href="https://eighty4.tech">eighty4<span id="tld">.tech</span></a>
        <span id="slash">/</span>
        <span id="app-link">colors</span>
    </div>
    <div id="spacer"></div>
    <a id="github-link" href="https://github.com/eighty4/colors">
        <img alt="GitHub logo" src="github-mark-white.svg"/>
    </a>
</header>
<aside>
    <button id="create-palette-link" on:click={addPalette}>
        <span>Add Palette</span>
    </button>
</aside>
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

    header {
        background: var(--background-header);
        border-bottom: var(--border-size) solid var(--border-color);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: calc(var(--header-height) - var(--border-size));
        display: flex;
        flex-direction: row;
        justify-content: start;
        align-items: center;
        padding-left: calc(1.5 * var(--aside-width));
        padding-right: var(--half-aside-width);
    }

    header #app-title {
        font-size: 1.5rem;
        letter-spacing: .075rem;
        font-family: Quicksand, sans-serif;
        color: var(--text-primary-color);
        user-select: none;
    }

    header #app-title #eighty4-link {
        text-decoration: none;
        text-underline-offset: .175rem;
        color: var(--text-primary-color);
    }

    header #app-title #eighty4-link:hover {
        text-decoration: underline;
        text-decoration-color: mediumvioletred;
    }

    header #app-title #eighty4-link #tld {
        font-size: 1rem;
    }

    header #app-title #slash {
        margin-left: .5rem;
    }

    header #app-title #app-link {
        border: var(--border-size) solid transparent;
        cursor: pointer;
        transition: border 300ms linear;
        margin-left: .1rem;
        padding: .2rem .4rem;
        border-radius: .1rem;
    }

    header:hover #app-title #app-link {
        border: var(--border-size) solid var(--border-lite-highlight-color);
    }

    header #app-title #app-link:hover {
        border: var(--border-size) solid var(--border-hover-color);
    }

    header #spacer {
        flex: 1;
    }

    header #github-link, header #github-link img {
        height: calc(.5 * var(--header-height));
    }

    main {
        background: var(--background-main);
        color: var(--text-primary-color);
        padding: var(--half-aside-width);
        position: fixed;
        left: var(--aside-width);
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

    aside {
        background: var(--background-aside);
        position: fixed;
        left: 0;
        bottom: 0;
        top: var(--header-height);
        width: calc(var(--aside-width) - var(--border-size));
        height: 100%;
        display: flex;
        align-content: center;
        justify-content: center;
        border-right: var(--border-size) solid var(--border-color);
    }

    aside #create-palette-link {
        background-color: transparent;
        margin-top: var(--half-aside-width);
        align-self: baseline;
        user-select: none;
        cursor: pointer;
        border: var(--border-size) solid transparent;
        border-radius: .1rem;
        padding-bottom: .6rem;
        transition: border 300ms linear;
    }

    aside #create-palette-link span {
        color: var(--text-primary-color);
        font-family: BarlowThin, sans-serif;
        writing-mode: vertical-lr;
        text-orientation: upright;
        letter-spacing: -.32rem;
        text-transform: uppercase;
        font-size: 1.9rem;
        font-weight: bold;
        word-spacing: -.66rem;
    }

    aside:hover #create-palette-link {
        border: var(--border-size) solid var(--border-medium-highlight-color);
    }

    aside:hover #create-palette-link:hover {
        border: var(--border-size) solid var(--border-hover-color);
    }
</style>
