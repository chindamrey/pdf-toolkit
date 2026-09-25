<template>
    <AppHeader></AppHeader>
    <div class="studio">
        <!-- LEFT: dropzone + queue -->
        <section class="panel panel--left">
            <div class="dropzone" :class="{ 'dropzone--active': isDragging }" @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false" @drop.prevent="onDrop">
                <div class="dropzone__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                        <path d="M12 3v12m0-12 4 4m-4-4-4 4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
                            stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>
                <p class="dropzone__title">
                    Drop PDF files here, or
                    <button class="link-btn" type="button" @click="triggerFilePicker">browse files</button>
                </p>

                <input ref="fileInput" type="file" accept="application/pdf" multiple hidden @change="onFilePicked" />

                <div class="source-row">
                    <button class="source-btn" type="button" v-for="src in sources" :key="src.label"
                        @click="src.action">
                        <span class="source-btn__icon" v-html="src.icon"></span>
                        {{ src.label }}
                    </button>
                </div>

                <p class="shortcut-hint">
                    Shortcut: <kbd>⌘ / Ctrl + O</kbd>
                </p>
            </div>

            <div class="queue-toolbar">
                <button class="toolbar-btn toolbar-btn--primary" type="button" @click="triggerFilePicker">
                    <span class="plus">+</span> Add More Files
                </button>
                <button class="toolbar-btn" type="button" @click="reverseOrder">
                    <IconSwap /> Reverse Order
                </button>
                <button class="toolbar-btn" type="button" @click="sortAlpha">
                    <IconSort /> Sort A-Z
                </button>
                <button class="toolbar-btn toolbar-btn--danger" type="button" @click="clearQueue">
                    <IconClear /> Clear Queue
                </button>
            </div>

            <ul class="file-list">
                <li v-for="(file, index) in files" :key="file.id" class="file-row" draggable="true"
                    @dragstart="dragIndex = index" @dragover.prevent @drop="onReorderDrop(index)">
                    <span class="drag-handle" aria-hidden="true">
                        <IconGrip />
                    </span>

                    <span class="thumb" :class="`thumb--${file.accent}`">
                        <img v-if="file.thumbnailUrl" class="thumb__preview" :src="file.thumbnailUrl"
                            :alt="`First page preview of ${file.name}`" />
                        <span v-else class="thumb__label">{{ file.thumbLabel }}</span>
                    </span>

                    <div class="file-meta">
                        <div class="file-meta__title-row">
                            <span class="file-name">{{ file.name }}</span>
                            <span class="status-chip" :class="`status-chip--${file.status.tone}`">
                                <span class="status-dot"></span>{{ file.status.label }}
                            </span>
                            <span v-if="file.badge" class="badge-chip">{{ file.badge }}</span>
                        </div>
                        <div class="file-meta__sub-row">
                            <span>{{ file.sizeLabel }}</span>
                            <span class="dot-sep">•</span>
                            <span>{{ file.pageSummary }}</span>
                            <span class="dot-sep">•</span>
                            <span>
                                Range:
                                <span v-if="!file.excluded" class="range-label">{{ file.rangeLabel }}</span>
                                <span v-else class="range-label range-label--warn">
                                    {{ file.rangeLabel }} <button class="edit-btn" type="button"
                                        @click="editRange(file)">✎</button>
                                </span>
                            </span>
                        </div>
                    </div>

                    <div class="file-actions">
                        <!-- <button class="icon-btn" type="button" title="Re-scan" @click="rescan(file)">
                            <IconRefresh />
                        </button>
                        <button class="icon-btn" type="button" title="Duplicate" @click="duplicate(file)">
                            <IconCopy />
                        </button>
                        <button class="icon-btn" type="button" title="Download" @click="download(file)">
                            <IconDownload />
                        </button> -->
                        <button class="icon-btn icon-btn--danger" type="button" title="Remove"
                            @click="removeFile(file.id)">
                            <IconClose />
                        </button>
                    </div>
                </li>
            </ul>

            <p v-if="!files.length" class="empty-hint">Your queue is empty — add PDFs to begin.</p>
        </section>

        <!-- RIGHT: compilation summary -->
        <aside class="panel panel--right">
            <div class="summary-header">
                <h2>Compilation Summary</h2>
                <span class="live-pill"><span class="live-dot"></span>Live Preview</span>
            </div>

            <div class="stat-grid">
                <div class="stat-card">
                    <span class="stat-label">Queue Total</span>
                    <span class="stat-value">{{ queueTotal }} <small>files</small></span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Page Count</span>
                    <span class="stat-value">{{ pageCount }} <small>pages</small></span>
                </div>
            </div>

            <div class="size-card">
                <div class="size-card__row">
                    <span class="size-card__label">Original Size</span>
                    <span class="size-card__value size-card__value--muted">{{ formatMb(originalSizeMb) }}</span>
                </div>
                <div class="size-card__row">
                    <span class="size-card__label">Projected Output</span>
                    <span class="size-card__value size-card__value--accent">~{{ formatMb(projectedSizeMb) }}</span>
                </div>
                <div class="reduction-bar">
                    <div class="reduction-bar__fill" :style="{ width: reductionPercent + '%' }"></div>
                </div>
                <div class="size-card__row size-card__row--footer">
                    <span>{{ reductionPercent }}% storage reduction</span>
                    <span>Linearized Web Fast</span>
                </div>
            </div>

            <div class="field field--output">
                <div class="field__label-row">
                    <label for="outputName">Name your merged PDF</label>
                    <span class="sanitized-pill">✓ Auto-sanitized</span>
                </div>
                <div class="input-wrap">
                    <input id="outputName" v-model="outputFileName" placeholder="example document123" type="text" />
                    <button class="input-clear" type="button" @click="outputFileName = ''"
                        aria-label="Clear filename">✕</button>
                </div>
                <p class="output-hint">This name will be used when you download the merged file.</p>
            </div>

            <!-- <div class="field">
                <label>Compression Profile</label>
                <div class="segmented">
                    <button v-for="opt in compressionOptions" :key="opt.value" type="button" class="segmented__btn"
                        :class="{ 'segmented__btn--active': compressionProfile === opt.value }"
                        @click="compressionProfile = opt.value">
                        {{ opt.label }}
                    </button>
                </div>
            </div> -->
            <!-- 
            <div class="toggle-list">
                <label class="toggle-row">
                    <div>
                        <span class="toggle-row__title">Universal Page Numbering</span>
                        <span class="toggle-row__desc">Stamp bottom-center footer (e.g. 1 / 29)</span>
                    </div>
                    <input type="checkbox" v-model="universalPageNumbering" />
                </label>
                <label class="toggle-row">
                    <div>
                        <span class="toggle-row__title">Generate Unified TOC</span>
                        <span class="toggle-row__desc">Preserve document outlines &amp; bookmarks</span>
                    </div>
                    <input type="checkbox" v-model="generateUnifiedTOC" />
                </label>
                <label class="toggle-row">
                    <div>
                        <span class="toggle-row__title">Normalize Orientation</span>
                        <span class="toggle-row__desc">Auto-detect portrait vs landscape</span>
                    </div>
                    <input type="checkbox" v-model="normalizeOrientation" />
                </label>
            </div> -->

            <button class="merge-btn" type="button" :disabled="!queueTotal || isMerging || isPreparingFiles" @click="mergeFiles">
                <IconBolt />
                {{ isPreparingFiles ? 'Preparing previews…' : isMerging ? 'Merging PDFs…' : `Merge ${queueTotal} Files (PDF)` }}
            </button>
            <p v-if="previewCountdown" class="preview-countdown" aria-live="polite">
                Opening preview in {{ previewCountdown }}…
            </p>
            <p v-if="mergeError" class="merge-error" role="alert">{{ mergeError }}</p>
            <p class="merge-hint">Execute: <kbd>⌘</kbd> + <kbd>Enter</kbd></p>

        </aside>
    </div>

    <div v-if="previewUrl" class="preview-backdrop" role="presentation" @click.self="closePreview">
        <section class="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title">
            <header class="preview-modal__header">
                <div>
                    
                    <h2 id="preview-title">Preview your PDF</h2>
                    <p>{{ outputFileName }}.pdf</p>
                </div>
                <button class="preview-modal__close" type="button" aria-label="Close preview" @click="closePreview">
                    <IconClose />
                </button>
            </header>
            <iframe class="preview-frame" :src="previewUrl" :title="`Preview of ${previewFileName}`"></iframe>
            <footer class="preview-modal__footer">
                <button class="preview-cancel" type="button" @click="closePreview">Cancel</button>
                <button class="preview-download" type="button" @click="downloadPreview">
                    <IconDownload /> Download PDF
                </button>
            </footer>
        </section>
    </div>
