<script lang="ts">
    import {createEventDispatcher} from 'svelte'

    const addPalette = createEventDispatcher().bind(null, 'add-palette')
</script>

<aside>
    <button id="create-palette-link" on:click={addPalette}>
        <span>Add Palette</span>
    </button>
</aside>

<style>
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
