<script>
    import Swatch from './swatch.svelte'
</script>

<div class="palette-container">
    <div class="palette-name">Swatch!</div>
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

    .palette-name {
        font-family: Figtree, sans-serif;
        font-weight: 100;
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