</template>

<script setup>
import { ref, computed, h, reactive } from 'vue'
import { PDFDocument } from 'pdf-lib'
import PdfThumbnailWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'
import AppHeader from '@/components/layouts/AppHeader.vue';

/* ---------------- icon helpers (inline, dependency-free) ---------------- */
const svgIcon = (paths) => (props) =>
    h(
        'svg',
        { viewBox: '0 0 24 24', width: 20, height: 18, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        paths.map((d) => h('path', { d }))
    )

const IconSwap = svgIcon(['M7 4v13M7 17l-3-3m3 3 3-3', 'M17 20V7m0 0 3 3m-3-3-3 3'])
const IconSort = svgIcon(['M4 6h9M4 12h6M4 18h3', 'M17 4v16m0 0-3-3m3 3 3-3'])
const IconClear = svgIcon(['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'])
const IconGrip = svgIcon(['M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01'])
const IconClose = svgIcon(['M6 6l12 12', 'M18 6 6 18'])
const IconBolt = svgIcon(['M13 2 4 14h6l-1 8 9-12h-6z'])
const IconDownload = svgIcon(['M12 3v12m0 0 4-4m-4 4-4-4', 'M5 19h14'])

/* ---------------------------- source buttons ---------------------------- */
const folderIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>'
const driveIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3 3 12l3 6h10l3-6-5-9z"/></svg>'
const dropboxIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 3 6 4-6 4-6-4 6-4zm12 0-6 4 6 4 6-4-6-4zM6 11l6 4 6-4M6 19l6-4 6 4"/></svg>'
const cloudIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 18a4 4 0 0 1-.5-8 5 5 0 0 1 9.6-1.7A4.5 4.5 0 0 1 17 18H7z"/></svg>'

const fileInput = ref(null)
const isDragging = ref(false)
const dragIndex = ref(null)

const triggerFilePicker = () => fileInput.value?.click()

const sources = [
    { label: 'File Explorer', icon: folderIcon, action: triggerFilePicker },

]

/* ------------------------------- file queue ------------------------------ */
let nextId = 4
const files = ref([
])
let thumbnailWorker

const createThumbnail = async (file) => {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
    if (!thumbnailWorker) thumbnailWorker = new PdfThumbnailWorker()
    GlobalWorkerOptions.workerPort = thumbnailWorker
    const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 0.28 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    await page.render({ canvas, canvasContext: context, viewport }).promise
    pdf.cleanup()
    return canvas.toDataURL('image/jpeg', 0.82)
}

const addFiles = async (fileList) => {
    const pdfFiles = Array.from(fileList || []).filter((f) =>
        f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    )

    await Promise.all(pdfFiles.map(async (f) => {
        const queueItem = reactive({
            id: nextId++,
            source: f,
            name: f.name,
            sizeMb: +(f.size / (1024 * 1024)).toFixed(1) || 0.1,
            pages: 0,
            pageSummary: 'Reading pages…',
            accent: ['blue', 'green', 'rose'][files.value.length % 3],
            thumbLabel: '…',
            thumbnailUrl: '',
            status: { label: 'Reading', tone: 'warn' },
            badge: '',
            excluded: false,
            rangeLabel: 'All pages',
        })
        files.value.push(queueItem)

        try {
            const document = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true })
            queueItem.pages = document.getPageCount()
            queueItem.pageSummary = `${queueItem.pages} ${queueItem.pages === 1 ? 'page' : 'pages'}`
            queueItem.thumbLabel = 'p.1'
            queueItem.status = { label: 'Ready', tone: 'ready' }
            try {
                queueItem.thumbnailUrl = await createThumbnail(f)
            } catch (error) {
                console.error(`Unable to render a thumbnail for ${f.name}`, error)
                queueItem.badge = 'Preview unavailable'
            }
        } catch {
            queueItem.pageSummary = 'Unable to read pages'
            queueItem.status = { label: 'Invalid PDF', tone: 'danger' }
            queueItem.badge = 'Skipped'
            queueItem.excluded = true
        }
    }))
}

