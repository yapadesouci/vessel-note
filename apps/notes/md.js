export function htmlToMd(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return nodeToMd(div).trim()
}

function wrapLines(content, open, close) {
  if (!content.includes('\n')) return `${open}${content}${close}`
  return content.split('\n').map(l => l ? `${open}${l}${close}` : l).join('\n')
}

function nodeToMd(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''
  const el = node
  const tag = el.tagName.toLowerCase()
  const inner = () => Array.from(el.childNodes).map(nodeToMd).join('')

  if (tag === 'strong' || tag === 'b') return wrapLines(inner(), '**', '**')
  if (tag === 'em' || tag === 'i') return wrapLines(inner(), '_', '_')
  if (tag === 'u') return wrapLines(inner(), '<u>', '</u>')
  if (tag === 'br') return '\n'
  if (tag === 'ul') {
    return Array.from(el.querySelectorAll(':scope > li')).map(li => `- ${Array.from(li.childNodes).map(nodeToMd).join('').trim()}`).join('\n') + '\n'
  }
  if (tag === 'ol') {
    return Array.from(el.querySelectorAll(':scope > li')).map((li, i) => `${i + 1}. ${Array.from(li.childNodes).map(nodeToMd).join('').trim()}`).join('\n') + '\n'
  }
  if (tag === 'div' && el.classList.contains('checklist-item')) {
    const cb = el.querySelector('input[type="checkbox"]')
    const span = el.querySelector('span')
    const checked = cb?.checked ? 'x' : ' '
    const text = span ? Array.from(span.childNodes).map(nodeToMd).join('').trim() : ''
    return `- [${checked}] ${text}\n`
  }
  // For block elements that contain block children (e.g. div wrapping a ul),
  // avoid adding an extra trailing newline since children already produce their own.
  if (tag === 'div' || tag === 'p') {
    const content = inner()
    return content.endsWith('\n') ? content : content + '\n'
  }
  return inner()
}

export function mdToHtml(md) {
  const lines = md.split('\n')
  let html = ''
  let listType = null // 'ul' | 'ol' | null

  function closeList() {
    if (listType) { html += listType === 'ul' ? '</ul>' : '</ol>'; listType = null }
  }

  for (const line of lines) {
    // Checklist
    const clDone = line.match(/^- \[x\] (.*)$/i)
    const clTodo = line.match(/^- \[ \] (.*)$/)
    if (clDone || clTodo) {
      closeList()
      const text = applyInline((clDone || clTodo)[1])
      const checked = clDone ? ' checked' : ''
      html += `<div class="checklist-item"><input type="checkbox"${checked}><span contenteditable>${text}</span></div>`
      continue
    }

    // Unordered list
    const ul = line.match(/^- (.+)$/)
    if (ul) {
      if (listType !== 'ul') { closeList(); html += '<ul>'; listType = 'ul' }
      html += `<li>${applyInline(ul[1])}</li>`
      continue
    }

    // Ordered list
    const ol = line.match(/^\d+\. (.+)$/)
    if (ol) {
      if (listType !== 'ol') { closeList(); html += '<ol>'; listType = 'ol' }
      html += `<li>${applyInline(ol[1])}</li>`
      continue
    }

    closeList()

    // Empty line
    if (line.trim() === '') { html += '<br>'; continue }

    // Plain text / inline-formatted line
    html += `<div>${applyInline(line)}</div>`
  }

  closeList()
  return html
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function applyInline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/&lt;u&gt;(.+?)&lt;\/u&gt;/g, '<u>$1</u>')
}
