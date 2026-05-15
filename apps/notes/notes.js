export let notes = []
export let activeId = null

export async function loadNotes() {
  const stored = await vessel.storage.get('notes')
  notes = Array.isArray(stored) ? stored : []
  return notes
}

export async function saveNotes() {
  await vessel.storage.set('notes', notes)
}

function uuid() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  )
}

export function createNote() {
  const now = new Date().toISOString()
  const note = { id: uuid(), title: '', content: '', createdAt: now, updatedAt: now }
  notes = [note, ...notes]
  return note
}

export function setTitle(id, title) {
  notes = notes.map((n) =>
    n.id === id ? { ...n, title, updatedAt: new Date().toISOString() } : n
  )
}

export function setContent(id, content) {
  notes = notes.map((n) =>
    n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n
  )
}

export function deleteNote(id) {
  const idx = notes.findIndex((n) => n.id === id)
  if (idx === -1) return null
  notes = notes.filter((n) => n.id !== id)
  if (notes.length === 0) return null
  return notes[Math.min(idx, notes.length - 1)].id
}

export function reorderNotes(orderedIds) {
  const map = new Map(notes.map((n) => [n.id, n]))
  notes = orderedIds.map((id) => map.get(id)).filter(Boolean)
}