const onFilePicked = (e) => {
    void addFiles(e.target.files)
    e.target.value = ''
}
const onDrop = (e) => {
    isDragging.value = false
    void addFiles(e.dataTransfer.files)
}

const removeFile = (id) => {
    files.value = files.value.filter((f) => f.id !== id)
}
const clearQueue = () => (files.value = [])
const reverseOrder = () => (files.value = [...files.value].reverse())
const sortAlpha = () => (files.value = [...files.value].sort((a, b) => a.name.localeCompare(b.name)))

const onReorderDrop = (targetIndex) => {
    if (dragIndex.value === null || dragIndex.value === targetIndex) return
    const list = [...files.value]
    const [moved] = list.splice(dragIndex.value, 1)
    list.splice(targetIndex, 0, moved)
    files.value = list
    dragIndex.value = null
}

/* ------------------------------ derived stats ----------------------------- */
const queueTotal = computed(() => files.value.length)
const pageCount = computed(() => files.value.reduce((sum, f) => sum + f.pages, 0))
const originalSizeMb = computed(() => files.value.reduce((sum, f) => sum + f.sizeMb, 0))
const isPreparingFiles = computed(() => files.value.some((file) => file.status.label === 'Reading'))

const compressionOptions = [
    { label: 'Max Quality', value: 'max', ratio: 0.92 },
    { label: 'Balanced', value: 'balanced', ratio: 0.49 },
    { label: 'Smallest', value: 'smallest', ratio: 0.22 },
]
const compressionProfile = ref('balanced')
const activeRatio = computed(
    () => compressionOptions.find((o) => o.value === compressionProfile.value)?.ratio ?? 0.5
)
const projectedSizeMb = computed(() => originalSizeMb.value * activeRatio.value)
const reductionPercent = computed(() =>
    originalSizeMb.value ? Math.round((1 - activeRatio.value) * 100) : 0
)
const formatMb = (n) => `${n.toFixed(1)} MB`

