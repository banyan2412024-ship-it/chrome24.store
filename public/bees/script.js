// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  user: null,
  hives: [],
  currentScreen: 'screen-auth',
  wizard: {
    step: 1,
    totalSteps: 8,
    data: {},
    selectedPhoto: null,
  },
  offlineQueue: JSON.parse(localStorage.getItem('bee_offline_queue') || '[]'),
}

const CACHE_KEY = 'bee_cache'
const OFFLINE_KEY = 'bee_offline_queue'

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  showScreen('screen-dashboard')
  document.getElementById('bottom-nav').style.display = 'flex'
  document.getElementById('user-greeting').textContent = 'Добро пожаловать! 👋 (Welcome!)'
  await loadDashboard()
  window.addEventListener('online', syncOfflineQueue)
  setFeedingDate()
})

// ── Auth ──────────────────────────────────────────────────────────────────────
function switchAuthTab(tab) {
  document.getElementById('auth-signin').style.display = tab === 'signin' ? 'block' : 'none'
  document.getElementById('auth-signup').style.display = tab === 'signup' ? 'block' : 'none'
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0) === (tab === 'signin'))
  })
}

async function signIn() {
  const email = document.getElementById('signin-email').value.trim()
  const password = document.getElementById('signin-password').value
  if (!email || !password) return showToast('Заполните все поля (Please fill in all fields)', 'error')

  const btn = document.getElementById('signin-btn')
  btn.textContent = 'Вход... (Signing in...)'
  btn.disabled = true

  const { error } = await db.auth.signInWithPassword({ email, password })
  if (error) {
    showToast(error.message, 'error')
    btn.textContent = 'Войти (Sign In)'
    btn.disabled = false
  }
}

async function signUp() {
  const name = document.getElementById('signup-name').value.trim()
  const email = document.getElementById('signup-email').value.trim()
  const password = document.getElementById('signup-password').value
  if (!name || !email || !password) return showToast('Заполните все поля (Please fill in all fields)', 'error')
  if (password.length < 6) return showToast('Пароль должен быть не менее 6 символов (Password must be at least 6 characters)', 'error')

  const btn = document.getElementById('signup-btn')
  btn.textContent = 'Создание аккаунта... (Creating account...)'
  btn.disabled = true

  const { error } = await db.auth.signUp({
    email, password,
    options: { data: { full_name: name } }
  })

  if (error) {
    showToast(error.message, 'error')
    btn.textContent = 'Create Account'
    btn.disabled = false
  } else {
    showToast('Аккаунт создан! Проверьте email для подтверждения. (Account created! Check your email.)', 'success')
    btn.textContent = 'Создать аккаунт (Create Account)'
    btn.disabled = false
  }
}

async function signOut() {
  await db.auth.signOut()
}

async function onSignedIn(user) {
  state.user = user
  const name = user.user_metadata?.full_name || user.email.split('@')[0]
  document.getElementById('user-greeting').textContent = `Hello, ${name}! 👋`
  showScreen('screen-dashboard')
  document.getElementById('bottom-nav').style.display = 'flex'
  await loadDashboard()
  syncOfflineQueue()
}

function onSignedOut() {
  state.user = null
  state.hives = []
  showScreen('screen-auth')
  document.getElementById('bottom-nav').style.display = 'none'
}

// ── Navigation ────────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(id).classList.add('active')
  state.currentScreen = id

  // Update bottom nav active state
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
  const navMap = {
    'screen-dashboard': 'nav-home',
    'screen-feeding': 'nav-feed',
    'screen-gallery': 'nav-gallery',
  }
  if (navMap[id]) document.getElementById(navMap[id])?.classList.add('active')

  if (id === 'screen-feeding') loadFeedingHiveSelect()
  if (id === 'screen-gallery') loadGallery()
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
async function loadDashboard() {
  await Promise.all([loadHives(), loadRecentActivity()])
}

