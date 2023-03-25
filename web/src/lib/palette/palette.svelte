<script>
    import Swatch from './swatch.svelte'
    export let name
</script>

<div class="palette-container">
    <div>{name}</div>
    <ol class="swatch-grid">
        <li class="swatch">
            <Swatch/>
        </li>
        <li>
            <Swatch/>
        </li>
    </ol>
</div>

<style>
    :root {
        --palette-padding: .5rem;
    }

    .palette-container {
        margin-bottom: var(--palette-padding);
    }

    .swatch-grid {
        padding: var(--palette-padding);
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(calc(var(--swatch-size) * 1.1), 1fr));
        gap: var(--palette-padding);
        list-style-type: none;
    }

    .swatch {
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
