const canvas = document.querySelector("#heart-canvas");
const ctx = canvas.getContext("2d", { alpha: true });
const controls = document.querySelectorAll(".control");

const palettes = {
  rose: {
    background: ["#070712", "#171026", "#070d19"],
    particles: ["#fff4fb", "#ffd1e1", "#ff7aaa", "#ff3f84", "#ff9cc3"],
    sparks: ["#ffffff", "#ffd7e7", "#ff4f8b", "#ffb3d0"],
    accent: "#ff4f8b",
    accent2: "#ffd1e1",
    shadow: "rgba(255, 49, 118, 0.42)"
  },
  gold: {
    background: ["#080910", "#1d1620", "#111405"],
    particles: ["#fff7d1", "#ffd166", "#ff986b", "#ff4d6d", "#fff0a3"],
    sparks: ["#ffffff", "#ffe7a3", "#ff9f1c", "#ff6b6b"],
    accent: "#ffb703",
    accent2: "#fff0b8",
    shadow: "rgba(255, 183, 3, 0.38)"
  },
  dream: {
    background: ["#061017", "#15142b", "#160819"],
    particles: ["#f5f3ff", "#c4b5fd", "#67e8f9", "#fb7185", "#bae6fd"],
    sparks: ["#ffffff", "#a5f3fc", "#f0abfc", "#fecdd3"],
    accent: "#67e8f9",
    accent2: "#f0abfc",
    shadow: "rgba(103, 232, 249, 0.36)"
  }
};

const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  active: false
};

let width = 0;
let height = 0;
let dpr = 1;
let heartParticles = [];
let sparks = [];
let ripples = [];
let stars = [];
let fireflies = [];
let palette = palettes.rose;
let lastTime = 0;
let burstClock = 0;
let centerX = 0;
let centerY = 0;
let heartScale = 1;
let motionFactor = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.35 : 1;

const random = (min, max) => min + Math.random() * (max - min);
const pick = (items) => items[Math.floor(Math.random() * items.length)];

function heartPoint(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x, y: -y };
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  centerX = width / 2;
  centerY = height * (width < 680 ? 0.52 : 0.54);
  heartScale = Math.min(width, height) / 36;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  buildScene();
}

function createFirefly(resetBelow = false) {
  return {
    x: random(-width * 0.08, width * 1.08),
    y: resetBelow ? height + random(20, 150) : random(-height * 0.08, height * 1.08),
    size: random(0.7, 2.4),
    vx: random(-0.11, 0.11),
    vy: random(-0.21, -0.055),
    orbit: random(12, 48),
    phase: random(0, Math.PI * 2),
    alpha: random(0.16, 0.72),
    color: pick(palette.sparks)
  };
}

function buildScene() {
  const count = width < 680 ? 460 : 780;

  heartParticles = Array.from({ length: count }, (_, index) => {
    const t = (index / count) * Math.PI * 2 + random(-0.028, 0.028);
    const point = heartPoint(t);
    const layer = Math.pow(Math.random(), 0.44);
    const spread = random(-1.55, 1.55) * layer;

    return {
      t,
      layer,
      depth: random(0.72, 1.32),
      baseX: point.x * heartScale * (0.7 + layer * 0.5) + spread * heartScale,
      baseY: point.y * heartScale * (0.7 + layer * 0.5) + random(-1.18, 1.18) * heartScale * layer,
      color: palette.particles[index % palette.particles.length],
      size: random(0.76, 2.9) * (0.82 + layer),
      phase: random(0, Math.PI * 2),
      orbit: random(0.28, 2.35),
      sparkle: Math.random() > 0.84,
      shimmer: random(0.65, 1.45)
    };
  });

  stars = Array.from({ length: width < 680 ? 70 : 128 }, () => ({
    x: random(0, width),
    y: random(0, height),
    size: random(0.35, 1.55),
    alpha: random(0.1, 0.72),
    phase: random(0, Math.PI * 2)
  }));

  fireflies = Array.from({ length: width < 680 ? 34 : 68 }, () => createFirefly());
}

