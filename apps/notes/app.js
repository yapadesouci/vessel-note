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

  if (!id) {
    clearEditor()
    editorArea.style.display = 'none'
    emptyState.style.display = 'flex'
    return
  }

  const note = notes.find((n) => n.id === id)
  if (!note) return

  editorArea.style.display = 'flex'
  emptyState.style.display = 'none'
  loadNote(note)
  vessel.sections.setActive(id)
  vessel.storage.set('activeNoteId', id)
}

document.addEventListener('DOMContentLoaded', async () => {
  await vessel.ready()

  await loadNotes()

  const savedActiveId = await vessel.storage.get('activeNoteId')
  const restoredId = notes.find((n) => n.id === savedActiveId)?.id ?? notes[0]?.id ?? null

  syncSections()
  if (restoredId) vessel.sections.setActive(restoredId)

  vessel.sections.onSelect((id) => selectNote(id))

  vessel.sections.onReorder((ids) => {
    reorderNotes(ids)
    syncSections()
    saveNotes()
  })

  initEditor({
    onTitleChange: debounce((title) => {
      if (!activeId) return
      setTitle(activeId, title)
      syncSections()
      saveNotes()
    }, 500),
    onBodyChange: debounce((md) => {
      if (!activeId) return
      setContent(activeId, md)
      saveNotes()
    }, 500)
  })

  selectNote(restoredId)

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
})