/* ------------------------------- form fields ------------------------------ */
const outputFileName = ref('')
const isMerging = ref(false)
const mergeError = ref('')
const previewUrl = ref('')
const previewFileName = ref('')
const previewCountdown = ref(0)

const closePreview = () => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
    previewFileName.value = ''
}

const downloadPreview = () => {
    const link = document.createElement('a')
    link.href = previewUrl.value
    link.download = previewFileName.value
    link.click()
    window.setTimeout(closePreview, 0)
}

const mergeFiles = async () => {
    const validFiles = files.value.filter((file) => file.source && !file.excluded && file.status.label === 'Ready')
    if (!validFiles.length) {
        mergeError.value = 'Add at least one valid PDF before merging.'
        return
    }

    isMerging.value = true
    mergeError.value = ''

    try {
        const mergedPdf = await PDFDocument.create()
        for (const file of validFiles) {
            const sourcePdf = await PDFDocument.load(await file.source.arrayBuffer(), { ignoreEncryption: true })
            const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())
            pages.forEach((page) => mergedPdf.addPage(page))
        }

        const filenameBase = outputFileName.value.trim()
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
            .replace(/\.pdf$/i, '') || 'merged-document'
        const bytes = await mergedPdf.save()
       
        closePreview()
        previewFileName.value = `${filenameBase}.pdf`
        previewUrl.value = URL.createObjectURL(
            new Blob([bytes], { type: 'application/pdf' })
        )
    } catch (error) {
        console.error('Unable to merge PDFs', error)
        mergeError.value = 'Unable to merge one or more PDFs. Check that they are valid and not password protected.'
    } finally {
        isMerging.value = false
    }
}

