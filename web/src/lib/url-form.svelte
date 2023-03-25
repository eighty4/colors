<script>
    let url = ''
    let ready
    let error
    let dirty
    let valid
    let input
    let button
    $: {
        if (url.length > 0) {
            valid = /^(?:https?)?\S+\.\S+$/.test(url)
            error = dirty && !valid
            ready = valid
        } else {
            valid = false
            error = false
            dirty = false
            ready = false
        }
    }

    function onBlur() {
        dirty = true
    }

    function onKeyup(e) {
        if (e.code !== 'Enter') {
            return
        }
        if (valid) {
            button.focus()
            console.log('do ajax')
        }
    }

    function onValidationMessageClick() {
        input.focus()
    }
</script>

<div class="url-form" class:error class:ready>
    <p>Pick colors from a beautifully designed webpage:</p>
    <div class="url-input">
        <label for="url">URL</label>
        <input id="url"
               placeholder="type a url here"
               bind:value={url}
               bind:this={input}
               on:blur={onBlur}
               on:keyup={onKeyup}/>
    </div>
    {#if error}
        <div class="error-message" on:click={onValidationMessageClick}>
            <div class="error-circle">
                <div class="mask"></div>
            </div>
            <div class="message">
                That's not a valid url
            </div>
        </div>
    {:else if ready}
        <button class="ready-button" bind:this={button}>
            <div class="mask"></div>
        </button>
    {/if}
</div>

<style>
    .url-form {
        padding: 2rem;
        background: hsl(0, 0%, 9%);
        width: 25rem;
        border-radius: .2rem;
        position: relative;
        border: 1px solid transparent;
        transition: background 100ms;
    }

    .url-form.error {
        border: 1px solid hsl(0, 75%, 20%);
        background: hsl(0, 50%, 6%);
    }

    .url-form.ready {
        border: 1px solid hsl(120, 75%, 20%);
        background: hsl(120, 50%, 6%);
    }

    p {
        line-height: 1rem;
    }

    .url-input {
        margin-top: 1.5rem;
        position: relative;
    }

    label {
        display: none;
    }

    input {
        height: 2.5rem;
        width: 100%;
        padding: 0 1rem;
        box-sizing: border-box;
    }

    input::placeholder {
        font-style: italic;
    }

    .error-message {
        position: absolute;
        top: 7.75rem;
        left: .8rem;
        display: flex;
        align-items: center;
        height: 2.5rem;
        border-radius: 2.5rem;
        background: hsl(0, 0%, 9%);
        border: 1px solid hsl(0, 75%, 20%);
        cursor: pointer;
    }

    .error-message .message {
        border-radius: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        padding-right: 1.25rem;
        font-weight: 700;
    }

    .error-message .error-circle {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 2.5rem;
        display: flex;
    }

    .error-message .mask {
        position: relative;
        left: 0.525rem;
        top: 0.4rem;
        width: 5rem;
        background: hsl(0, 75%, 50%);
        mask: url('/icons/error.svg') no-repeat;
        -webkit-mask: url('/icons/error.svg') no-repeat;
        mask-size: 1.75rem 1.75rem;
        -webkit-mask-size: 1.75rem 1.75rem;
    }

    .ready-button {
        position: absolute;
        top: 7.75rem;
        right: .79rem;
        display: flex;
        align-items: center;
        height: 2.5rem;
        width: 2.5rem;
        border-radius: 2.5rem;
        border: 2px solid hsl(120, 75%, 20%);
        background: hsl(120, 50%, 9%);
        cursor: pointer;
    }

    .ready-button:hover {
        background: hsl(120, 75%, 20%);
    }

    .ready-button:focus {
        border-color: hsl(120, 75%, 24%);
        background: hsl(120, 50%, 13%);
        outline: none;
    }

    .ready-button .mask {
        position: relative;
        right: 0.075rem;
        top: 0.075rem;
        background: #ddd;
        width: 2.5rem;
        height: 2.5rem;
        mask: url('/icons/check.svg') no-repeat;
        -webkit-mask: url('/icons/check.svg') no-repeat;
    }
</style>
