const canvas = document.getElementById("fireworks");
const context = canvas.getContext("2d", { alpha: false });

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const palette = [8, 30, 47, 185, 205, 280, 320];
const burstShapes = ["circle", "ring", "heart", "star"];

let width = 0;
let height = 0;
let pixelRatio = 1;
let rockets = [];
let particles = [];
let messages = [];
let flashes = [];
let stars = [];
let nextLaunchAt = 0;
let lastFrame = performance.now();

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function choose(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function resize() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);

  const starCount = Math.max(18, Math.min(48, Math.floor((width * height) / 38000)));
  stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height * 0.76,
    size: Math.random() > 0.92 ? 1.6 : 0.8,
    alpha: random(0.18, 0.68),
    phase: Math.random() * Math.PI * 2,
  }));
}

function launch(x = random(width * 0.18, width * 0.82), targetY) {
  if (rockets.length >= 4) return;

  const horizontalTarget = Math.max(width * 0.12, Math.min(width * 0.88, x));
  const shape = choose(burstShapes);
  const message =
    Math.random() < 0.32
      ? shape === "heart" || Math.random() < 0.62
        ? "i love you"
        : "cute"
      : null;
  const hue =
    shape === "heart"
      ? random(330, 352)
      : shape === "star"
        ? random(38, 56)
        : choose(palette) + random(-10, 10);
  rockets.push({
    x: random(width * 0.3, width * 0.7),
    y: height + 18,
    vx: (horizontalTarget - width * 0.5) * 0.0018 + random(-0.28, 0.28),
    vy: random(-9.8, -8.5),
    targetY: targetY ?? random(height * 0.16, height * 0.47),
    hue,
    shape,
    message,
    trail: [],
  });
}

function shapeVelocity(shape, index, count) {
  const progress = index / count;

  if (shape === "heart") {
    const angle = progress * Math.PI * 2;
    return {
      vx: Math.pow(Math.sin(angle), 3) * 4.3 + random(-0.12, 0.12),
      vy:
        -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) *
          0.27 +
        random(-0.12, 0.12),
    };
  }

  if (shape === "star") {
    const segment = progress * 10;
    const current = Math.floor(segment);
    const localProgress = segment - current;
    const point = (vertex) => {
      const radius = vertex % 2 === 0 ? 5.9 : 2.45;
      const angle = -Math.PI / 2 + (Math.PI * 2 * vertex) / 10;
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    };
    const start = point(current);
    const end = point(current + 1);
    return {
      vx: start.x + (end.x - start.x) * localProgress + random(-0.08, 0.08),
      vy: start.y + (end.y - start.y) * localProgress + random(-0.08, 0.08),
    };
  }

  const angle = Math.PI * 2 * progress + random(-0.045, 0.045);
  const speed = shape === "ring" ? random(4.6, 5.1) : random(2.2, 5.8) * (Math.random() > 0.16 ? 1 : 0.46);
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}