</script>
<style scoped>
:root {
    color-scheme: light;
}

.studio {
    --bg: var(--color-background);
    --panel: var(--color-background);
    --border: var(--color-border);
    --ink: var(--color-text);
    --ink-muted: #837f99;
    --accent: var(--color-primary);
    --accent-soft: var(--color-secondary);
    --green: #1a9d6c;
    --blue: #2f6fe0;
    --amber: #b8790b;
    --radius-lg: 16px;
    --radius-md: 10px;

    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.9fr);
    gap: 20px;
    max-width: 1240px;
    margin: 0 auto;
    padding: 24px;
    background: var(--bg);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--ink);
    box-sizing: border-box;
}

.studio * {
    box-sizing: border-box;
}

@media (max-width: 880px) {
    .studio {
        grid-template-columns: 1fr;
        max-width: 720px;
    }
}

.panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
}

/* ---------- dropzone ---------- */
.dropzone {
    background: var(--panel);
    border: 1.5px dashed var(--border);
    border-radius: var(--radius-lg);
    padding: 34px 24px;
    text-align: center;
    transition: border-color 0.15s ease, background 0.15s ease;
}

.dropzone--active {
    border-color: var(--accent);
    background: #fdf6f8;
}

.dropzone__icon {
    width: 44px;
    height: 44px;
    margin: 0 auto 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: linear-gradient(145deg, #f7c6d2, #ef97ab);
    color: #7a1330;
}

.dropzone__title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 6px;
}

.link-btn {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    font-weight: 600;
    color: var(--accent);
    cursor: pointer;
    text-decoration: none;
}

.link-btn:hover {
    text-decoration: underline;
}

.dropzone__subtitle {
    font-size: 14px;
    color: var(--ink-muted);
    margin: 0 0 20px;
    line-height: 1.5;
}

.accent-link {
    color: #6659c8;
    font-weight: 600;
}

.source-row {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 14px;
}

.source-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    background: var(--color-accent);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 12px;
    cursor: pointer;
}

.source-btn:hover {
    border-color: var(--color-hover);
    transition: border-color 0.15s ease;
    /* background: #faf9ff; */
}

.source-btn__icon {
    display: inline-flex;

    color: var(--color-text);
}

.shortcut-hint {
    font-size: 12px;
    color: var(--ink-muted);
    margin: 0;
}

kbd {
    font-family: inherit;
    font-size: 12px;
    background: var(--color-accent);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 1px 6px;
}

/* ---------- queue toolbar ---------- */
.queue-toolbar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
}

.toolbar-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    background: var(--color-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 7px 12px;
    cursor: pointer;
}

.toolbar-btn:hover {
    border-color: var(--color-hover);
    transition: border-color 0.20s ease;
    opacity: 0.90;
}

.toolbar-btn--danger {
    margin-left: auto;
    color: var(--color-text);
}

.plus {
    font-weight: 700;
}

/* ---------- file list ---------- */
.file-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.file-row {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 12px 14px;
}

.drag-handle {
    color: #c7c3dc;
    cursor: grab;
    display: flex;
}

.thumb {
    flex-shrink: 0;
    width: 40px;
    height: 52px;
    border-radius: 6px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 4px;
    background: repeating-linear-gradient(#eee 0 2px, transparent 2px 6px), #e9e7f5;
}

.thumb--blue {
    background-color: #e6edfd;
}

.thumb--green {
    background-color: #e3f7ee;
}

.thumb--rose {
    background-color: #fbe9ee;
}

.thumb__label {
    font-size: 8px;
    color: var(--ink-muted);
    font-weight: 600;
}

.file-meta {
    min-width: 0;
    flex: 1;
}

.file-meta__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.file-name {
    font-size: 13.5px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.status-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
}

.status-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
}

