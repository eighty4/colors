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

<style>
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
</style>
