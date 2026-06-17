const toastEl = document.getElementById('toast')!
const overlayEl = document.getElementById('overlay')!
const overlayTextEl = document.getElementById('overlay-text')!

export function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toastEl.textContent = msg
  toastEl.className = 'toast ' + type
  setTimeout(() => { toastEl.className = '' }, 3000)
}

export function showLoading(text?: string) {
  overlayTextEl.textContent = text || 'Loading model...'
  overlayEl.classList.add('active')
}

export function hideLoading() {
  overlayEl.classList.remove('active')
}

export function modelName(path: string | null): string {
  if (!path) return ''
  return path.split('/').pop() || path
}