function burst(rocket) {
  const compact = width < 560;
  const amount = compact ? 50 : 76;
  const alternateHue = (rocket.hue + random(22, 72)) % 360;
  const maxParticles = compact ? 360 : 620;
  const available = Math.max(0, maxParticles - particles.length);
  const count = Math.min(amount, available);
  const glitterCount = Math.min(compact ? 10 : 16, Math.max(0, available - count));

  for (let index = 0; index < count; index += 1) {
    const velocity = shapeVelocity(rocket.shape, index, count);
    const useAccent = Math.random() > 0.78;
    const hue = useAccent ? alternateHue : rocket.hue;
    particles.push({
      x: rocket.x,
      y: rocket.y,
      vx: velocity.vx,
      vy: velocity.vy,
      gravity: rocket.shape === "heart" || rocket.shape === "star" ? random(0.022, 0.035) : random(0.036, 0.064),
      friction: random(0.978, 0.987),
      alpha: 1,
      decay: random(0.010, 0.017),
      size: random(1.15, 2.35),
      color: `hsl(${hue} 100% ${useAccent ? 76 : 66}%)`,
      trail: [],
      twinkle: Math.random() > 0.54,
      phase: random(0, Math.PI * 2),
    });
  }

  for (let index = 0; index < glitterCount; index += 1) {
    const angle = random(0, Math.PI * 2);
    const speed = random(1.5, 4.1);
    particles.push({
      x: rocket.x,
      y: rocket.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: random(0.038, 0.058),
      friction: 0.982,
      alpha: 0.94,
      decay: random(0.018, 0.028),
      size: random(0.75, 1.35),
      color: "#fff7c7",
      trail: [],
      twinkle: true,
      phase: random(0, Math.PI * 2),
    });
  }

  particles.push({
    x: rocket.x,
    y: rocket.y,
    vx: 0,
    vy: 0,
    gravity: 0,
    friction: 1,
    alpha: 1,
    decay: 0.08,
    size: compact ? 4 : 6,
    color: "#fff8d5",
    trail: [],
    twinkle: false,
    phase: 0,
  });

  flashes.push({
    x: rocket.x,
    y: rocket.y,
    hue: rocket.hue,
    age: 0,
    lifetime: 17,
    radius: compact ? 42 : 62,
  });

  if (rocket.message && messages.length < 3) {
    messages.push({
      x: rocket.x,
      y: rocket.y - 5,
      text: rocket.message,
      hue: rocket.hue,
      age: 0,
      lifetime: 70,
    });
  }
}

function updateRockets(delta) {
  for (let index = rockets.length - 1; index >= 0; index -= 1) {
    const rocket = rockets[index];
    rocket.trail.push({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > 10) rocket.trail.shift();

    rocket.x += rocket.vx * delta;
    rocket.y += rocket.vy * delta;
    rocket.vy += 0.075 * delta;

    if (rocket.y <= rocket.targetY || rocket.vy >= -0.55) {
      burst(rocket);
      rockets.splice(index, 1);
    }
  }
}

function updateParticles(delta) {
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.trail.push({ x: particle.x, y: particle.y });
    if (particle.trail.length > 4) particle.trail.shift();

    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.vx *= Math.pow(particle.friction, delta);
    particle.vy = particle.vy * Math.pow(particle.friction, delta) + particle.gravity * delta;
    particle.alpha -= particle.decay * delta;

    if (particle.alpha <= 0 || particle.y > height + 24) {
      particles.splice(index, 1);
    }
  }
}

function updateMessages(delta) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    message.age += delta;
    message.y -= 0.15 * delta;

    if (message.age >= message.lifetime) {
      messages.splice(index, 1);
    }
  }
}

function updateFlashes(delta) {
  for (let index = flashes.length - 1; index >= 0; index -= 1) {
    flashes[index].age += delta;
    if (flashes[index].age >= flashes[index].lifetime) {
      flashes.splice(index, 1);
    }
  }
}

function drawStars(time) {
  context.globalCompositeOperation = "source-over";
  for (const star of stars) {
    const shimmer = 0.72 + Math.sin(time * 0.0012 + star.phase) * 0.28;
    context.globalAlpha = star.alpha * shimmer;
    context.fillStyle = "#dbe9ff";
    context.fillRect(star.x, star.y, star.size, star.size);
  }
}

function drawTrail(trail, color, alpha, lineWidth) {
  if (trail.length < 2) return;
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.moveTo(trail[0].x, trail[0].y);
  for (let index = 1; index < trail.length; index += 1) {
    context.lineTo(trail[index].x, trail[index].y);
  }
  context.stroke();
}

