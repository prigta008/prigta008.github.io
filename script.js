    const canvas = document.getElementById('birthdayCanvas');
    const ctx = canvas.getContext('2d');

    function resize() {
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      
      ctx.resetTransform?.();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // Animation state
    let startTime = performance.now();
    let replayRequested = false;

    // Palette
    const colors = {
      bgTop: '#0e0f1a',
      bgBottom: '#1b2040',
      stem: '#2f8f41',
      leaf: '#2aa64a',
      center: '#f7b733',
      petalBase: '#ff5ea0',
      petalTip: '#ffd1e6',
      textGlow: '#9db7ff'
    };

    // Confetti particles
    const confetti = [];
    function seedConfetti() {
      confetti.length = 0;
      const count = Math.min(200, Math.floor((canvas.width / canvas.height) * 120));
      for (let i = 0; i < count; i++) {
        confetti.push({
          x: Math.random() * canvas.width,
          y: -Math.random() * canvas.height * 0.5,
          r: 2 + Math.random() * 3,
          hue: 180 + Math.random() * 180,
          speedY: 0.8 + Math.random() * 2.2,
          drift: (Math.random() - 0.5) * 0.6,
          spin: Math.random() * Math.PI * 2
        });
      }
    }
    seedConfetti();

    function replay() {
      startTime = performance.now();
      seedConfetti();
    }
    window.addEventListener('click', replay);

    function lerp(a, b, t) { return a + (b - a) * t; }
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function easeInOutQuad(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function drawBackground() {
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, colors.bgTop);
      g.addColorStop(1, colors.bgBottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // subtle stars
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.8;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.restore();
    }

    function drawStemAndLeaves(cx, cy, trunkH, bloomT) {
      ctx.save();
      ctx.translate(cx, cy);

      // Stem (bezier curve)
      ctx.lineWidth = 6;
      ctx.strokeStyle = colors.stem;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const sway = Math.sin(bloomT * Math.PI * 2) * 10;
      ctx.bezierCurveTo(-sway, trunkH * 0.35, sway, trunkH * 0.7, 0, trunkH);
      ctx.stroke();

      // Leaves
      ctx.fillStyle = colors.leaf;
      ctx.strokeStyle = colors.leaf;
      ctx.lineWidth = 2;

      const leafSize = 28;
      const leafOffset = trunkH * 0.45;

      // Left leaf
      ctx.save();
      ctx.translate(-10, leafOffset);
      ctx.rotate(-0.8);
      ctx.beginPath();
      ctx.ellipse(0, 0, leafSize, leafSize * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Right leaf
      ctx.save();
      ctx.translate(12, trunkH * 0.7);
      ctx.rotate(0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, leafSize, leafSize * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    function drawFlower(cx, cy, radius, petals, bloom, spin) {
      ctx.save();
      ctx.translate(cx, cy);

      const r = radius * easeOutCubic(clamp(bloom, 0, 1)); // bloom expansion
      const innerR = r * 0.35;

      // Petals
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2 + spin * 0.7;
        const px = Math.cos(angle);
        const py = Math.sin(angle);

        const petalLen = r * 1.25;
        const petalWidth = r * 0.45;

        ctx.save();
        ctx.rotate(angle);
        const grad = ctx.createLinearGradient(innerR, 0, petalLen, 0);
        grad.addColorStop(0, colors.petalBase);
        grad.addColorStop(1, colors.petalTip);
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(innerR, 0, petalWidth, petalLen, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Center
      const cg = ctx.createRadialGradient(0, 0, innerR * 0.2, 0, 0, innerR);
      cg.addColorStop(0, '#ffe388');
      cg.addColorStop(1, colors.center);
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, innerR, 0, Math.PI * 2);
      ctx.fill();

      // Gentle highlight
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(innerR * 0.2, -innerR * 0.2, innerR * 0.5, innerR * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawConfetti(t) {
      ctx.save();
      for (const p of confetti) {
        p.y += p.speedY;
        p.x += p.drift;
        p.spin += 0.05;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `hsl(${p.hue}, 80%, 60%)`;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      }
      ctx.restore();
    }

    function drawText(message, t) {
      // Fade and glow
      const appear = easeOutCubic(clamp((t - 1200) / 1200, 0, 1));
      const pulse = 1 + Math.sin(t / 600) * 0.03;

      const fontSize = Math.min(canvas.width, canvas.height) * 0.08 * pulse;
      ctx.font = `900 ${fontSize}px "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
      const text = message;

      const textWidth = ctx.measureText(text).width;
      const x = (canvas.width - textWidth) / 2;
      const y = canvas.height * 0.18;

      // Glow
      ctx.save();
      ctx.globalAlpha = appear * 0.25;
      ctx.shadowColor = colors.textGlow;
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, x, y);
      ctx.restore();

      // Gradient fill
      const g = ctx.createLinearGradient(x, y - fontSize, x, y + fontSize * 0.2);
      g.addColorStop(0, '#fce6ff');
      g.addColorStop(1, '#b0c6ff');
      ctx.fillStyle = g;
      ctx.globalAlpha = appear;
      ctx.fillText(text, x, y);
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      const t = now - startTime;

      drawBackground();

      // Ground/anchor
      const cx = canvas.width / 2;
      const groundY = canvas.height * 0.75;

      // Stem and leaves sway
      const bloomT = clamp(t / 2000, 0, 1);
      drawStemAndLeaves(cx, groundY - canvas.height * 0.45, canvas.height * 0.45, bloomT);

      // Flower bloom and spin
      const petals = 5;
      const spin = easeOutCubic(clamp((t - 500) / 3000, 0, 1));
      const bloom = easeOutCubic(clamp(t / 2000, 0, 1));
      const radius = Math.min(canvas.width, canvas.height) * 0.11;

      drawFlower(cx, groundY - canvas.height * 0.55, radius, petals, bloom, spin);

      // Confetti starts after bloom
      if (t > 1600) drawConfetti(t);

      // Text greeting
      drawText('Happy Birthday, Sureeli', t);

      // Loop the animation with a short breathable pause
      if (t > 9000 && !replayRequested) {
        replayRequested = true;
        setTimeout(() => { replayRequested = false; replay(); }, 800);
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);