async function loadHives() {
  const { data, error } = await db.from('hives')
    .select(`*, inspections(inspection_date, queen_spotted, created_at)`)
    .eq('is_active', true)
    .order('created_at')

  if (error) return console.error(error)

  // Attach last inspection info to each hive
  state.hives = (data || []).map(hive => {
    const sorted = (hive.inspections || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const last = sorted[0] || null
    return { ...hive, _lastInspection: last }
  })
  cacheData('hives', state.hives)
  renderHiveList()
}

function renderHiveList() {
  const el = document.getElementById('hive-list')
  if (!state.hives.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏠</div>
        <p>Ульев пока нет.<br>Добавьте первый улей! (No hives yet. Add your first hive!)</p>
      </div>`
    return
  }
  el.innerHTML = state.hives.map(hive => {
    const last = hive._lastInspection
    const dateStr = last ? formatDate(last.inspection_date) : 'Осмотров не было (No inspections yet)'
    const queenBadge = last?.queen_spotted ? '<span class="badge green">👑 Матка видна (Queen seen)</span>' : ''
    return `
    <div class="hive-card" onclick="showHiveDetail('${hive.id}')" role="button" tabindex="0" aria-label="View ${hive.name}">
      <h3>🐝 ${hive.name}</h3>
      <div class="hive-meta">
        <span class="hive-stat">📅 ${dateStr}</span>
        ${queenBadge}
      </div>
    </div>
  `}).join('')
}

async function loadRecentActivity() {
  const { data, error } = await db.from('inspections')
    .select('*, hives(name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const el = document.getElementById('recent-activity')
  if (error || !data?.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>Осмотров нет.<br>Нажмите «Новый осмотр» чтобы начать. (No inspections yet. Tap New Inspection.)</p></div>`
    return
  }

  el.innerHTML = data.map(item => `
    <div class="activity-item">
      <span class="activity-icon">🔍</span>
      <div class="activity-text">
        <strong>${item.hives?.name || 'Неизвестный улей (Unknown hive)'}</strong>
        <span>${formatDate(item.inspection_date)} · ${item.queen_spotted ? '👑 Матка видна (Queen seen)' : 'Матки нет (No queen)'} · ${item.temperament || ''}</span>
      </div>
    </div>
  `).join('')
}

// ── Hive Management ───────────────────────────────────────────────────────────
function openAddHive() {
  document.getElementById('new-hive-name').value = ''
  openModal('modal-add-hive')
}

async function addHive() {
  const name = document.getElementById('new-hive-name').value.trim()
  if (!name) return showToast('Введите название улья (Please enter a hive name)', 'error')

  const { error } = await db.from('hives').insert([{ name }])

  if (error) return showToast('Не удалось добавить улей (Could not add hive)', 'error')
  closeModal('modal-add-hive')
  showToast(`${name} добавлен! (added!)`, 'success')
  await loadHives()
}

function showHiveDetail(hiveId) {
  // Start inspection pre-selected for this hive
  startInspection(hiveId)
}

// ── Inspection Wizard ─────────────────────────────────────────────────────────
function startInspection(preselectedHiveId = null) {
  state.wizard = { step: 1, totalSteps: 8, data: {}, selectedPhoto: null, preselectedHive: preselectedHiveId }
  showScreen('screen-inspect')
  renderWizardStep(1)

  // Populate hive options
  const opts = document.getElementById('hive-select-options')
  opts.innerHTML = state.hives.map(h => `
    <button class="big-opt" onclick="selectHive('${h.id}', '${h.name}', this)" aria-label="Select ${h.name}">
      <span class="opt-icon">🏠</span>${h.name}
    </button>
  `).join('')

  if (preselectedHiveId) {
    const hive = state.hives.find(h => h.id === preselectedHiveId)
    if (hive) {
      state.wizard.data.hive_id = preselectedHiveId
      state.wizard.data.hive_name = hive.name
      document.getElementById('step1-next').disabled = false
    }
  }
}

function selectHive(id, name, el) {
  document.querySelectorAll('#hive-select-options .big-opt').forEach(b => b.classList.remove('selected'))
  el.classList.add('selected')
  state.wizard.data.hive_id = id
  state.wizard.data.hive_name = name
  document.getElementById('step1-next').disabled = false
}

function selectOption(field, value, el) {
  el.closest('.big-options').querySelectorAll('.big-opt').forEach(b => b.classList.remove('selected'))
  el.classList.add('selected')
  state.wizard.data[field] = value
  const nextBtn = document.getElementById(`step${state.wizard.step}-next`)
  if (nextBtn) nextBtn.disabled = false
}

function togglePest(value, labelEl) {
  const checkbox = labelEl.querySelector('input')
  checkbox.checked = !checkbox.checked
  labelEl.classList.toggle('checked', checkbox.checked)

  if (value === 'none' && checkbox.checked) {
    document.querySelectorAll('[name="pest"]').forEach(cb => {
      if (cb.value !== 'none') { cb.checked = false; cb.closest('.checkbox-item')?.classList.remove('checked') }
    })
  } else if (value !== 'none' && checkbox.checked) {
    const noneEl = document.querySelector('[name="pest"][value="none"]')
    if (noneEl) { noneEl.checked = false; noneEl.closest('.checkbox-item')?.classList.remove('checked') }
  }

  const checked = [...document.querySelectorAll('[name="pest"]:checked')].map(c => c.value)
  state.wizard.data.pest_issues = checked
}

function wizardNext() {
  const { step, totalSteps } = state.wizard
  if (step < totalSteps) {
    state.wizard.step++
    renderWizardStep(state.wizard.step)
    if (state.wizard.step === totalSteps) renderReview()
  }
}

function wizardBack() {
  if (state.wizard.step > 1) {
    state.wizard.step--
    renderWizardStep(state.wizard.step)
  }
}

function renderWizardStep(step) {
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'))
  document.getElementById(`step-${step}`).classList.add('active')
  document.getElementById('wizard-step-label').textContent = `Шаг ${step} из ${state.wizard.totalSteps} (Step ${step} of ${state.wizard.totalSteps})`
  document.getElementById('wizard-progress').style.width = `${(step / state.wizard.totalSteps) * 100}%`
  window.scrollTo(0, 0)
}

function renderReview() {
  const d = state.wizard.data
  document.getElementById('review-summary').innerHTML = `
    <div class="review-item"><span class="review-label">🏠 Улей (Hive)</span><span>${d.hive_name || '—'}</span></div>
    <div class="review-item"><span class="review-label">👑 Матка (Queen)</span><span>${d.queen_spotted === true ? 'Да ✅ (Yes)' : d.queen_spotted === false ? 'Не видна ❓ (Not seen)' : '—'}</span></div>
    <div class="review-item"><span class="review-label">🥚 Расплод (Brood)</span><span>${capitalize(d.brood_pattern) || '—'}</span></div>
    <div class="review-item"><span class="review-label">🐝 Характер (Temperament)</span><span>${capitalize(d.temperament) || '—'}</span></div>
    <div class="review-item"><span class="review-label">☀️ Погода (Weather)</span><span>${capitalize(d.weather) || '—'}</span></div>
    <div class="review-item"><span class="review-label">🐛 Вредители (Pests)</span><span>${d.pest_issues?.length ? d.pest_issues.join(', ') : 'Нет (None)'}</span></div>
    <div class="review-item"><span class="review-label">🍯 Мёд (Honey)</span><span>${document.getElementById('honey-kg').value ? document.getElementById('honey-kg').value + ' кг (kg)' : '—'}</span></div>
    <div class="review-item"><span class="review-label">📝 Заметки (Notes)</span><span>${document.getElementById('inspection-notes').value || '—'}</span></div>
  `
}

async function saveInspection() {
  const btn = document.getElementById('save-btn')
  btn.textContent = 'Сохранение... (Saving...)'
  btn.disabled = true

  const honeyVal = document.getElementById('honey-kg').value
  const notes = document.getElementById('inspection-notes').value.trim()

  let photo_url = null
  if (state.wizard.selectedPhoto) {
    photo_url = await uploadPhoto(state.wizard.selectedPhoto)
  }

  const record = {
    hive_id: state.wizard.data.hive_id,
    queen_spotted: state.wizard.data.queen_spotted,
    brood_pattern: state.wizard.data.brood_pattern,
    temperament: state.wizard.data.temperament,
    weather: state.wizard.data.weather,
    pest_issues: state.wizard.data.pest_issues || [],
    honey_harvested_kg: honeyVal ? parseFloat(honeyVal) : null,
    notes: notes || null,
    photo_url,
    inspection_date: new Date().toISOString().split('T')[0],
  }

  if (!navigator.onLine) {
    queueOffline('inspection', record)
    showToast('Сохранено офлайн — синхронизация при подключении (Saved offline)', 'success')
    showScreen('screen-dashboard')
    return
  }

  const { error } = await db.from('inspections').insert([record])
  if (error) {
    showToast('Не удалось сохранить — проверьте соединение (Could not save — check connection)', 'error')
    btn.textContent = '💾 СОХРАНИТЬ (SAVE)'
    btn.disabled = false
    return
  }

  showToast('Осмотр сохранён! ✅ (Inspection saved!)', 'success')
  showScreen('screen-dashboard')
  loadDashboard()
}

// ── Feeding ───────────────────────────────────────────────────────────────────
function loadFeedingHiveSelect() {
  const sel = document.getElementById('feed-hive')
  sel.innerHTML = state.hives.map(h => `<option value="${h.id}">${h.name}</option>`).join('')
}

function setFeedingDate() {
  const el = document.getElementById('feed-date')
  if (el) el.value = new Date().toISOString().split('T')[0]
}

async function saveFeeding() {
  const hiveId = document.getElementById('feed-hive').value
  const date = document.getElementById('feed-date').value
  const syrupType = document.getElementById('feed-type').value
  const amount = document.getElementById('feed-amount').value
  const pollenPatty = document.getElementById('pollen-patty').checked
  const notes = document.getElementById('feed-notes').value.trim()

  if (!hiveId || !date || !amount) return showToast('Заполните улей, дату и количество (Please fill in hive, date and amount)', 'error')

  const record = {
    hive_id: hiveId,
    feeding_date: date,
    syrup_type: syrupType,
    amount_liters: parseFloat(amount),
    pollen_patty: pollenPatty,
    notes: notes || null,
  }

  if (!navigator.onLine) {
    queueOffline('feeding', record)
    showToast('Сохранено офлайн — синхронизация при подключении (Saved offline)', 'success')
    showScreen('screen-dashboard')
    return
  }

  const { error } = await db.from('feedings').insert([record])
  if (error) return showToast('Не удалось сохранить кормление (Could not save feeding)', 'error')

  showToast('Кормление записано! 🍯 (Feeding recorded!)', 'success')
  document.getElementById('feed-amount').value = ''
  document.getElementById('feed-notes').value = ''
  document.getElementById('pollen-patty').checked = false
  showScreen('screen-dashboard')
}

// ── Photo ─────────────────────────────────────────────────────────────────────
function handlePhotoSelect(input) {
  const file = input.files[0]
  if (!file) return
  state.wizard.selectedPhoto = file
  const reader = new FileReader()
  reader.onload = e => {
    const preview = document.getElementById('photo-preview')
    preview.src = e.target.result
    preview.style.display = 'block'
  }
  reader.readAsDataURL(file)
}

async function uploadPhoto(file) {
  const ext = file.name.split('.').pop()
  const path = `${state.user.id}/${Date.now()}.${ext}`
  const { error } = await db.storage.from('hive-photos').upload(path, file, { upsert: true })
  if (error) { console.error('Upload error:', error); return null }
  const { data } = db.storage.from('hive-photos').getPublicUrl(path)
  return data.publicUrl
}

async function loadGallery() {
  const el = document.getElementById('gallery-grid')
  el.innerHTML = '<div class="spinner"></div>'

  const { data, error } = await db.from('inspections')
    .select('photo_url, inspection_date, hives(name)')
    .not('photo_url', 'is', null)
    .order('inspection_date', { ascending: false })

  if (error || !data?.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📸</div><p>Фото нет.<br>Добавьте фото во время следующего осмотра! (No photos yet. Add during next inspection!)</p></div>'
    return
  }

  el.innerHTML = data.map(item => `
    <div class="photo-thumb">
      <img src="${item.photo_url}" alt="Hive photo from ${item.inspection_date}" loading="lazy" onclick="window.open('${item.photo_url}','_blank')" />
      <div class="photo-date">${item.hives?.name} · ${formatDate(item.inspection_date)}</div>
    </div>
  `).join('')
}

// ── Voice Input ───────────────────────────────────────────────────────────────
let recognition = null

function toggleVoice() {
  const btn = document.getElementById('voice-btn')
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    showToast('Голосовой ввод не поддерживается этим браузером (Voice input not supported)', 'error')
    return
  }

  if (recognition) {
    recognition.stop()
    recognition = null
    btn.textContent = '🎙️'
    btn.classList.remove('recording')
    return
  }

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition = new SR()
  recognition.continuous = true
  recognition.interimResults = false
  recognition.lang = 'en-GB'

  recognition.onresult = e => {
    const transcript = e.results[e.results.length - 1][0].transcript
    const notes = document.getElementById('inspection-notes')
    notes.value += (notes.value ? ' ' : '') + transcript
  }

  recognition.onend = () => {
    btn.textContent = '🎙️'
    btn.classList.remove('recording')
    recognition = null
  }

  recognition.onerror = () => {
    showToast('Голосовой ввод остановлен (Voice input stopped)', 'error')
    btn.textContent = '🎙️'
    btn.classList.remove('recording')
    recognition = null
  }

  recognition.start()
  btn.textContent = '⏹️'
  btn.classList.add('recording')
}