function setPalette(name) {
  palette = palettes[name] || palettes.rose;
  document.documentElement.style.setProperty("--accent", palette.accent);
  document.documentElement.style.setProperty("--accent-2", palette.accent2);
  document.documentElement.style.setProperty("--shadow", palette.shadow);
  document.body.style.background = `
    radial-gradient(circle at 52% 42%, ${palette.accent}33, transparent 28rem),
    radial-gradient(circle at 22% 18%, ${palette.accent2}2e, transparent 22rem),
    linear-gradient(145deg, ${palette.background[0]}, ${palette.background[1]} 52%, ${palette.background[2]})
  `;

  controls.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === name);
  });

  buildScene();
  spawnBurst(centerX, centerY, 72, 1.2);
}

function drawHeartShape(x, y, size, rotation, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(size, size);
  ctx.beginPath();
  ctx.moveTo(0, 0.38);
  ctx.bezierCurveTo(-0.95, -0.35, -0.65, -1.15, 0, -0.72);
  ctx.bezierCurveTo(0.65, -1.15, 0.95, -0.35, 0, 0.38);
  ctx.closePath();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.fill();
  ctx.restore();
}

function drawSparkle(x, y, size, rotation, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.8, size * 0.12);
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(0, size);
  ctx.moveTo(-size, 0);
  ctx.lineTo(size, 0);
  ctx.moveTo(-size * 0.55, -size * 0.55);
  ctx.lineTo(size * 0.55, size * 0.55);
  ctx.moveTo(size * 0.55, -size * 0.55);
  ctx.lineTo(-size * 0.55, size * 0.55);
  ctx.stroke();
  ctx.restore();
}

function traceHeart(multiplier, alpha, lineWidth, color, timeOffset = 0) {
  ctx.beginPath();
  for (let i = 0; i <= Math.PI * 2 + 0.02; i += 0.04) {
    const point = heartPoint(i);
    const wobble = Math.sin(i * 5 + timeOffset) * heartScale * 0.045;
    const x = centerX + point.x * heartScale * multiplier + wobble;
    const y = centerY + point.y * heartScale * multiplier;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}

function spawnBurst(x, y, amount = 34, force = 1) {
  ripples.push({ x, y, radius: 0, life: 1, hue: palette.accent });

  for (let i = 0; i < amount; i += 1) {
    const angle = random(0, Math.PI * 2);
    const speed = random(1.8, 8.4) * force;
    const life = random(0.72, 1.28);

    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - random(0.6, 2.7),
      drag: random(0.91, 0.978),
      gravity: random(0.016, 0.064),
      life,
      maxLife: life,
      size: random(4.2, 12.5),
      spin: random(-0.095, 0.095),
      rotation: random(-0.8, 0.8),
      color: pick(palette.sparks),
      shape: Math.random() > 0.64 ? "sparkle" : "heart"
    });
  }
}

function updatePointer(event) {
  const touch = event.touches?.[0];
  pointer.x = touch ? touch.clientX : event.clientX;
  pointer.y = touch ? touch.clientY : event.clientY;
  pointer.active = true;
}

function drawRibbons(time) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < 5; i += 1) {
    const phase = time * (0.00045 + i * 0.00008) + i * 1.9;
    const y = centerY + Math.sin(phase) * height * 0.13 + (i - 2) * heartScale * 2.1;
    const gradient = ctx.createLinearGradient(0, y, width, y);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.3, `${palette.accent}36`);
    gradient.addColorStop(0.55, `${palette.accent2}2b`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.globalAlpha = 0.46;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = (width < 680 ? 16 : 24) + i * 2;
    ctx.shadowColor = i % 2 ? palette.accent : palette.accent2;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(-width * 0.12, y);
    ctx.bezierCurveTo(
      width * 0.16,
      y - Math.cos(phase) * height * 0.16,
      width * 0.68,
      y + Math.sin(phase * 1.4) * height * 0.18,
      width * 1.12,
      y + Math.cos(phase) * height * 0.1
    );
    ctx.stroke();
  }

  ctx.restore();
}

