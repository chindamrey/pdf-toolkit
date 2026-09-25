<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const links = [
    { label: 'Work', href: '#', active: true },
    { label: 'Studio', href: '#' },
    { label: 'Journal', href: '#' },
    { label: 'Contact', href: '#' },
]

const isOpen = ref(false)
const BREAKPOINT = 760

const toggleMenu = () => {
    isOpen.value = !isOpen.value
}

const closeMenu = () => {
    isOpen.value = false
}

const handleResize = () => {
    if (window.innerWidth > BREAKPOINT && isOpen.value) {
        isOpen.value = false
    }
}

// ---- Theme ----
const THEME_KEY = 'theme-preference'
const theme = ref('light')

const applyTheme = (value) => {
    theme.value = value
    document.documentElement.setAttribute('data-theme', value)
    try {
        localStorage.setItem(THEME_KEY, value)
    } catch (e) {
        // localStorage unavailable (private browsing, etc.) — theme still applies for this session
    }
}

const toggleTheme = () => {
    applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

const initTheme = () => {
    let saved = null
    try {
        saved = localStorage.getItem(THEME_KEY)
    } catch (e) {
        // ignore
    }
    if (saved === 'dark' || saved === 'light') {
        applyTheme(saved)
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        applyTheme(prefersDark ? 'dark' : 'light')
    }
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
    initTheme()
})
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))
</script>

<template>
    <nav class="nav" :class="{ open: isOpen, 'nav--dark': theme === 'dark' }">
        <div class="nav-inner">
            <a href="#" class="brand">Merge<span class="primary-text">PDF</span></a>

            <!-- <ul class="links">
                <li v-for="link in links" :key="link.label">
                    <a :href="link.href" :class="{ active: link.active }">{{ link.label }}</a>
                </li>
            </ul> -->

            <div class="nav-actions">
                <button class="theme-toggle" type="button"
                    :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
                    @click="toggleTheme">
                    <span v-if="theme === 'dark'">☀️</span>
                    <span v-else>🌙</span>
                </button>
                <a href="#" class="btn btn-ghost">Sign in</a>
                <a href="#" class="btn btn-solid">Start a project</a>
            </div>

            <button class="toggle" aria-label="Toggle menu" :aria-expanded="isOpen" aria-controls="mobile-panel"
                @click="toggleMenu">
                <span class="toggle-bars"><span></span><span></span><span></span></span>
            </button>
        </div>

        <div class="mobile-panel" id="mobile-panel">
            <div class="mobile-panel-inner">
                <!-- <a v-for="link in links" :key="link.label" :href="link.href" class="link"
                    :class="{ active: link.active }" @click="closeMenu">{{ link.label }}</a> -->
                <div class="mobile-actions">
                    <a href="#" class="btn btn-ghost" @click="closeMenu">Sign in</a>
                    <a href="#" class="btn btn-solid" @click="closeMenu">Start a project</a>
                    <button class="theme-toggle theme-toggle--mobile" type="button"
                        :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
                        @click="toggleTheme">
                        <span v-if="theme === 'dark'">☀️ Light mode</span>
                        <span v-else>🌙 Dark mode</span>
                    </button>
                </div>
            </div>
        </div>
    </nav>
</template>

<style scoped>
.nav {
    --ink: var(--color-text);
    --paper: var(--color-background);
    --line: var(--color-border);
    --moss: var(--color-primary);
}

.nav {
    position: sticky;
    top: env(safe-area-inset-top, 0px);
    z-index: 100;
    background: var(--color-background);
    border-bottom: 1px solid var(--line);
    /* font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; */
    transition: background-color .2s ease, border-color .2s ease;
}

.nav-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
}

.primary-text {
    color: var(--moss);
}

.brand {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-family: 'Fraunces', Georgia, serif;
    font-size: 21px;
    font-weight: 600;
    color: var(--ink);
    text-decoration: none;
    letter-spacing: -0.01em;
    flex-shrink: 0;
}

