import { loadNotes, saveNotes, createNote, setTitle, setContent, deleteNote, reorderNotes, notes } from './notes.js'
import { initEditor, loadNote, clearEditor } from './editor.js'

function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

let activeId = null

function syncSections() {
  vessel.sections.set(notes.map((n) => ({ id: n.id, name: n.title || 'Untitled' })))
}

function selectNote(id) {
  activeId = id
  const editorArea = document.getElementById('editor-area')
  const emptyState = document.getElementById('empty-state')
  const fmtTools = document.getElementById('fmt-tools')
  const btnDelete = document.getElementById('btn-delete')

  if (!id) {
    clearEditor()
    editorArea.style.display = 'none'
    emptyState.style.display = 'flex'
    fmtTools.style.display = 'none'
    btnDelete.style.display = 'none'
    return
  }

  editorArea.style.display = 'flex'
  emptyState.style.display = 'none'
  fmtTools.style.display = 'contents'
  btnDelete.style.display = ''

  const note = notes.find((n) => n.id === id)
  if (!note) return

  loadNote(note)
  vessel.sections.setActive(id)
  vessel.storage.set('activeNoteId', id)
}

document.addEventListener('DOMContentLoaded', async () => {
  // Register button handlers first so they always work, even if async init fails
  document.getElementById('btn-new').addEventListener('click', () => {
    const note = createNote()
    syncSections()
    saveNotes()
    selectNote(note.id)
  })

  document.getElementById('btn-delete').addEventListener('click', () => {
    if (!activeId) return
    const nextId = deleteNote(activeId)
    syncSections()
    saveNotes()
    selectNote(nextId)
  })

  await vessel.ready()

  await loadNotes()

  const savedActiveId = await vessel.storage.get('activeNoteId')
  const restoredId = notes.find((n) => n.id === savedActiveId)?.id ?? notes[0]?.id ?? null

  syncSections()
  if (restoredId) vessel.sections.setActive(restoredId)

  vessel.sections.onSelect((id) => selectNote(id))

  if (typeof vessel.sections.onReorder === 'function') {
    vessel.sections.onReorder((ids) => {
      reorderNotes(ids)
      syncSections()
      saveNotes()
    })
  }

  initEditor({
    onTitleChange: debounce((title) => {
      if (!activeId) return
      setTitle(activeId, title)
      syncSections()
      saveNotes()
    }, 500),
    onBodyChange: debounce((html) => {
      if (!activeId) return
      setContent(activeId, html)
      saveNotes()
    }, 500)
  })

  selectNote(restoredId)
})