.status-chip--ready {
    background: #e6f7ef;
    color: var(--green);
}

.status-chip--ready .status-dot {
    background: var(--green);
}

.status-chip--warn {
    background: #fdf1de;
    color: var(--amber);
}

.status-chip--warn .status-dot {
    background: var(--amber);
}

.status-chip--danger {
    background: #fdeaec;
    color: #c23a3a;
}

.status-chip--danger .status-dot {
    background: #c23a3a;
}

.badge-chip {
    font-size: 11px;
    font-weight: 600;
    color: #5c5878;
    background: #f1eff9;
    padding: 2px 8px;
    border-radius: 999px;
}

.file-meta__sub-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--ink-muted);
    margin-top: 4px;
    flex-wrap: wrap;
}

.dot-sep {
    color: #cfc9e0;
}

.range-label {
    color: var(--ink-muted);
}

.range-label--warn {
    color: #c2762b;
    font-weight: 500;
}

.edit-btn {
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
    padding: 0 0 0 2px;
}

.file-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
}

.icon-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 7px;
    color: #9d99b3;
    cursor: pointer;
}

.icon-btn:hover {
    /* background: #f4f2fa; */
    color: #4b4766;
}

.icon-btn--danger:hover {
    background: var(--color-primary);
    color: var(--color-text);
}

.empty-hint {
    text-align: center;
    color: var(--ink-muted);
    font-size: 13px;
    padding: 24px;
}

/* ---------- right panel ---------- */
.panel--right {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    gap: 18px;
    height: fit-content;
}

.summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.summary-header h2 {
    font-size: 15px;
    margin: 0;
}

.live-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    color: var(--green);
    background: #e6f7ef;
    padding: 3px 9px;
    border-radius: 999px;
}

.live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
}

.stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.stat-card {
    background: var(--color-accent);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 12px;
}

.stat-label {
    display: block;
    font-size: 10.5px;
    letter-spacing: 0.03em;
    color: var(--ink-muted);
    margin-bottom: 6px;
}

.stat-value {
    font-size: 22px;
    font-weight: 700;
}

.stat-value small {
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-muted);
}

.size-card {
    background: var(--color-accent);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 14px;
}

.size-card__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
}

.size-card__label {
    font-size: 11.5px;
    color: var(--ink-muted);
}

.size-card__value {
    font-size: 13.5px;
    font-weight: 700;
}

.size-card__value--muted {
    color: var(--ink-muted);
    font-weight: 500;
}

.size-card__value--accent {
    color: var(--accent);
    font-size: 16px;
}

.reduction-bar {
    height: 6px;
    border-radius: 999px;
    background: #e7e4f4;
    overflow: hidden;
    margin: 8px 0 6px;
}

.reduction-bar__fill {
    height: 100%;
    background: linear-gradient(90deg, #1a9d6c, #58c99a);
    border-radius: 999px;
}

.size-card__row--footer {
    font-size: 11px;
    color: var(--ink-muted);
    margin-bottom: 0;
}

.field {
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
    gap: 10px;
}

.field--output {
    gap: 9px;
    margin-bottom: 4px;
    padding: 14px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-accent);
}


.field--output .field__label-row label::before {
    content: '✦';
    margin-right: 6px;
    color: var(--color-primary);
}

.field__label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.field label {
    font-size: 12.5px;
    font-weight: 600;
}

.sanitized-pill {
    font-size: 10.5px;
    color: var(--green);
    font-weight: 600;
}

.input-wrap {
    position: relative;
}

.input-wrap input {
    width: 100%;
    font-size: 12.5px;
    padding: 9px 30px 9px 10px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--color-accent);
    color: var(--ink);
    font-family: inherit;
}

.input-wrap input:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
}

