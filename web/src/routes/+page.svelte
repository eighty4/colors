<script>
    import Palette from '$lib/palette/palette.svelte'
</script>

<style>
    * {
        margin: 0;
        padding: 0;
    }
    header {
        background: purple;
        width: 100%;
        height: 50px;
    }
    div {
        display: flex;
    }
    aside {
        background: red;
        width: 50px;
        height: 100%;
    }
    main {
        background: blue;
        flex: 1;
        height: 100%;
    }
</style>

<header>
    <h1>eighty4 / Colors</h1>
</header>
<div>
    <aside>
        <p>wtf</p>
    </aside>
    <main>
        <p>wtf</p>
    </main>
</div>

<Palette/>
<Palette/>
<Palette/>
