<script lang="ts">
    import Swatch from './swatch.svelte'

    export let name
    let fileDragElement = 0

    function onDropFile(e: DragEvent) {
        e.preventDefault()
        fileDragElement = 0
        console.log(e.dataTransfer.files.length, e.dataTransfer.files.length === 1 ? 'file' : 'files')
    }
</script>

<div class="container" class:dragging-file={!!fileDragElement}
     on:drop={onDropFile}
     on:dragover={(e) => e.preventDefault()}
     on:dragenter={() => fileDragElement++}
     on:dragleave={() => fileDragElement--}>
    <div class="name">{name}</div>
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
        --swatch-padding: 1rem;
    }

    .container {
        padding: 2rem;
        border: 1px solid transparent;
    }

    .name {
        margin-bottom: 1.25rem;
    }

    .container.dragging-file {
        background: hsl(120, 50%, 6%);
        border-color: hsl(120, 75%, 20%);
    }

    .swatch-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(calc(var(--swatch-size) * 1.1), 1fr));
        gap: var(--swatch-padding);
        list-style-type: none;
    }

    .swatch {
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