.field--output .input-wrap input {
    border-color: var(--color-primary);
    background: var(--color-background);
    box-shadow: 0 2px 7px color-mix(in srgb, var(--color-primary) 12%, transparent);
    font-weight: 600;
    animation: output-name-attention 2.4s ease-in-out infinite;
}

.field--output .input-wrap input:focus {
    animation: none;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 18%, transparent);
}

.field--output .input-wrap input::placeholder {
    color: var(--color-text);
    font-weight: 400;
    opacity: 0.45;
}

.output-hint {
    margin: 0;
    color: var(--color-text);
    font-size: 11px;
    line-height: 1.35;
    opacity: 0.65;
}

@keyframes output-name-attention {
    0%, 100% {
        border-color: var(--color-border);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary) 0%, transparent);
    }
    50% {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 5px color-mix(in srgb, var(--color-primary) 15%, transparent);
    }
}

@media (prefers-reduced-motion: reduce) {
    .field--output .input-wrap input {
        animation: none;
    }
}

.input-clear {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    background: none;
    color: var(--ink-muted);
    cursor: pointer;
    font-size: 11px;
}

.input-clear:hover {
    color: var(--color-primary);
}
.token-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 11px;
    color: var(--ink-muted);
}

.token-chip {
    font-size: 11px;
    font-weight: 600;
    color: #5c5878;
    background: #f1eff9;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 3px 9px;
    cursor: pointer;
}

.token-chip:hover {
    background: #e7e4f4;
}

.segmented {
    display: flex;
    background: var(--color-accent);
    border-radius: 9px;
    padding: 3px;
    gap: 3px;
}

.segmented__btn {
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    color: #6b6685;
    padding: 7px 0;
    border: none;
    background: transparent;
    border-radius: 7px;
    cursor: pointer;
}

.segmented__btn--active {
    background: var(--color-primary);
    color: var(--color-text);
    box-shadow: 0 1px 2px rgba(20, 10, 30, 0.08);
}

.toggle-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    cursor: pointer;
}

.toggle-row__title {
    display: block;
    font-size: 12.5px;
    font-weight: 600;
}

.toggle-row__desc {
    display: block;
    font-size: 11px;
    color: var(--ink-muted);
    margin-top: 1px;
}

.toggle-row input[type='checkbox'] {
    width: 17px;
    height: 17px;
    accent-color: var(--accent);
    flex-shrink: 0;
    cursor: pointer;
}

.merge-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 10px;
    background: var(--color-primary);
    color: var(--color-text);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 14px rgba(151, 20, 53, 0.28);
}

.merge-btn:hover {
    border-color: var(--color-hover);
    transition: border-color 0.20s ease;
    opacity: 0.90;
}

.merge-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
}

.merge-hint {
    text-align: center;
    font-size: 11px;
    color: var(--ink-muted);
    margin: 0;
}

.merge-hint kbd {
    padding: 1px 5px;
}

.sandbox-note {
    display: flex;
    gap: 10px;
    background: #eef7f1;
    border: 1px solid #d7ecdd;
    border-radius: 10px;
    padding: 12px;
    color: #1f6b45;
}

.sandbox-note strong {
    font-size: 12px;
    display: block;
    margin-bottom: 2px;
}

.sandbox-note p {
    font-size: 11px;
    margin: 0;
    line-height: 1.4;
    color: #337355;
}

.footer-status {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--ink-muted);
    padding-top: 4px;
    border-top: 1px solid var(--border);
}

.footer-status span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.thumb__preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
}

.merge-error {
    margin: 0;
    color: #c23a3a;
    font-size: 12px;
    text-align: center;
}

.preview-countdown {
    margin: -8px 0 0;
    color: var(--color-primary);
    font-size: 12px;
    font-weight: 600;
    text-align: center;
}

/* ---------- PDF preview modal ---------- */
.preview-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgba(17, 13, 27, 0.68);
    backdrop-filter: blur(9px);
    animation: preview-fade-in 0.2s ease-out;
}

