<div class="swatch-box">
    <div class="swatch-color"></div>
</div>

<style>
    :root {
        --swatch-size: 3rem;
    }

    .swatch-box {
        background: darkgrey;
        width: var(--swatch-size);
        height: var(--swatch-size);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    }

    .swatch-color {
        background: white;
        width: calc(.95 * var(--swatch-size));
        height: calc(.95 * var(--swatch-size));
    }
</style>