.brand-mark {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--moss);
    flex-shrink: 0;
}

.links {
    display: flex;
    align-items: center;
    gap: 4px;
    list-style: none;
    margin: 0;
    padding: 0;
}

.links a {
    display: inline-block;
    padding: 8px 14px;
    border-radius: 6px;
    color: var(--ink);
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    transition: background-color 0.15s ease, color 0.15s ease;
}

.links a:hover {
    background: var(--line);
    border-color: var(--color-hover);
}

.links a.active {
    color: var(--moss);
}

.links a:focus-visible {
    outline: 2px solid var(--moss);
    outline-offset: 2px;
}

.nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

.theme-toggle {
    width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    transition: background-color 0.15s ease, transform 0.12s ease;
}

.theme-toggle:hover {
    background: var(--line);
}

.theme-toggle:active {
    transform: translateY(1px);
}

.theme-toggle:focus-visible {
    outline: 2px solid var(--moss);
    outline-offset: 2px;
}

.theme-toggle--mobile {
    width: 100%;
    height: auto;
    padding: 10px 16px;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    color: var(--ink);
}

.btn {
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    border-radius: 6px;
    padding: 9px 16px;
    cursor: pointer;
    border: 1px solid transparent;
    text-decoration: none;
    transition: transform 0.12s ease, background-color 0.15s ease;
    display: inline-block;
}

.btn:active {
    transform: translateY(1px);
}

.btn-ghost {
    background: transparent;
    color: var(--ink);
    border-color: var(--line);
}

.btn-ghost:hover {
    background: var(--line);
}

.btn-solid {
    background: var(--moss);
    color: var(--color-text);
}

.btn-solid:hover {
    opacity: 0.92;
}

.toggle {
    display: none;
    width: 40px;
    height: 40px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
}

.toggle:focus-visible {
    outline: 2px solid var(--moss);
    outline-offset: 2px;
}

.toggle-bars {
    position: relative;
    width: 18px;
    height: 12px;
}

.toggle-bars span {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--ink);
    border-radius: 2px;
    transition: transform 0.25s ease, opacity 0.2s ease, top 0.25s ease;
}

.toggle-bars span:nth-child(1) {
    top: 0;
}

.toggle-bars span:nth-child(2) {
    top: 5px;
}

.toggle-bars span:nth-child(3) {
    top: 10px;
}

.nav.open .toggle-bars span:nth-child(1) {
    top: 5px;
    transform: rotate(45deg);
}

.nav.open .toggle-bars span:nth-child(2) {
    opacity: 0;
}

.nav.open .toggle-bars span:nth-child(3) {
    top: 5px;
    transform: rotate(-45deg);
}

.mobile-panel {
    display: none;
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.28s ease;
    border-top: 1px solid transparent;
}

.nav.open .mobile-panel {
    max-height: 420px;
    border-top: 1px solid var(--line);
}

.mobile-panel-inner {
    padding: 12px 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.mobile-panel .link {
    padding: 12px 10px;
    color: var(--ink);
    text-decoration: none;
    font-size: 16px;
    font-weight: 500;
    border-radius: 6px;
}

.mobile-panel .link:hover {
    background: var(--line);
}

.mobile-panel .link.active {
    color: var(--moss);
}

.mobile-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
    padding-top: 14px;
    border-top: 1px solid var(--line);
}

.mobile-actions .btn {
    text-align: center;
}

@media (max-width: 760px) {

    .links,
    .nav-actions .btn {
        display: none;
    }

    .toggle {
        display: inline-flex;
    }

    .mobile-panel {
        display: block;
    }

    .nav-inner {
        padding: 10px 16px;
        gap: 12px;
    }

    .mobile-panel-inner {
        padding: 12px 16px 16px;
    }
}

@media (max-width: 380px) {
    .brand {
        font-size: 19px;
    }

    .theme-toggle,
    .toggle {
        width: 36px;
        height: 36px;
    }
}

</style>