function drawFlashes() {
  context.globalCompositeOperation = "lighter";

  for (const flash of flashes) {
    const progress = flash.age / flash.lifetime;
    const radius = flash.radius * (0.35 + progress * 0.65);
    const alpha = Math.pow(1 - progress, 2) * 0.44;
    const gradient = context.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, radius);
    gradient.addColorStop(0, `hsla(${flash.hue}, 100%, 88%, ${alpha})`);
    gradient.addColorStop(0.28, `hsla(${flash.hue}, 100%, 70%, ${alpha * 0.55})`);
    gradient.addColorStop(1, `hsla(${flash.hue}, 100%, 58%, 0)`);
    context.fillStyle = gradient;
    context.fillRect(flash.x - radius, flash.y - radius, radius * 2, radius * 2);
  }
}

function drawFireworks(time) {
  context.globalCompositeOperation = "lighter";

  for (const rocket of rockets) {
    const color = `hsl(${rocket.hue} 100% 72%)`;
    drawTrail(rocket.trail, color, 0.72, 1.35);
    context.globalAlpha = 1;
    context.fillStyle = "#fff8dc";
    context.beginPath();
    context.arc(rocket.x, rocket.y, 2.05, 0, Math.PI * 2);
    context.fill();
  }

  for (const particle of particles) {
    const shimmer = particle.twinkle ? 0.62 + Math.sin(time * 0.018 + particle.phase) * 0.38 : 1;
    const alpha = particle.alpha * shimmer;
    drawTrail(particle.trail, particle.color, alpha * 0.25, particle.size * 0.65);
    context.globalAlpha = alpha;
    context.fillStyle = particle.color;
    context.fillRect(
      particle.x - particle.size / 2,
      particle.y - particle.size / 2,
      particle.size,
      particle.size,
    );
  }

  context.globalAlpha = 1;
}

function drawMessages() {
  context.globalCompositeOperation = "source-over";
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (const message of messages) {
    const fadeIn = Math.min(1, message.age / 7);
    const fadeOut = Math.min(1, (message.lifetime - message.age) / 20);
    const alpha = fadeIn * fadeOut;
    const size = Math.max(18, Math.min(message.text === "i love you" ? 34 : 38, width * 0.075));

    context.font = `700 ${size}px Arial, sans-serif`;
    context.lineWidth = Math.max(1.4, size * 0.055);
    context.globalAlpha = alpha * 0.7;
    context.strokeStyle = `hsl(${message.hue} 100% 68%)`;
    context.shadowColor = `hsl(${message.hue} 100% 68%)`;
    context.shadowBlur = 13;
    context.strokeText(message.text, message.x, message.y);

    context.globalAlpha = alpha;
    context.fillStyle = "#fffdf2";
    context.shadowColor = "rgba(255, 255, 255, 0.68)";
    context.shadowBlur = 7;
    context.fillText(message.text, message.x, message.y);
  }

  context.shadowBlur = 0;
  context.globalAlpha = 1;
}

function frame(time) {
  const delta = Math.min(1.8, (time - lastFrame) / 16.67);
  lastFrame = time;

  context.globalCompositeOperation = "source-over";
  context.fillStyle = "rgba(0, 0, 0, 0.24)";
  context.fillRect(0, 0, width, height);
  drawStars(time);

  if (time >= nextLaunchAt) {
    launch();
    if (!reducedMotion && Math.random() < 0.24) {
      launch(random(width * 0.18, width * 0.82), random(height * 0.2, height * 0.5));
    }
    nextLaunchAt = time + (reducedMotion ? random(2200, 3200) : random(620, 1040));
  }

  updateRockets(delta);
  updateParticles(delta);
  updateMessages(delta);
  updateFlashes(delta);
  drawFlashes();
  drawFireworks(time);
  drawMessages();
  requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", (event) => {
  launch(event.clientX, Math.min(event.clientY, height * 0.58));
});

window.addEventListener("resize", resize);

resize();
launch(width * 0.34, height * 0.35);
nextLaunchAt = performance.now() + 780;
requestAnimationFrame(frame);
