const toastEl = document.getElementById('toast')!
const overlayEl = document.getElementById('overlay')!
const overlayTextEl = document.getElementById('overlay-text')!
const offlineBanner = document.getElementById('offline-banner')!

export function showOfflineBanner() {
  offlineBanner.style.display = ''
}

export function hideOfflineBanner() {
  offlineBanner.style.display = 'none'
}

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

export function showConfirm(message: string, onConfirm: () => void): void {
  const overlay = document.getElementById('overlay')!
  const text = document.getElementById('overlay-text')!
  overlay.classList.add('active')
  text.innerHTML = `
    <div style="margin-bottom:1.5rem">${message}</div>
    <div style="display:flex;gap:0.75rem;justify-content:center">
      <button class="btn btn-danger" id="confirm-yes">Yes, Restart</button>
      <button class="btn btn-primary" id="confirm-no">Cancel</button>
    </div>
  `
  document.getElementById('confirm-yes')!.onclick = () => {
    overlay.classList.remove('active')
    onConfirm()
  }
  document.getElementById('confirm-no')!.onclick = () => {
    overlay.classList.remove('active')
  }
}
