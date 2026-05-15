import { mdToHtml, htmlToMd } from './md.js'

const titleEl = () => document.getElementById('note-title')
const bodyEl = () => document.getElementById('note-body')

export function initEditor({ onTitleChange, onBodyChange }) {
  titleEl().addEventListener('input', () => onTitleChange(titleEl().value))
  bodyEl().addEventListener('input', () => onBodyChange(htmlToMd(bodyEl().innerHTML)))

  bodyEl().addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return
    e.target.toggleAttribute('checked', e.target.checked)
    onBodyChange(bodyEl().innerHTML)
  })

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
      '<div class="checklist-item"><input type="checkbox"><span contenteditable>\u200B</span></div>'
    )
    bodyEl().focus()
  })

  bodyEl().addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== 'Backspace') return
    const sel = window.getSelection()
    if (!sel.rangeCount) return
    const node = sel.getRangeAt(0).startContainer
    const anchor = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
    const item = anchor.closest('.checklist-item')
    if (!item) return

    const span = item.querySelector('span')
    const isEmpty = !span || span.textContent.replace(/\u200B/g, '').trim() === ''

    if (e.key === 'Backspace' && isEmpty) {
      e.preventDefault()
      const prev = item.previousElementSibling
      item.remove()
      moveCursorToEnd(sel, prev || bodyEl())
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (isEmpty) {
        // Exit checklist: replace empty item with a plain div
        const newDiv = document.createElement('div')
        newDiv.innerHTML = '\u200B'
        item.after(newDiv)
        item.remove()
        moveCursorToEnd(sel, newDiv)
      } else {
        const newItem = document.createElement('div')
        newItem.className = 'checklist-item'
        newItem.innerHTML = '<input type="checkbox"><span contenteditable>\u200B</span>'
        item.after(newItem)
        const newSpan = newItem.querySelector('span')
        const range = document.createRange()
        range.setStart(newSpan, 0)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
        newSpan.focus()
      }
    }
  })
}

function moveCursorToEnd(sel, el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
  if (el.focus) el.focus()
}

export function loadNote(note) {
  titleEl().value = note.title
  const content = note.content || ''
  // Notes are stored as markdown. Raw-HTML notes (from a prior format) are detected by
  // the presence of <div>, which our markdown never produces, and rendered as-is until
  // the user edits and re-saves them as markdown.
  bodyEl().innerHTML = content.includes('<div') ? content : mdToHtml(content)
}

export function clearEditor() {
  titleEl().value = ''
  bodyEl().innerHTML = ''
}

export function readBody() {
  return htmlToMd(bodyEl().innerHTML)
}
