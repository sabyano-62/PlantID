(function () {
  'use strict';

  // ─── UTILITY ────────────────────────────────────────────────
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  function hashSHA256(str) {
    const encoder = new TextEncoder();
    return crypto.subtle.digest('SHA-256', encoder.encode(str)).then(buf => {
      const bytes = Array.from(new Uint8Array(buf));
      return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }

  function storageGet(k, def = null) {
    try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; }
    catch { return def; }
  }
  function storageSet(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

  function showToast(msg) {
    const old = $('.toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.classList.add('fade-out'); setTimeout(() => el.remove(), 300); }, 2200);
  }

  // ─── PLANT DATABASE (mock) ─────────────────────────────────
  const PLANT_DB = [
    {
      id: 'monstera',
      name: 'Monstera Deliciosa',
      scientific: 'Monstera deliciosa',
      description: 'Native to tropical forests of southern Mexico and Panama, the Monstera is known for its iconic split leaves. It thrives in bright indirect light and is one of the most popular houseplants worldwide.',
      healthy: true,
      conditions: null,
      care: [
        'Water when top 2 inches of soil feel dry',
        'Bright indirect light, avoid direct sun',
        'Wipe leaves monthly to keep pores clear',
        'Fertilize monthly during growing season',
        'Repot every 2 years or when root-bound'
      ],
      treatment: null
    },
    {
      id: 'monstera-disease',
      name: 'Monstera Deliciosa',
      scientific: 'Monstera deliciosa',
      description: 'A popular tropical houseplant known for its distinctive split leaves and easy-care nature.',
      healthy: false,
      conditions: {
        type: 'disease',
        label: 'Leaf Spot Disease',
        detail: 'Brown or black spots with yellow halos on leaves indicate fungal or bacterial leaf spot. This is often caused by overwatering, poor air circulation, or water sitting on leaves.'
      },
      care: [
        'Allow soil to dry between waterings',
        'Improve air circulation around the plant',
        'Remove affected leaves with sterile scissors',
        'Keep water off leaves when watering',
        'Provide bright, indirect light'
      ],
      treatment: [
        'Isolate the plant to prevent spread',
        'Remove severely affected leaves',
        'Apply neem oil spray weekly',
        'Reduce watering frequency',
        'If severe, use a copper-based fungicide'
      ]
    },
    {
      id: 'monstera-pest',
      name: 'Monstera Deliciosa',
      scientific: 'Monstera deliciosa',
      description: 'A popular tropical houseplant known for its distinctive split leaves.',
      healthy: false,
      conditions: {
        type: 'pest',
        label: 'Spider Mites',
        detail: 'Tiny pests that create fine webbing on leaves and stems. Signs include stippled or yellowing leaves, tiny white or red dots, and fine silk threads on the undersides of leaves.'
      },
      care: [
        'Mist regularly to increase humidity',
        'Check leaf undersides weekly',
        'Keep plant well-watered but not soggy',
        'Quarantine new plants before introducing'
      ],
      treatment: [
        'Rinse leaves thoroughly with lukewarm water',
        'Apply insecticidal soap weekly for 3 weeks',
        'Use neem oil spray on all leaf surfaces',
        'Increase humidity around the plant',
        'For severe cases, use miticide as directed'
      ]
    },
    {
      id: 'pothos',
      name: 'Pothos (Devil\'s Ivy)',
      scientific: 'Epipremnum aureum',
      description: 'One of the easiest houseplants to grow, Pothos features heart-shaped leaves with beautiful variegation. It is an excellent air-purifying plant that thrives in various conditions.',
      healthy: true,
      conditions: null,
      care: [
        'Water when soil is dry to the touch',
        'Tolerates low to bright indirect light',
        'Trim trailing vines to encourage bushiness',
        'Propagate cuttings in water easily',
        'Dust leaves regularly for optimal growth'
      ],
      treatment: null
    },
    {
      id: 'pothos-disease',
      name: 'Pothos (Devil\'s Ivy)',
      scientific: 'Epipremnum aureum',
      description: 'A hardy, popular trailing houseplant with variegated heart-shaped leaves.',
      healthy: false,
      conditions: {
        type: 'disease',
        label: 'Root Rot',
        detail: 'Yellowing leaves, mushy stems, and a foul smell from the soil indicate root rot. This is caused by overwatering and poor drainage. Infected roots turn brown or black and become soft.'
      },
      care: [
        'Water only when top inch of soil is dry',
        'Ensure pot has drainage holes',
        'Use well-draining potting mix',
        'Empty saucer after watering'
      ],
      treatment: [
        'Remove plant from pot and trim rotten roots',
        'Wash remaining healthy roots gently',
        'Repot in fresh, sterile potting mix',
        'Reduce watering frequency significantly',
        'Apply hydrogen peroxide solution (1:3 with water) to roots'
      ]
    },
    {
      id: 'snake',
      name: 'Snake Plant',
      scientific: 'Sansevieria trifasciata',
      description: 'Also known as Mother-in-Law\'s Tongue, this succulent-like plant is virtually indestructible. It features tall, upright leaves with striking yellow edges and is excellent for beginners.',
      healthy: true,
      conditions: null,
      care: [
        'Water sparingly every 2-3 weeks',
        'Thrives in low to bright indirect light',
        'Tolerates neglect better than over-care',
        'Use well-draining cactus mix',
        'Keep away from cold drafts'
      ],
      treatment: null
    },
    {
      id: 'fiddle',
      name: 'Fiddle Leaf Fig',
      scientific: 'Ficus lyrata',
      description: 'A dramatic statement plant with large, violin-shaped leaves. Native to western Africa, it has become a staple in modern interiors. Can grow 6-10 feet tall indoors.',
      healthy: true,
      conditions: null,
      care: [
        'Water when top 50% of soil is dry',
        'Bright, filtered light is essential',
        'Rotate weekly for even growth',
        'Wipe leaves with a damp cloth monthly',
        'Avoid drafts and sudden temperature changes'
      ],
      treatment: null
    },
    {
      id: 'fiddle-disease',
      name: 'Fiddle Leaf Fig',
      scientific: 'Ficus lyrata',
      description: 'A popular large indoor tree with dramatic violin-shaped leaves.',
      healthy: false,
      conditions: {
        type: 'disease',
        label: 'Brown Leaf Edges',
        detail: 'Crispy brown edges on leaves are typically caused by inconsistent watering, low humidity, or fluoride/chlorine in tap water. The plant is trying to conserve moisture.'
      },
      care: [
        'Water consistently when top 50% of soil dries',
        'Increase humidity with a pebble tray or humidifier',
        'Use filtered or distilled water',
        'Keep away from AC vents and heaters'
      ],
      treatment: [
        'Trim brown edges with clean scissors',
        'Switch to filtered or distilled water',
        'Mist leaves daily or use a humidifier',
        'Check soil moisture before each watering',
        'Fertilize lightly during growing season'
      ]
    }
  ];

  function analyzePlantMock() {
    const idx = Math.floor(Math.random() * PLANT_DB.length);
    const plant = PLANT_DB[idx];
    return { ...plant, confidence: 88 + Math.floor(Math.random() * 11) };
  }

  // ─── STATE ──────────────────────────────────────────────────
  const state = {
    pin: storageGet('pin_hash', null),
    attempts: 0,
    lockedUntil: 0,
    currentPin: '',
    history: storageGet('scan_history', []),

    apiKey: storageGet('api_key', ''),

    // change pin flow
    changePinPhase: 'current', // current | new | confirm
    changePinCurrent: '',
    changePinNew: '',
    changePinConfirm: '',
    changePinError: '',
  };

  // ─── DOM REFS ────────────────────────────────────────────────
  const DOM = {};

  function cacheRefs() {
    DOM.screenPin = $('#screen-pin');
    DOM.screenApp = $('#screen-app');
    DOM.pinDots = $('#pin-dots');
    DOM.pinError = $('#pin-error');
    DOM.pinKeypad = $('#pin-keypad');
    DOM.btnForgot = $('#btn-forgot-pin');

    DOM.pages = {
      home: $('#page-home'),
      camera: $('#page-camera'),
      results: $('#page-results'),
      settings: $('#page-settings'),
    };

    DOM.navItems = $$('.nav-item');
    DOM.bottomNav = $('#bottom-nav');

    DOM.btnCapture = $('#btn-capture');
    DOM.btnUpload = $('#btn-upload');
    DOM.btnSettingsNav = $('#btn-settings-nav');
    DOM.historyList = $('#history-list');
    DOM.btnSelectPlants = $('#btn-select-plants');
    DOM.selectionBar = $('#selection-bar');
    DOM.selectionCount = $('#selection-count');
    DOM.btnCancelSelect = $('#btn-cancel-select');
    DOM.btnDeleteSelected = $('#btn-delete-selected');

    DOM.cameraFeed = $('#camera-feed');
    DOM.cameraView = $('#camera-view');
    DOM.cameraPreview = $('#camera-preview');
    DOM.previewCanvas = $('#preview-canvas');
    DOM.btnCapturePhoto = $('#btn-capture-photo');
    DOM.btnRetake = $('#btn-retake');
    DOM.btnAnalyze = $('#btn-analyze');
    DOM.btnCameraClose = $('#btn-camera-close');
    DOM.btnFlash = $('#btn-flash');
    DOM.btnSwitch = $('#btn-switch');
    DOM.fileInput = $('#file-input');
    DOM.cameraControls = document.querySelector('.camera-controls');

    DOM.resultsContent = $('#results-content');
    DOM.resultsLoading = $('#results-loading');
    DOM.resultsData = $('#results-data');
    DOM.resultImage = $('#result-image');
    DOM.resultName = $('#result-name');
    DOM.resultScientific = $('#result-scientific');
    DOM.resultConfidence = $('#result-confidence');
    DOM.resultStatusSection = $('#result-status-section');
    DOM.statusBadge = $('#status-badge');
    DOM.statusIcon = $('#status-icon');
    DOM.statusText = $('#status-text');
    DOM.resultDescription = $('#result-description');
    DOM.diseaseSection = $('#disease-section');
    DOM.diseaseDescription = $('#disease-description');
    DOM.careTips = $('#care-tips');
    DOM.treatmentSection = $('#treatment-section');
    DOM.treatmentList = $('#treatment-list');
    DOM.btnSaveResult = $('#btn-save-result');
    DOM.btnShareResult = $('#btn-share-result');
    DOM.btnResultsBack = $('#btn-results-back');
    DOM.btnAnalyzePending = $('#btn-analyze-pending');

    DOM.btnSettingsBack = $('#btn-settings-back');
    DOM.btnChangePin = $('#btn-change-pin');
    DOM.btnClearData = $('#btn-clear-data');
    DOM.btnThemeToggle = $('#btn-theme-toggle');

    DOM.modalChangePin = $('#modal-change-pin');
    DOM.changeDotsCurrent = $('#change-pin-dots-current');
    DOM.changeDotsNew = $('#change-pin-dots-new');
    DOM.changeDotsConfirm = $('#change-pin-dots-confirm');
    DOM.changePinError = $('#change-pin-error');
    DOM.changePinNewStep = $('#change-pin-new-step');
    DOM.changePinConfirmStep = $('#change-pin-confirm-step');
    DOM.btnChangePinCancel = $('#btn-change-pin-cancel');

    DOM.apiKeyInput = $('#api-key-input');
    DOM.btnApiKeyToggle = $('#btn-api-key-toggle');

    DOM.steps = {
      s1: $('#step-1'),
      s2: $('#step-2'),
      s3: $('#step-3'),
    };
  }

  // ─── PIN SCREEN ────────────────────────────────────────────
  function renderPinDots(container, value) {
    const dots = container.querySelectorAll('.dot');
    dots.forEach((d, i) => {
      d.classList.remove('filled', 'error');
      if (i < value.length) d.classList.add('filled');
    });
  }

  function showPinError(msg) {
    DOM.pinError.textContent = msg;
    DOM.pinDots.querySelectorAll('.dot').forEach(d => d.classList.add('error'));
    setTimeout(() => {
      DOM.pinDots.querySelectorAll('.dot').forEach(d => d.classList.remove('error'));
    }, 500);
  }

  async function handlePinKey(val) {
    if (val === 'back') {
      state.currentPin = state.currentPin.slice(0, -1);
      renderPinDots(DOM.pinDots, state.currentPin);
      DOM.pinError.textContent = '';
      return;
    }

    if (state.currentPin.length >= 4) return;

    state.currentPin += val;
    renderPinDots(DOM.pinDots, state.currentPin);

    if (state.currentPin.length === 4) {
      await verifyPin();
    }
  }

  async function verifyPin() {
    const entered = state.currentPin;
    state.currentPin = '';

    if (!state.pin) {
      await setNewPin(entered);
      return;
    }

    const now = Date.now();
    if (state.lockedUntil > now) {
      const wait = Math.ceil((state.lockedUntil - now) / 1000);
      showPinError(`Locked. Wait ${wait}s`);
      renderPinDots(DOM.pinDots, '');
      return;
    }

    const hash = await hashSHA256(entered);
    if (hash === state.pin) {
      state.attempts = 0;
      storageSet('pin_attempts', 0);
      unlockApp();
    } else {
      state.attempts++;
      storageSet('pin_attempts', state.attempts);
      if (state.attempts >= 5) {
        state.lockedUntil = now + 30000;
        showPinError('Too many attempts. Wait 30s');
        setTimeout(() => {
          state.lockedUntil = 0;
          renderPinDots(DOM.pinDots, '');
          DOM.pinError.textContent = '';
        }, 30000);
      } else {
        showPinError(`Incorrect PIN (${state.attempts}/5)`);
      }
      renderPinDots(DOM.pinDots, '');
    }
  }

  async function setNewPin(pin) {
    state.pin = await hashSHA256(pin);
    storageSet('pin_hash', state.pin);
    unlockApp();
  }

  function unlockApp() {
    DOM.screenPin.classList.remove('active');
    DOM.screenApp.classList.add('active');
    state.currentPin = '';
    renderPinDots(DOM.pinDots, '');
    renderHistory();
  }

  function lockApp() {
    DOM.screenApp.classList.remove('active');
    DOM.screenPin.classList.add('active');
    renderPinDots(DOM.pinDots, '');
    DOM.pinError.textContent = '';
    state.currentPin = '';
    stopCamera();
  }

  async function resetPin() {
    if (!confirm('Reset PIN to default (1234)? All data will be preserved.')) return;
    state.pin = await hashSHA256('1234');
    storageSet('pin_hash', state.pin);
    showToast('PIN reset to 1234');
    renderPinDots(DOM.pinDots, '');
    DOM.pinError.textContent = '';
    state.currentPin = '';
  }

  // ─── NAVIGATION ────────────────────────────────────────────
  let currentPage = 'home';
  let lastResult = null;

  function navigateTo(page) {
    if (page === currentPage) { console.log('[navigateTo] SKIP - already on', page); return; }
    if (page !== 'camera') stopCamera();

    if (page !== 'home') exitSelectionMode();

    Object.values(DOM.pages).forEach(p => p.classList.remove('active'));
    DOM.pages[page].classList.add('active');
    DOM.pages[page].classList.remove('page-enter');
    void DOM.pages[page].offsetWidth;
    DOM.pages[page].classList.add('page-enter');

    DOM.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Hide bottom nav on camera and results pages
    DOM.bottomNav.style.display = (page === 'camera' || page === 'results') ? 'none' : 'flex';

    currentPage = page;
  }

  // ─── HISTORY ────────────────────────────────────────────────
  let pendingHistoryId = null;

  function generateThumbnail(dataURL, maxDim = 200) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h && w > maxDim) { h *= maxDim / w; w = maxDim; }
        else if (h > maxDim) { w *= maxDim / h; h = maxDim; }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = () => resolve(dataURL);
      img.src = dataURL;
    });
  }

  let selectionMode = false;
  let selectedSet = new Set();

  function exitSelectionMode() {
    selectionMode = false;
    selectedSet.clear();
    DOM.selectionBar.classList.add('hidden');
    DOM.btnSelectPlants.textContent = 'Select';
    renderHistory();
  }

  function renderHistory() {
    const list = DOM.historyList;
    const empty = list.querySelector('.history-empty');

    if (state.history.length === 0) {
      if (empty) return;
      list.innerHTML = `
        <div class="history-empty">
          <svg viewBox="0 0 24 24" width="48" height="48"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="currentColor"/></svg>
          <p>Your plants will appear here.<br>Take a photo to get started!</p>
        </div>`;
      return;
    }

    list.innerHTML = state.history.map((item, idx) => {
      const isPending = !item.analyzed;
      const statusClass = isPending ? 'status-pending' : item.healthy ? 'status-healthy' : item.conditionType === 'pest' ? 'status-pest' : 'status-disease';
      const statusText = isPending ? 'Pending...' : item.healthy ? 'Healthy' : item.conditionLabel || 'Issue';
      const isSelected = selectedSet.has(item.id);
      const checkbox = selectionMode ? `<div class="history-checkbox"></div>` : '';
      return `
      <div class="history-item ${isSelected ? 'selected' : ''}" data-idx="${idx}" data-id="${item.id}">
        ${checkbox}
        <img class="history-item-thumb" src="${item.thumb || item.image}" alt="${item.name}">
        <div class="history-item-info">
          <div class="history-item-name">${item.name}</div>
          <div class="history-item-date">${item.date}</div>
        </div>
        <span class="history-item-status ${statusClass}">${statusText}</span>
      </div>`;
    }).join('');

    list.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        if (selectionMode) {
          if (selectedSet.has(id)) selectedSet.delete(id);
          else selectedSet.add(id);
          DOM.selectionCount.textContent = `${selectedSet.size} selected`;
          DOM.btnDeleteSelected.disabled = selectedSet.size === 0;
          renderHistory();
          return;
        }
        const idx = parseInt(el.dataset.idx);
        const item = state.history[idx];
        if (!item.analyzed) {
          capturedImageData = item.image;
          navigateTo('camera');
          stopCamera();
          DOM.cameraView.classList.add('hidden');
          DOM.cameraControls.classList.add('hidden');
          DOM.cameraPreview.classList.remove('hidden');
          const img = new Image();
          img.onload = () => {
            const canvas = DOM.previewCanvas;
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
          };
          img.src = item.image;
          pendingHistoryId = item.id;
        } else {
          showResults(item, item.image);
        }
      });
    });
  }

  async function savePendingPhoto(imageData) {
    const thumb = await generateThumbnail(imageData);
    const item = {
      id: Date.now(),
      name: 'Unknown plant',
      scientific: '',
      description: 'Photo saved. Tap Analyze to identify.',
      healthy: true,
      analyzed: false,
      conditionType: null,
      conditionLabel: null,
      conditionDetail: null,
      care: [],
      treatment: null,
      image: imageData,
      thumb,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    state.history.unshift(item);
    if (state.history.length > 30) state.history.pop();
    storageSet('scan_history', state.history);
    pendingHistoryId = item.id;
    renderHistory();
  }

  function updateHistoryEntry(id, result, imageData) {
    if (!id) return;
    const idx = state.history.findIndex(h => h.id === id);
    state.history[idx] = {
      ...state.history[idx],
      name: result.name,
      scientific: result.scientific,
      description: result.description,
      healthy: result.healthy,
      analyzed: true,
      conditionType: result.conditions?.type || null,
      conditionLabel: result.conditions?.label || null,
      conditionDetail: result.conditions?.detail || null,
      care: result.care,
      treatment: result.treatment,
      image: imageData || state.history[idx].image,
    };
    storageSet('scan_history', state.history);
    pendingHistoryId = null;
    renderHistory();
  }

  function showResultFromHistory(item) {
    showResults(item, item.image);
  }

  // ─── CAMERA ──────────────────────────────────────────────────
  let cameraStream = null;
  let facingMode = 'environment';
  let flashOn = false;
  let capturedImageData = null;

  async function startCamera(facing = 'environment') {
    try {
      if (cameraStream) stopCamera();
      facingMode = facing;

      const constraints = {
        video: {
          facingMode: facingMode,
        },
        audio: false,
      };

      cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      DOM.cameraFeed.srcObject = cameraStream;
      await DOM.cameraFeed.play();

      DOM.cameraPreview.classList.add('hidden');
      DOM.cameraControls.classList.remove('hidden');
      DOM.cameraView.classList.remove('hidden');
      DOM.cameraFeed.classList.remove('hidden');

      const track = cameraStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        DOM.btnFlash.classList.remove('hidden');
      } else {
        DOM.btnFlash.classList.add('hidden');
      }

      flashOn = false;
      DOM.cameraView.classList.remove('flash-on');
    } catch (err) {
      console.error('Camera error:', err);
      showToast('Could not access camera. Check permissions.');
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    DOM.cameraFeed.srcObject = null;
  }

  function resetPreview() {
    DOM.cameraPreview.classList.add('hidden');
    capturedImageData = null;
  }

  function capturePhoto() {
    if (!cameraStream) return;

    const video = DOM.cameraFeed;
    const canvas = DOM.previewCanvas;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    capturedImageData = canvas.toDataURL('image/jpeg', 0.9);

    savePendingPhoto(capturedImageData);

    DOM.cameraView.classList.add('hidden');
    DOM.cameraControls.classList.add('hidden');
    DOM.cameraPreview.classList.remove('hidden');
  }

  function retakePhoto() {
    resetPreview();
    DOM.cameraControls.classList.remove('hidden');
    DOM.cameraView.classList.remove('hidden');
  }

  async function toggleFlash() {
    if (!cameraStream) return;
    const track = cameraStream.getVideoTracks()[0];
    try {
      flashOn = !flashOn;
      await track.applyConstraints({ advanced: [{ torch: flashOn }] });
      DOM.cameraView.classList.toggle('flash-on', flashOn);
    } catch {
      showToast('Flash not available');
      flashOn = false;
    }
  }

  function switchCamera() {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(newFacing);
  }

  // ─── FILE UPLOAD ────────────────────────────────────────────
  function triggerUpload() {
    DOM.fileInput.click();
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (ev) {
      capturedImageData = ev.target.result;
      navigateTo('camera');
      stopCamera();

      DOM.cameraView.classList.add('hidden');
      DOM.cameraControls.classList.add('hidden');
      DOM.cameraPreview.classList.remove('hidden');

      const img = new Image();
      img.onload = function () {
        const canvas = DOM.previewCanvas;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        savePendingPhoto(capturedImageData);
      };
      img.src = capturedImageData;
    };
    reader.readAsDataURL(file);
    DOM.fileInput.value = '';
  }

  // ─── RESULTS ─────────────────────────────────────────────────
  function showLoading() {
    console.log('[showLoading] currentPage:', currentPage);
    navigateTo('results');
    console.log('[showLoading] after navigate, currentPage:', currentPage);
    DOM.resultsData.classList.add('hidden');
    DOM.resultsLoading.classList.remove('hidden');
    DOM.steps.s1.classList.remove('active', 'done');
    DOM.steps.s2.classList.remove('active', 'done');
    DOM.steps.s3.classList.remove('active', 'done');
    DOM.steps.s1.textContent = state.apiKey ? 'Connecting to Plant.id...' : 'Detecting plant...';
    DOM.steps.s2.textContent = state.apiKey ? 'Analyzing image...' : 'Checking for diseases...';
    DOM.steps.s3.textContent = state.apiKey ? 'Identifying species & health...' : 'Generating recommendations...';

    setTimeout(() => DOM.steps.s1.classList.add('active'), 200);
  }

  function completeAnalysis(result, imageData) {
    lastResult = { result, imageData };

    DOM.steps.s1.classList.remove('active');
    DOM.steps.s1.classList.add('done');
    DOM.steps.s2.classList.add('active');

    setTimeout(() => {
      DOM.steps.s2.classList.remove('active');
      DOM.steps.s2.classList.add('done');
      DOM.steps.s3.classList.add('active');
    }, 500);

    setTimeout(() => {
      DOM.steps.s3.classList.remove('active');
      DOM.steps.s3.classList.add('done');
      renderResults(result, imageData);
      DOM.resultsLoading.classList.add('hidden');
      DOM.resultsData.classList.remove('hidden');
      updateHistoryEntry(pendingHistoryId, result, imageData);
    }, 1200);
  }

  function renderResults(result, imageData) {
    DOM.resultImage.src = imageData;
    DOM.resultName.textContent = result.name;
    DOM.resultScientific.textContent = result.scientific;

    const conf = (result.confidence || (85 + Math.floor(Math.random() * 14))) + '% match';
    DOM.resultConfidence.textContent = conf;

    if (result.healthy) {
      DOM.resultStatusSection.className = 'result-section result-status';
      DOM.statusBadge.className = 'status-badge healthy';
      DOM.statusIcon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>';
      DOM.statusText.textContent = 'Healthy';
      DOM.diseaseSection.classList.add('hidden');
      DOM.treatmentSection.classList.add('hidden');
    } else {
      const condType = result.conditions?.type || result.conditionType;
      const condLabel = result.conditions?.label || result.conditionLabel;
      const condDetail = result.conditions?.detail || result.conditionDetail;
      const isPest = condType === 'pest';
      DOM.resultStatusSection.className = `result-section result-status ${isPest ? 'warning' : 'danger'}`;
      DOM.statusBadge.className = `status-badge ${isPest ? 'pest' : 'disease'}`;
      DOM.statusIcon.innerHTML = isPest
        ? '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" fill="currentColor"/></svg>';
      DOM.statusText.textContent = condLabel || 'Issue detected';
      DOM.diseaseSection.classList.remove('hidden');
      DOM.diseaseDescription.textContent = condDetail || 'The plant shows signs of a condition or disease.';

      if (result.treatment && result.treatment.length > 0) {
        DOM.treatmentSection.classList.remove('hidden');
        DOM.treatmentList.innerHTML = result.treatment.map(t => `<li>${t}</li>`).join('');
      } else {
        DOM.treatmentSection.classList.add('hidden');
      }
    }

    DOM.resultDescription.textContent = result.description;
    DOM.careTips.innerHTML = result.care.map(t => `<li>${t}</li>`).join('');
  }

  function showResults(item, imageData) {
    navigateTo('results');
    DOM.resultsLoading.classList.add('hidden');
    DOM.resultsData.classList.remove('hidden');
    DOM.btnAnalyzePending.classList.add('hidden');
    DOM.btnSaveResult.classList.remove('hidden');
    DOM.btnShareResult.classList.remove('hidden');

    if (item.analyzed) {
      renderResults(item, imageData);
    } else {
      DOM.resultImage.src = imageData;
      DOM.resultName.textContent = 'Unknown plant';
      DOM.resultScientific.textContent = '';
      DOM.resultConfidence.textContent = 'Pending';
      DOM.resultStatusSection.className = 'result-section result-status';
      DOM.statusBadge.className = 'status-badge';
      DOM.statusIcon.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>';
      DOM.statusText.textContent = 'Awaiting Analysis';
      DOM.diseaseSection.classList.add('hidden');
      DOM.treatmentSection.classList.add('hidden');
      DOM.resultDescription.textContent = item.description || 'Tap Analyze to identify this plant.';
      DOM.careTips.innerHTML = '';
      DOM.btnSaveResult.classList.add('hidden');
      DOM.btnShareResult.classList.add('hidden');
      DOM.btnAnalyzePending.classList.remove('hidden');
    }
  }

  function fallbackCare(plantName) {
    return [
      'Water when the top inch of soil feels dry',
      'Provide bright, indirect light',
      'Maintain moderate humidity around the plant',
      'Fertilize lightly during the growing season',
      'Check leaves regularly for pests or disease'
    ];
  }

  function fallbackTreatment(conditionName) {
    return [
      'Isolate the affected plant from others',
      'Remove and dispose of severely affected leaves',
      'Apply neem oil or insecticidal soap as needed',
      'Improve air circulation around the plant',
      'Consult a local plant specialist if condition persists'
    ];
  }

  async function analyzeWithPlantID(imageData) {
    const apiKey = state.apiKey.trim();
    if (!apiKey) return null;

    // Convert data URL to bare base64 (strip "data:image/...;base64," prefix)
    const base64 = imageData.split(',')[1];

    const res = await fetch(
      'https://plant.id/api/v3/identification?details=common_names,description,url',
      {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [base64],
          similar_images: true,
          health: 'all',
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${errText || res.statusText}`);
    }

    const data = await res.json();
    const r = data.result;

    if (!r || !r.classification || !r.classification.suggestions.length) {
      throw new Error('No plant identified');
    }

    const top = r.classification.suggestions[0];
    const plantName = top.name;
    const commonName = top.details?.common_names?.[0] || plantName;
    const description = top.details?.description?.value || `A plant identified as ${plantName}.`;
    const confidence = Math.round(top.probability * 100);

    // Health assessment — v3 returns diseases at result.disease.suggestions
    const diseaseSuggestions = r.disease?.suggestions || [];
    const probHealthy = r.health_assessment?.is_healthy?.probability;

    let conditions = null;
    let care = fallbackCare(plantName);
    let treatment = null;

    if (diseaseSuggestions.length > 0) {
      const disease = diseaseSuggestions[0];
      const diseaseName = disease.name;
      const diseaseProb = Math.round(disease.probability * 100);

      // Determine threshold: if health data says healthy, require higher confidence
      let threshold = 0.35;
      if (probHealthy !== undefined) {
        threshold = probHealthy > 0.5 ? 0.7 : 0.3;
      }

      if (disease.probability >= threshold) {
        const isPest = /mite|aphid|mealybug|scale|thrip|whitefly|caterpillar|slug|snail|borer|pest|insect/i.test(diseaseName);

        conditions = {
          type: isPest ? 'pest' : 'disease',
          label: `${diseaseName} (${diseaseProb}%)`,
          detail: `The plant shows signs of ${diseaseName} with ${diseaseProb}% confidence. ${isPest ? 'Pests may be affecting the plant\'s health.' : 'This condition may affect the plant\'s growth and appearance.'}`,
        };

        treatment = fallbackTreatment(diseaseName);
      }
    }

    return {
      name: commonName,
      scientific: plantName,
      description,
      healthy: !conditions,
      conditions,
      care,
      treatment,
      confidence,
    };
  }

  async function analyzeImage(imageData) {
    console.log('[analyzeImage] called, data length:', imageData?.length);
    showLoading();

    let result = null;

    if (state.apiKey && state.apiKey.trim()) {
      try {
        result = await analyzeWithPlantID(imageData);
      } catch (err) {
        console.warn('Plant.id API failed:', err.message);
        showToast(`API error: ${err.message}. Using mock.`);
      }
    }

    if (!result) {
      result = analyzePlantMock();
    }

    completeAnalysis(result, imageData);
  }

  // ─── CHANGE PIN ────────────────────────────────────────────
  function openChangePin() {
    state.changePinPhase = 'current';
    state.changePinCurrent = '';
    state.changePinNew = '';
    state.changePinConfirm = '';
    state.changePinError = '';

    DOM.modalChangePin.classList.remove('hidden');
    DOM.changePinNewStep.classList.add('hidden');
    DOM.changePinConfirmStep.classList.add('hidden');
    DOM.changeDotsCurrent.parentElement.classList.remove('hidden');
    DOM.changePinError.textContent = '';

    renderPinDots(DOM.changeDotsCurrent, '');
    renderPinDots(DOM.changeDotsNew, '');
    renderPinDots(DOM.changeDotsConfirm, '');
  }

  function closeChangePin() {
    DOM.modalChangePin.classList.add('hidden');
  }

  async function handleChangePinKey(key) {
    if (key === 'back') {
      if (state.changePinPhase === 'current') {
        if (state.changePinCurrent.length > 0) {
          state.changePinCurrent = state.changePinCurrent.slice(0, -1);
          renderPinDots(DOM.changeDotsCurrent, state.changePinCurrent);
        }
      } else if (state.changePinPhase === 'new') {
        if (state.changePinNew.length > 0) {
          state.changePinNew = state.changePinNew.slice(0, -1);
          renderPinDots(DOM.changeDotsNew, state.changePinNew);
        }
      } else if (state.changePinPhase === 'confirm') {
        if (state.changePinConfirm.length > 0) {
          state.changePinConfirm = state.changePinConfirm.slice(0, -1);
          renderPinDots(DOM.changeDotsConfirm, state.changePinConfirm);
        }
      }
      DOM.changePinError.textContent = '';
      return;
    }

    if (state.changePinPhase === 'current') {
      if (state.changePinCurrent.length >= 4) return;
      state.changePinCurrent += key;
      renderPinDots(DOM.changeDotsCurrent, state.changePinCurrent);

      if (state.changePinCurrent.length === 4) {
        const hash = await hashSHA256(state.changePinCurrent);
        if (hash !== state.pin) {
          DOM.changePinError.textContent = 'Current PIN is incorrect';
          state.changePinCurrent = '';
          renderPinDots(DOM.changeDotsCurrent, '');
          return;
        }
        DOM.changePinError.textContent = '';
        state.changePinPhase = 'new';
        DOM.changeDotsCurrent.parentElement.classList.add('hidden');
        DOM.changePinNewStep.classList.remove('hidden');
        renderPinDots(DOM.changeDotsNew, '');
      }
    } else if (state.changePinPhase === 'new') {
      if (state.changePinNew.length >= 4) return;
      state.changePinNew += key;
      renderPinDots(DOM.changeDotsNew, state.changePinNew);

      if (state.changePinNew.length === 4) {
        DOM.changePinError.textContent = '';
        state.changePinPhase = 'confirm';
        DOM.changePinNewStep.classList.add('hidden');
        DOM.changePinConfirmStep.classList.remove('hidden');
        renderPinDots(DOM.changeDotsConfirm, '');
      }
    } else if (state.changePinPhase === 'confirm') {
      if (state.changePinConfirm.length >= 4) return;
      state.changePinConfirm += key;
      renderPinDots(DOM.changeDotsConfirm, state.changePinConfirm);

      if (state.changePinConfirm.length === 4) {
        if (state.changePinNew !== state.changePinConfirm) {
          DOM.changePinError.textContent = 'PINs do not match. Try again.';
          state.changePinPhase = 'new';
          state.changePinNew = '';
          state.changePinConfirm = '';
          DOM.changePinConfirmStep.classList.add('hidden');
          DOM.changePinNewStep.classList.remove('hidden');
          renderPinDots(DOM.changeDotsNew, '');
          renderPinDots(DOM.changeDotsConfirm, '');
          return;
        }
        state.pin = await hashSHA256(state.changePinNew);
        storageSet('pin_hash', state.pin);
        DOM.changePinError.textContent = '';
        showToast('PIN changed successfully');
        closeChangePin();
      }
    }
  }

  // ─── SHARE ──────────────────────────────────────────────────
  function shareResult() {
    if (!lastResult) return;
    const { result, imageData } = lastResult;
    const text = `🌿 PlantID Result: ${result.name}\nStatus: ${result.healthy ? '✅ Healthy' : '⚠️ ' + result.conditions.label}\n\n${result.description}`;

    if (navigator.share) {
      navigator.share({ title: 'PlantID Result', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Result copied to clipboard');
      }).catch(() => {});
    }
  }

  function saveResult() {
    showToast('Result saved to history');
  }

  // ─── CLEAR DATA ────────────────────────────────────────────
  function clearAllData() {
    if (!confirm('Clear all scan history and reset app?')) return;
    state.history = [];
    storageSet('scan_history', []);
    renderHistory();
    showToast('All data cleared');
  }

  // ─── EVENTS ──────────────────────────────────────────────────
  function bindEvents() {
    // PIN keypad
    DOM.pinKeypad.addEventListener('click', (e) => {
      const key = e.target.closest('.key');
      if (!key) return;
      handlePinKey(key.dataset.value);
    });

    DOM.btnForgot.addEventListener('click', resetPin);

    // Navigation
    DOM.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page === 'camera') {
          startCamera();
        }
        navigateTo(page);
      });
    });

    DOM.btnCapture.addEventListener('click', () => {
      startCamera();
      navigateTo('camera');
    });

    DOM.btnUpload.addEventListener('click', triggerUpload);

    DOM.btnSettingsNav.addEventListener('click', () => {
      navigateTo('settings');
    });

    DOM.btnSettingsBack.addEventListener('click', () => {
      navigateTo('home');
    });

    DOM.btnResultsBack.addEventListener('click', () => {
      navigateTo('home');
    });

    // Camera controls
    DOM.btnCapturePhoto.addEventListener('click', capturePhoto);
    DOM.btnRetake.addEventListener('click', retakePhoto);
    DOM.btnAnalyze.addEventListener('click', (e) => {
      console.log('[btnAnalyze] clicked');
      let data = capturedImageData;
      if (!data) {
        try {
          data = DOM.previewCanvas.toDataURL('image/jpeg', 0.9);
          console.log('[btnAnalyze] fallback canvas capture');
        } catch (er) {
          console.warn('[btnAnalyze] canvas fallback failed:', er);
          showToast('Could not capture image. Try again.');
          return;
        }
      }
      if (data) {
        analyzeImage(data);
      } else {
        showToast('No image to analyze. Take a photo first.');
      }
    });
    DOM.btnCameraClose.addEventListener('click', () => {
      stopCamera();
      resetPreview();
      navigateTo('home');
    });
    DOM.btnFlash.addEventListener('click', toggleFlash);
    DOM.btnSwitch.addEventListener('click', switchCamera);

    DOM.fileInput.addEventListener('change', handleFileSelect);

    // Results
    DOM.btnSaveResult.addEventListener('click', saveResult);
    DOM.btnShareResult.addEventListener('click', shareResult);
    DOM.btnAnalyzePending.addEventListener('click', () => {
      console.log('[btnAnalyzePending] clicked');
      navigateTo('camera');
      stopCamera();
      const imgSrc = DOM.resultImage.src;
      DOM.cameraView.classList.add('hidden');
      DOM.cameraControls.classList.add('hidden');
      DOM.cameraPreview.classList.remove('hidden');
      const img = new Image();
      img.onload = () => {
        const canvas = DOM.previewCanvas;
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
      };
      img.src = imgSrc;
      capturedImageData = imgSrc;
      // find matching history entry for this image
      const entry = state.history.find(h => h.image === imgSrc);
      if (entry) pendingHistoryId = entry.id;
    });

    // Settings
    DOM.btnChangePin.addEventListener('click', openChangePin);
    DOM.btnChangePinCancel.addEventListener('click', closeChangePin);

    const changeKeypad = document.querySelector('.small-keypad');
    changeKeypad.addEventListener('click', (e) => {
      const key = e.target.closest('.key');
      if (!key) return;
      handleChangePinKey(key.dataset.value);
    });

    DOM.btnClearData.addEventListener('click', clearAllData);
    DOM.btnThemeToggle.addEventListener('change', (e) => {
      const dark = e.target.checked;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      storageSet('dark_mode', dark);
    });

    // API Key
    DOM.apiKeyInput.addEventListener('input', () => {
      state.apiKey = DOM.apiKeyInput.value.trim();
      storageSet('api_key', state.apiKey);
    });

    DOM.btnApiKeyToggle.addEventListener('click', () => {
      const isPass = DOM.apiKeyInput.type === 'password';
      DOM.apiKeyInput.type = isPass ? 'text' : 'password';
      DOM.btnApiKeyToggle.classList.toggle('visible', !isPass);
    });

    DOM.btnSelectPlants.addEventListener('click', () => {
      if (state.history.length === 0) return;
      if (selectionMode) {
        exitSelectionMode();
      } else {
        selectionMode = true;
        selectedSet.clear();
        DOM.btnSelectPlants.textContent = 'Cancel';
        DOM.selectionBar.classList.remove('hidden');
        DOM.selectionCount.textContent = '0 selected';
        DOM.btnDeleteSelected.disabled = true;
        renderHistory();
      }
    });

    DOM.btnCancelSelect.addEventListener('click', exitSelectionMode);

    DOM.btnDeleteSelected.addEventListener('click', () => {
      if (selectedSet.size === 0) return;
      if (!confirm(`Delete ${selectedSet.size} plant${selectedSet.size > 1 ? 's' : ''}?`)) return;
      state.history = state.history.filter(h => !selectedSet.has(h.id));
      storageSet('scan_history', state.history);
      exitSelectionMode();
      showToast(`Deleted ${selectedSet.size} plant${selectedSet.size > 1 ? 's' : ''}`);
    });
  }

  // ─── INIT ────────────────────────────────────────────────────
  async function init() {
    cacheRefs();
    bindEvents();

    // Load persisted PIN attempts
    state.attempts = storageGet('pin_attempts', 0);

    // Load API key
    const savedKey = storageGet('api_key', '');
    state.apiKey = savedKey;
    if (DOM.apiKeyInput) DOM.apiKeyInput.value = savedKey;

    if (state.pin) {
      DOM.screenPin.classList.add('active');
    } else {
      showToast('Set a 4-digit PIN to secure the app');
      DOM.screenPin.classList.add('active');
    }

    // Load theme
    const savedTheme = storageGet('dark_mode', false);
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (DOM.btnThemeToggle) DOM.btnThemeToggle.checked = true;
    }

    renderHistory();

    // Prevent browser back button from leaving the SPA
    window.addEventListener('popstate', (e) => {
      // Push state back immediately to stay in the app
      if (currentPage !== 'home') {
        navigateTo('home');
        history.pushState(null, '', window.location.href);
      } else {
        history.pushState(null, '', window.location.href);
      }
    });
    history.pushState(null, '', window.location.href);
  }

  document.addEventListener('DOMContentLoaded', init);
})();

// Global fallback for HTML onclick (diagnostic)
window.analyzeBtnClick = function() {
  console.log('[HTML onclick] analyze button clicked');
  alert('Analyze button CLICK DETECTED');
};