// ── Offline Support ───────────────────────────────────────────────────────────
function queueOffline(type, data) {
  state.offlineQueue.push({ type, data, timestamp: Date.now() })
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(state.offlineQueue))
}

async function syncOfflineQueue() {
  if (!navigator.onLine || !state.user || !state.offlineQueue.length) return
  const queue = [...state.offlineQueue]
  state.offlineQueue = []
  localStorage.setItem(OFFLINE_KEY, '[]')

  for (const item of queue) {
    const table = item.type === 'inspection' ? 'inspections' : 'feedings'
    await db.from(table).insert([item.data])
  }

  if (queue.length) {
    showToast(`${queue.length} записей синхронизировано ✅ (records synced)`, 'success')
    loadDashboard()
  }
}

function cacheData(key, data) {
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  cache[key] = data
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open')
  document.getElementById(id).querySelector('input')?.focus()
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open')
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open')
  }
})

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimeout = null
function showToast(msg, type = '') {
  const toast = document.getElementById('toast')
  toast.textContent = msg
  toast.className = `toast ${type} show`
  clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  const now = new Date()
  const days = Math.floor((now - date) / 86400000)
  if (days === 0) return 'Сегодня (Today)'
  if (days === 1) return 'Вчера (Yesterday)'
  if (days < 7) return `${days} дн. назад (days ago)`
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

// Keyboard: Enter key in modals
document.getElementById('new-hive-name')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') addHive()
})
document.getElementById('signin-password')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') signIn()
})
document.getElementById('signup-password')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') signUp()
})
