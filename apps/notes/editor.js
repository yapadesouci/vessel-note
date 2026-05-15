import { mdToHtml, htmlToMd } from './md.js'

const titleEl = () => document.getElementById('note-title')
const bodyEl = () => document.getElementById('note-body')

export function initEditor({ onTitleChange, onBodyChange }) {
  titleEl().addEventListener('input', () => onTitleChange(titleEl().value))
  bodyEl().addEventListener('input', () => onBodyChange(htmlToMd(bodyEl().innerHTML)))

  document.querySelectorAll('.fmt-btn[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.execCommand(btn.dataset.cmd)
      bodyEl().focus()
    })
  })

  document.getElementById('btn-checklist').addEventListener('click', () => {
    document.execCommand(
      'insertHTML',
      false,
      '<div class="checklist-item"><label><input type="checkbox"><span contenteditable>\u200B</span></label></div>'
    )
    bodyEl().focus()
  })
}

export function loadNote(note) {
  titleEl().value = note.title
  bodyEl().innerHTML = mdToHtml(note.content)
}

export function clearEditor() {
  titleEl().value = ''
  bodyEl().innerHTML = ''
}

export function readBody() {
  return htmlToMd(bodyEl().innerHTML)
}