.preview-modal {
    display: flex;
    flex-direction: column;
    width: min(960px, 100%);
    height: min(780px, calc(100vh - 48px));
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: 18px;
    background: var(--color-background);
    color: var(--color-text);
    box-shadow: 0 28px 80px rgba(7, 5, 12, 0.48);
    animation: preview-rise-in 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.preview-modal__header,
.preview-modal__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
}

.preview-modal__header {
    border-bottom: 1px solid #e9e5f1;
    border-bottom-color: var(--color-border);
    background: var(--color-background);
}

.preview-modal__header h2,
.preview-modal__header p {
    margin: 0;
}

.preview-modal__header h2 {
    color: var(--color-text);
    font-size: 19px;
    letter-spacing: -0.02em;
}

.preview-modal__header > div > p:last-child {
    margin-top: 3px;
    color: var(--color-text);
    opacity: 0.65;
    font-size: 12px;
}

.preview-modal__eyebrow {
    color: var(--color-primary);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.09em;
}

.preview-modal__close,
.preview-cancel,
.preview-download {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border-radius: 8px;
    padding: 9px 13px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

.preview-modal__close {
    width: 34px;
    height: 34px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--color-text);
    opacity: 0.7;
}

.preview-modal__close:hover {
    background: var(--color-accent);
    color: var(--color-text);
    opacity: 1;
}

.preview-frame {
    flex: 1;
    width: 100%;
    min-height: 0;
    border: none;
    background: var(--color-accent);
}

.preview-modal__footer {
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);
    background: var(--color-background);
}

.preview-cancel {
    border: 1px solid var(--color-border);
    background: var(--color-accent);
    color: var(--color-text);
}

.preview-download {
    border: none;
    background: var(--color-primary);
    color: var(--color-text);
    box-shadow: 0 6px 14px color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.preview-cancel:hover {
    border-color: var(--color-hover);
}

.preview-download:hover {
    transform: translateY(-1px);
    opacity: 0.9;
}

@keyframes preview-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes preview-rise-in {
    from { opacity: 0; transform: translateY(14px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 640px) {
    .preview-backdrop {
        padding: 12px;
    }

    .preview-modal {
        height: calc(100vh - 24px);
        border-radius: 12px;
    }

    .preview-modal__header,
    .preview-modal__footer {
        padding: 14px;
    }
}

/* ---------- responsive ---------- */
@media (max-width: 640px) {
    .studio {
        gap: 16px;
        padding: 16px;
    }

    .panel {
        gap: 14px;
    }

    .dropzone {
        padding: 26px 16px;
        border-radius: 14px;
    }

    .dropzone__title {
        font-size: 15px;
        line-height: 1.5;
    }

    .queue-toolbar {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
    }

    .toolbar-btn {
        justify-content: center;
        min-height: 40px;
        padding: 8px;
        font-size: 12px;
    }

    .toolbar-btn--danger {
        margin-left: 0;
    }

    .file-list {
        gap: 8px;
    }

    .file-row {
        position: relative;
        align-items: flex-start;
        gap: 10px;
        padding: 12px;
    }

    .drag-handle {
        display: none;
    }

    .thumb {
        width: 34px;
        height: 46px;
    }

    .file-meta__title-row {
        padding-right: 24px;
        gap: 6px;
    }

    .file-name {
        width: 100%;
        font-size: 13px;
    }

    .file-meta__sub-row {
        gap: 4px;
        font-size: 11px;
    }

    .file-actions {
        position: absolute;
        top: 9px;
        right: 8px;
    }

    .panel--right {
        padding: 16px;
        border-radius: 14px;
        gap: 16px;
    }

    .stat-card {
        padding: 11px;
    }

    .size-card__row--footer,
    .field__label-row {
        align-items: flex-start;
        gap: 8px;
    }

    .size-card__row--footer {
        flex-direction: column;
    }
}

@media (max-width: 380px) {
    .studio {
        padding: 12px;
    }

    .queue-toolbar {
        grid-template-columns: 1fr;
    }

    .stat-grid {
        grid-template-columns: 1fr;
    }

    .summary-header {
        align-items: flex-start;
        gap: 8px;
    }
}
</style>