function drawBackground(time) {
  drawRibbons(time);

  const gradient = ctx.createRadialGradient(centerX, centerY, 8, centerX, centerY, Math.min(width, height) * 0.72);
  gradient.addColorStop(0, `${palette.accent}26`);
  gradient.addColorStop(0.42, "rgba(255,255,255,0.042)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  stars.forEach((star) => {
    const twinkle = star.alpha + Math.sin(time * 0.0018 + star.phase) * 0.2;
    const pulse = Math.max(0.05, twinkle);

    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();

    if (pulse > 0.64 && star.size > 0.8) {
      drawSparkle(star.x, star.y, star.size * 4.1, star.phase, "#ffffff", 0.18);
    }
  });

  ctx.globalAlpha = 1;
}

function drawFireflies(delta, time) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  fireflies.forEach((fly, index) => {
    fly.phase += delta * 0.0018;
    fly.x += (fly.vx + Math.sin(fly.phase) * 0.08) * delta * 0.06;
    fly.y += (fly.vy + Math.cos(fly.phase * 0.8) * 0.035) * delta * 0.08;

    if (fly.y < -80 || fly.x < -120 || fly.x > width + 120) {
      fireflies[index] = createFirefly(true);
      return;
    }

    const shimmer = fly.alpha + Math.sin(time * 0.0032 + fly.phase) * 0.24;
    const radius = fly.size * (2.4 + Math.max(0, shimmer) * 2.2);
    const glow = ctx.createRadialGradient(fly.x, fly.y, 0, fly.x, fly.y, radius * 4.2);
    glow.addColorStop(0, fly.color);
    glow.addColorStop(0.22, `${fly.color}66`);
    glow.addColorStop(1, "rgba(255,255,255,0)");

    ctx.globalAlpha = Math.max(0.08, shimmer) * 0.5;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fly.x, fly.y, radius * 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = Math.max(0.1, shimmer);
    ctx.fillStyle = fly.color;
    ctx.beginPath();
    ctx.arc(fly.x, fly.y, fly.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawHeart(time) {
  const beat = 1 + Math.sin(time * 0.0048) * 0.045 + Math.sin(time * 0.0096) * 0.025;
  const pointerDx = pointer.x - centerX;
  const pointerDy = pointer.y - centerY;
  const pointerDistance = Math.hypot(pointerDx, pointerDy);
  const pointerPull = pointer.active ? Math.max(0, 1 - pointerDistance / Math.min(width, height) / 0.55) : 0;

  const coreGradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, heartScale * 19);
  coreGradient.addColorStop(0, `${palette.accent2}50`);
  coreGradient.addColorStop(0.44, `${palette.accent}28`);
  coreGradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, heartScale * 19.5 * beat, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = palette.accent;
  ctx.shadowBlur = 24;

  for (let i = 0; i < 2; i += 1) {
    const progress = (time * 0.00034 + i * 0.5) % 1;
    traceHeart(1.03 + progress * 0.16, (1 - progress) * 0.24, 1.6 + progress * 4, palette.accent2, time * 0.002);
  }

  traceHeart(1.02 * beat, 0.3, 2.2, palette.accent, time * 0.002);
  traceHeart(0.92 * beat, 0.16, 5.5, palette.accent2, time * 0.0024);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  heartParticles.forEach((particle, index) => {
    const wave = Math.sin(time * 0.0022 * particle.shimmer + particle.phase);
    const drift = Math.cos(time * 0.0018 + particle.phase) * particle.orbit * heartScale * 0.21;
    const orbit = Math.sin(time * 0.001 + particle.phase) * particle.depth;
    const magnetic = pointerPull * 0.02 * particle.layer;
    const x =
      centerX +
      particle.baseX * beat +
      Math.cos(particle.phase + time * 0.00115) * particle.orbit * particle.depth +
      orbit +
      pointerDx * magnetic;
    const y =
      centerY +
      particle.baseY * beat +
      drift +
      wave * particle.orbit +
      pointerDy * magnetic;

    const alpha = 0.42 + particle.layer * 0.48 + Math.max(0, wave) * 0.2;
    const radius = particle.size * (1 + Math.max(0, wave) * 0.42);

    ctx.shadowColor = particle.color;
    ctx.shadowBlur = particle.sparkle ? 22 : 17;

    if (particle.sparkle && wave > 0.05) {
      drawSparkle(x, y, radius * 2.9, particle.phase + time * 0.0015, particle.color, alpha * 0.48);
    } else {
      ctx.beginPath();
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = alpha;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (index % 19 === 0) {
      const next = heartParticles[(index + 4) % heartParticles.length];
      const nextPoint = heartPoint(next.t);
      const nx = centerX + nextPoint.x * heartScale * beat;
      const ny = centerY + nextPoint.y * heartScale * beat;
      ctx.globalAlpha = 0.055 + pointerPull * 0.08;
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
    }
  });

  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawRipples(delta) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  ripples = ripples.filter((ripple) => {
    ripple.radius += delta * 0.24;
    ripple.life -= delta * 0.0015;

    ctx.globalAlpha = Math.max(0, ripple.life) * 0.62;
    ctx.strokeStyle = ripple.hue;
    ctx.shadowColor = ripple.hue;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();

    return ripple.life > 0;
  });

  ctx.restore();
}

function drawSparks(delta) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  sparks = sparks.filter((spark) => {
    spark.vx *= spark.drag;
    spark.vy = spark.vy * spark.drag + spark.gravity * delta;
    spark.x += spark.vx * delta * 0.06;
    spark.y += spark.vy * delta * 0.06;
    spark.rotation += spark.spin * delta;
    spark.life -= delta * 0.00118;

    const alpha = Math.max(0, spark.life / spark.maxLife);
    ctx.globalAlpha = alpha * 0.28;
    ctx.strokeStyle = spark.color;
    ctx.lineWidth = Math.max(0.9, spark.size * 0.08);
    ctx.shadowColor = spark.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(spark.x - spark.vx * 2.2, spark.y - spark.vy * 2.2);
    ctx.lineTo(spark.x, spark.y);
    ctx.stroke();

    if (spark.shape === "sparkle") {
      drawSparkle(spark.x, spark.y, spark.size * 0.52, spark.rotation, spark.color, alpha);
    } else {
      drawHeartShape(spark.x, spark.y, spark.size * 0.13, spark.rotation, spark.color, alpha);
    }

    return spark.life > 0 && spark.y < height + 60;
  });

  ctx.restore();
}

function animate(time = 0) {
  const rawDelta = Math.min(34, time - lastTime || 16.67);
  const delta = rawDelta * motionFactor;
  lastTime = time;
  burstClock += delta;

  ctx.clearRect(0, 0, width, height);
  drawBackground(time);
  drawFireflies(delta, time);
  drawHeart(time);
  drawRipples(delta);
  drawSparks(delta);

  if (burstClock > 980 && motionFactor > 0.5) {
    const point = heartPoint(random(0, Math.PI * 2));
    spawnBurst(centerX + point.x * heartScale * random(0.52, 0.9), centerY + point.y * heartScale * random(0.52, 0.9), 14, 0.48);
    burstClock = 0;
  }

  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", updatePointer);
window.addEventListener("pointerleave", () => {
  pointer.active = false;
});
window.addEventListener("click", (event) => spawnBurst(event.clientX, event.clientY, 48, 1.08));
window.addEventListener("touchstart", (event) => {
  updatePointer(event);
  spawnBurst(pointer.x, pointer.y, 42, 1);
}, { passive: true });

controls.forEach((button) => {
  button.addEventListener("click", () => setPalette(button.dataset.mode));
});

resize();
spawnBurst(centerX, centerY, 96, 1.28);
requestAnimationFrame(animate);
