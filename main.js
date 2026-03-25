/* ═══════════════════════════════════════════════════════════
   main.js — Space Datepicker
   Sections:
     1. Starfield Background
     2. Three.js 3-D Planet Models
     3. Datepicker Logic
     4. Tooltip System
═══════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════
   1. STARFIELD BACKGROUND + SHOOTING STARS
═══════════════════════════════════════════════════════════ */
(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  let stars    = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 3500);
    const colors = ['#ffffff', '#aad4ff', '#ffd8aa', '#d4b8ff'];

    for (let i = 0; i < count; i++) {
      stars.push({
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     Math.random() * 1.6 + 0.2,
        a:     Math.random(),
        da:    (Math.random() - 0.5) * 0.006,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function drawBg() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep space radial gradient
    const grad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.9
    );
    grad.addColorStop(0,   '#040c1e');
    grad.addColorStop(0.5, '#020810');
    grad.addColorStop(1,   '#010408');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Twinkling stars
    stars.forEach(s => {
      s.a += s.da;
      if (s.a <= 0 || s.a >= 1) s.da *= -1;

      ctx.save();
      ctx.globalAlpha = Math.max(0.05, s.a);
      ctx.fillStyle   = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur  = s.r > 1.2 ? 4 : 0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(drawBg);
  }

  window.addEventListener('resize', resize);
  resize();
  drawBg();

  // ── Shooting stars ──
  function shootStar() {
    const el = document.createElement('div');
    el.className = 'shoot';
    const startX = Math.random() * window.innerWidth  * 0.7 + 100;
    const startY = Math.random() * window.innerHeight * 0.4;
    el.style.cssText = `left:${startX}px; top:${startY}px;`;
    document.body.appendChild(el);

    el.animate(
      [
        { transform: 'translate(0, 0)',                                                           opacity: 1 },
        { transform: `translate(${100 + Math.random() * 120}px, ${50 + Math.random() * 80}px)`,  opacity: 0 }
      ],
      { duration: 600 + Math.random() * 500, easing: 'ease-in' }
    ).onfinish = () => el.remove();
  }

  setInterval(shootStar, 2500);
})();


/* ═══════════════════════════════════════════════════════════
   2. THREE.JS 3-D PLANET MODELS
═══════════════════════════════════════════════════════════ */
(function () {

  /* ── Shared helpers ── */

  function makeRenderer(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.width, canvas.height);
    renderer.shadowMap.enabled = true;
    return renderer;
  }

  function makeScene() {
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    camera.position.z = 2.6;
    return { scene, camera };
  }

  /* ── Procedural textures ── */

  function makeSunTexture() {
    const size = 512;
    const c    = document.createElement('canvas');
    c.width    = c.height = size;
    const ctx  = c.getContext('2d');

    // Base colour
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0,   '#fff8e0');
    grad.addColorStop(0.2, '#ffcc44');
    grad.addColorStop(0.5, '#ff9900');
    grad.addColorStop(0.8, '#ff5500');
    grad.addColorStop(1,   '#cc2200');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Solar granulation
    for (let i = 0; i < 1200; i++) {
      const x  = Math.random() * size;
      const y  = Math.random() * size;
      const r  = Math.random() * 12 + 2;
      const a  = Math.random() * 0.18;
      const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
      g2.addColorStop(0, `rgba(255,240,180,${a})`);
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sunspots
    for (let i = 0; i < 14; i++) {
      const x  = Math.random() * size * 0.8 + size * 0.1;
      const y  = Math.random() * size * 0.8 + size * 0.1;
      const r  = Math.random() * 14 + 4;
      const sg = ctx.createRadialGradient(x, y, 0, x, y, r);
      sg.addColorStop(0,   'rgba(60,10,0,0.85)');
      sg.addColorStop(0.6, 'rgba(120,40,0,0.4)');
      sg.addColorStop(1,   'transparent');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(c);
  }

  function makeEarthTexture() {
    const size = 512;
    const c    = document.createElement('canvas');
    c.width    = c.height = size;
    const ctx  = c.getContext('2d');

    // Ocean
    const ocean = ctx.createLinearGradient(0, 0, size, size);
    ocean.addColorStop(0,   '#0a3a70');
    ocean.addColorStop(0.3, '#1466aa');
    ocean.addColorStop(0.6, '#0d4d8a');
    ocean.addColorStop(1,   '#0a3060');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, size, size);

    // Simplified land masses
    const lands = [
      { x: 100, y: 80,  rx: 50, ry: 60  },   // North America
      { x: 150, y: 230, rx: 30, ry: 50  },   // South America
      { x: 260, y: 60,  rx: 35, ry: 90  },   // Europe / Africa
      { x: 310, y: 50,  rx: 70, ry: 55  },   // Asia
      { x: 380, y: 270, rx: 40, ry: 30  },   // Australia
    ];

    lands.forEach(l => {
      ctx.fillStyle = '#2d7a3a';
      ctx.beginPath();
      ctx.ellipse(l.x, l.y, l.rx, l.ry, Math.random() * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1f6630';
      ctx.beginPath();
      ctx.ellipse(l.x + 10, l.y + 10, l.rx * 0.5, l.ry * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ice caps
    ctx.fillStyle = 'rgba(220,240,255,0.9)';
    ctx.fillRect(0, 0,        size, 26);
    ctx.fillRect(0, size - 22, size, 22);

    // Cloud wisps
    for (let i = 0; i < 18; i++) {
      const x  = Math.random() * size;
      const y  = Math.random() * size;
      const w  = Math.random() * 90 + 30;
      const h  = Math.random() * 18 + 6;
      const cg = ctx.createLinearGradient(x, y, x + w, y);
      cg.addColorStop(0,   'transparent');
      cg.addColorStop(0.3, `rgba(255,255,255,${0.35 + Math.random() * 0.25})`);
      cg.addColorStop(0.7, `rgba(255,255,255,${0.30 + Math.random() * 0.20})`);
      cg.addColorStop(1,   'transparent');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y, w / 2, h, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(c);
  }

  function makeMoonTexture() {
    const size = 256;
    const c    = document.createElement('canvas');
    c.width    = c.height = size;
    const ctx  = c.getContext('2d');

    ctx.fillStyle = '#8a9099';
    ctx.fillRect(0, 0, size, size);

    // Surface noise
    for (let i = 0; i < 4000; i++) {
      const x  = Math.random() * size;
      const y  = Math.random() * size;
      const r  = Math.random() * 3;
      const v  = Math.random() * 60 - 30;
      const ch = Math.min(255, Math.max(0, 138 + v));
      ctx.fillStyle = `rgb(${ch},${ch + 4},${ch + 8})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Impact craters
    for (let i = 0; i < 20; i++) {
      const x  = Math.random() * size;
      const y  = Math.random() * size;
      const r  = Math.random() * 16 + 3;
      const cg = ctx.createRadialGradient(x, y, 0, x, y, r);
      cg.addColorStop(0,   'rgba(60,62,68,0.9)');
      cg.addColorStop(0.7, 'rgba(90,92,98,0.6)');
      cg.addColorStop(1,   'rgba(180,185,195,0.2)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    return new THREE.CanvasTexture(c);
  }

  /* ── Build Sun scene ── */
  const sunCanvas   = document.getElementById('sun-canvas');
  const sunRenderer = makeRenderer(sunCanvas);
  const { scene: sunScene, camera: sunCamera } = makeScene();

  const sunGeo = new THREE.SphereGeometry(1, 64, 64);
  const sunMat = new THREE.MeshStandardMaterial({
    map:               makeSunTexture(),
    emissive:          new THREE.Color(0xff6600),
    emissiveIntensity: 0.6,
    roughness:         0.9,
    metalness:         0.0,
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunScene.add(sunMesh);

  // Corona layers
  [{ r: 1.12, c: 0xff9900, o: 0.08 }, { r: 1.25, c: 0xff6600, o: 0.04 }].forEach(({ r, c, o }) => {
    sunScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(r, 32, 32),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, side: THREE.BackSide })
    ));
  });

  sunScene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const sunPoint = new THREE.PointLight(0xffffff, 1.5, 10);
  sunPoint.position.set(3, 2, 3);
  sunScene.add(sunPoint);

  /* ── Build Earth scene ── */
  const earthCanvas   = document.getElementById('earth-canvas');
  const earthRenderer = makeRenderer(earthCanvas);
  const { scene: earthScene, camera: earthCamera } = makeScene();

  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.MeshStandardMaterial({ map: makeEarthTexture(), roughness: 0.75, metalness: 0.1 })
  );
  earthScene.add(earthMesh);

  // Atmosphere halos
  [{ r: 1.06, c: 0x4488ff, o: 0.10 }, { r: 1.14, c: 0x2255cc, o: 0.05 }].forEach(({ r, c, o }) => {
    earthScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(r, 32, 32),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, side: THREE.BackSide })
    ));
  });

  // Moon
  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 32, 32),
    new THREE.MeshStandardMaterial({ map: makeMoonTexture(), roughness: 0.95, metalness: 0.0 })
  );
  moonMesh.position.set(1.6, 0, 0);
  earthScene.add(moonMesh);

  // Earth lighting
  earthScene.add(new THREE.AmbientLight(0x334466, 0.5));
  const earthSun = new THREE.DirectionalLight(0xfff8e0, 2.2);
  earthSun.position.set(4, 2, 3);
  earthScene.add(earthSun);
  const earthRim = new THREE.DirectionalLight(0x224488, 0.4);
  earthRim.position.set(-4, -1, -2);
  earthScene.add(earthRim);
  const moonLight = new THREE.DirectionalLight(0xfff8e0, 1.8);
  moonLight.position.set(4, 2, 3);
  earthScene.add(moonLight);

  /* ── Animation loop ── */
  let t = 0;

  function animate() {
    requestAnimationFrame(animate);
    t += 0.005;

    // Sun — slow rotation
    sunMesh.rotation.y += 0.003;
    sunMesh.rotation.x  = 0.08;

    // Earth — rotation + axial tilt
    earthMesh.rotation.y += 0.006;
    earthMesh.rotation.z  = 0.41;   // ≈ 23.5°

    // Moon — orbital path around Earth
    moonMesh.position.x = Math.cos(t * 0.7) * 1.6;
    moonMesh.position.z = Math.sin(t * 0.7) * 1.6;
    moonMesh.position.y = Math.sin(t * 0.7) * 0.3;
    moonMesh.rotation.y += 0.002;

    sunRenderer.render(sunScene, sunCamera);
    earthRenderer.render(earthScene, earthCamera);
  }

  animate();
})();


/* ═══════════════════════════════════════════════════════════
   3. DATEPICKER LOGIC
═══════════════════════════════════════════════════════════ */
(function () {
  const MONTHS = [
    'JANUARY', 'FEBRUARY', 'MARCH',     'APRIL',   'MAY',      'JUNE',
    'JULY',    'AUGUST',   'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const today    = new Date();
  let   cur      = new Date(today.getFullYear(), today.getMonth(), 1);
  let   selected = null;

  function render() {
    document.getElementById('month-name').textContent = MONTHS[cur.getMonth()];
    document.getElementById('year-num').textContent   = cur.getFullYear();

    const grid  = document.getElementById('days-grid');
    grid.innerHTML = '';

    const year  = cur.getFullYear();
    const month = cur.getMonth();
    const first = new Date(year, month, 1).getDay();
    const days  = new Date(year, month + 1, 0).getDate();

    // Empty offset cells
    for (let i = 0; i < first; i++) {
      const el = document.createElement('div');
      el.className = 'day-cell empty';
      grid.appendChild(el);
    }

    // Day cells
    for (let d = 1; d <= days; d++) {
      const el = document.createElement('div');
      el.className  = 'day-cell';
      el.textContent = d;

      if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear())
        el.classList.add('today');

      if (
        selected &&
        d === selected.getDate() &&
        month === selected.getMonth() &&
        year  === selected.getFullYear()
      ) el.classList.add('selected');

      el.addEventListener('click', () => {
        selected = new Date(year, month, d);
        const opts = { day: 'numeric', month: 'long', year: 'numeric' };
        document.getElementById('selected-date-label').textContent =
          selected.toLocaleDateString('en-GB', opts).toUpperCase();
        render();
      });

      grid.appendChild(el);
    }
  }

  // Expose render + cur so tooltip can trigger "jump to today"
  window._dpRender = render;
  window._dpGetCur = () => cur;
  window._dpSetCur = (d) => { cur = d; };

  document.getElementById('prev-btn').onclick = () => {
    cur = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
    render();
  };
  document.getElementById('next-btn').onclick = () => {
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    render();
  };

  render();
})();


/* ═══════════════════════════════════════════════════════════
   4. TOOLTIP SYSTEM
═══════════════════════════════════════════════════════════ */
(function () {
  const tt      = document.getElementById('tooltip');
  const ttTitle = document.getElementById('tt-title');
  const ttBody  = document.getElementById('tt-body');

  function show(title, body, e) {
    ttTitle.textContent = title;
    ttBody.innerHTML    = body;
    tt.classList.add('show');
    move(e);
  }
  function move(e) {
    let x = e.clientX + 18;
    let y = e.clientY - 50;
    if (x + 220 > window.innerWidth) x = e.clientX - 230;
    if (y < 10)                      y = e.clientY + 20;
    tt.style.left = `${x}px`;
    tt.style.top  = `${y}px`;
  }
  function hide() { tt.classList.remove('show'); }

  /* ── Sun panel ── */
  const sunPanel = document.getElementById('sun-panel');

  sunPanel.addEventListener('mouseenter', e => {
    show(
      'SOL — G-TYPE MAIN SEQUENCE',
      'Diameter: 1,392,700 km<br>' +
      'Surface Temp: 5,778 K<br>' +
      'Luminosity: 3.83 × 10²⁶ W<br>' +
      'Age: 4.603 Billion Years<br><br>' +
      '<em style="color:#ffb830;font-size:9px">CLICK → Jump to today</em>',
      e
    );
  });
  sunPanel.addEventListener('mousemove',  move);
  sunPanel.addEventListener('mouseleave', hide);

  sunPanel.addEventListener('click', () => {
    const t = new Date();
    window._dpSetCur(new Date(t.getFullYear(), t.getMonth(), 1));
    window._dpRender && window._dpRender();
  });

  /* ── Earth panel ── */
  const earthPanel = document.getElementById('earth-panel');
  const now        = new Date();
  const dayOfYear  = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);

  earthPanel.addEventListener('mouseenter', e => {
    show(
      'TERRA — CLASS M WORLD',
      `Day ${dayOfYear} of ${now.getFullYear()}<br>` +
      'Orbital Period: 365.25 days<br>' +
      'Axial Tilt: 23.44°<br>' +
      'Natural Satellites: 1 Moon<br><br>' +
      '<em style="color:#38d9f5;font-size:9px">CLICK → Warp orbit speed</em>',
      e
    );
  });
  earthPanel.addEventListener('mousemove',  move);
  earthPanel.addEventListener('mouseleave', hide);
})();
