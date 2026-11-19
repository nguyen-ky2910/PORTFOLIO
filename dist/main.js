const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function canvasContext(canvas) {
  const bounds = canvas.getBoundingClientRect();
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(bounds.width * scale);
  const height = Math.round(bounds.height * scale);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx || !width || !height) return null;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, bounds.width, bounds.height);
  return { ctx, width: bounds.width, height: bounds.height };
}

function strokePath(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
}

function watchSize(element, render) {
  const observer = new ResizeObserver(render);
  observer.observe(element);
  render();
}

const hero = document.querySelector(".hero");
const heroCanvas = document.querySelector("#hero-circuit");
const traceTemplates = [
  [[.62, .03], [.74, .03], [.80, .13], [.95, .13], [1, .21]],
  [[.57, .07], [.69, .07], [.75, .17], [.96, .17], [1, .23]],
  [[.64, .22], [.72, .22], [.78, .32], [.88, .32], [1, .49]],
  [[.49, .43], [.59, .43], [.68, .3], [.78, .3], [.84, .39], [1, .39]],
  [[.49, .53], [.62, .53], [.71, .4], [.81, .4], [.89, .51], [1, .51]],
  [[.53, .59], [.66, .59], [.77, .45], [.92, .45], [1, .56]],
  [[.44, .74], [.53, .74], [.6, .65], [.73, .65], [.85, .83], [1, .83]],
  [[.52, .81], [.58, .81], [.64, .73], [.75, .73], [.86, .89], [1, .89]],
  [[.60, .95], [.67, .84], [.78, .84], [.84, .94], [.97, .94], [1, .9]],
];
let heroVisible = false;
let heroFrame = 0;

function drawHero(time = 0, animate = false) {
  const surface = canvasContext(heroCanvas);
  if (!surface) return;
  const { ctx, width, height } = surface;
  const grid = 26;
  const gridColor = ctx.createLinearGradient(0, 0, width, 0);
  gridColor.addColorStop(0, "#a9ce7220");
  gridColor.addColorStop(.46, "#a9ce720c");
  gridColor.addColorStop(1, "#a9ce722f");
  ctx.fillStyle = gridColor;
  for (let x = 0; x < width; x += grid) {
    for (let y = 10; y < height - 58; y += grid) ctx.fillRect(x, y, 1.5, 1.5);
  }

  traceTemplates.forEach((route, index) => {
    const points = route.map(([x, y]) => [x * width, 10 + y * (height - 70)]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = index % 3 ? "#9cc16d49" : "#c9f27d7a";
    strokePath(ctx, points);
    const [firstX, firstY] = points[0];
    ctx.strokeRect(firstX - 2, firstY - 2, 4, 4);
    if (!animate || index % 2) return;
    const position = ((time / 2100 + index * .137) % 1) * (points.length - 1);
    const start = points[Math.floor(position)];
    const end = points[Math.ceil(position)];
    const offset = position % 1;
    ctx.fillStyle = "#d9fa76";
    ctx.shadowColor = "#d9fa76";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(start[0] + (end[0] - start[0]) * offset, start[1] + (end[1] - start[1]) * offset, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function animateHero(time) {
  drawHero(time, true);
  heroFrame = requestAnimationFrame(animateHero);
}

function updateHeroMotion() {
  cancelAnimationFrame(heroFrame);
  if (heroVisible && !document.hidden && !reducedMotion.matches) {
    heroFrame = requestAnimationFrame(animateHero);
  } else {
    drawHero();
  }
}

new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting;
  updateHeroMotion();
}).observe(hero);
watchSize(heroCanvas, () => drawHero());
reducedMotion.addEventListener("change", updateHeroMotion);
document.addEventListener("visibilitychange", updateHeroMotion);

function schematicGrid(ctx, width, height) {
  ctx.fillStyle = "#1f2c19";
  for (let x = 12; x < width; x += 15) {
    for (let y = 12; y < height; y += 15) ctx.fillRect(x, y, 1, 1);
  }
}

function drawArray(ctx, width, height) {
  const cell = Math.min((width - 65) / 5, (height - 20) / 4, 52);
  const x0 = (width - cell * 4) / 2;
  const y0 = (height - cell * 3) / 2;
  ctx.lineWidth = 1;
  ctx.font = "12px Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let row = 0; row < 4; row++) {
    const y = y0 + row * cell;
    ctx.strokeStyle = "#6c824e";
    strokePath(ctx, [[x0 - cell * .6, y], [x0 + cell * 4.6, y]]);
    for (let column = 0; column < 5; column++) {
      const x = x0 + column * cell;
      ctx.strokeStyle = "#6c824e";
      strokePath(ctx, [[x, y - cell * .5], [x, y + cell * .52]]);
      const active = row + column === 3;
      ctx.fillStyle = active ? "#d9fa76" : "#22331d";
      ctx.strokeStyle = active ? "#d9fa76" : "#617c49";
      const size = cell * .62;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      ctx.strokeRect(x - size / 2, y - size / 2, size, size);
      ctx.fillStyle = active ? "#18230d" : "#c0d1ad";
      ctx.fillText("PE", x, y);
    }
  }
}

function drawPipeline(ctx, width, height) {
  const spacing = Math.min(width / 5.8, 86);
  const x0 = (width - spacing * 4) / 2;
  const y = height * .43;
  const box = spacing * .81;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#6c824e";
  strokePath(ctx, [[x0 - box / 2 - 8, y], [x0 + spacing * 4 + box / 2 + 8, y]]);
  ctx.strokeStyle = "#d9fa76";
  const feedbackY = height * .75;
  strokePath(ctx, [[x0 + spacing * 4, y], [x0 + spacing * 4, feedbackY], [x0 + spacing * 2, feedbackY], [x0 + spacing * 2, y]]);
  ctx.font = "12px Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ["IF", "ID", "EX", "MEM", "WB"].forEach((stage, index) => {
    const x = x0 + spacing * index;
    ctx.fillStyle = index === 2 ? "#d9fa76" : "#22331d";
    ctx.strokeStyle = index === 2 ? "#d9fa76" : "#617c49";
    ctx.fillRect(x - box / 2, y - 18, box, 36);
    ctx.strokeRect(x - box / 2, y - 18, box, 36);
    ctx.fillStyle = index === 2 ? "#18230d" : "#c0d1ad";
    ctx.fillText(stage, x, y);
  });
  ctx.fillStyle = "#d9fa76";
  ctx.fillText("forwarding", x0 + spacing * 3, feedbackY + 14);
}

document.querySelectorAll("[data-diagram]").forEach((canvas) => {
  const draw = canvas.dataset.diagram === "array" ? drawArray : drawPipeline;
  watchSize(canvas, () => {
    const surface = canvasContext(canvas);
    if (!surface) return;
    const { ctx, width, height } = surface;
    schematicGrid(ctx, width, height);
    draw(ctx, width, height);
  });
});

const dockLinks = [...document.querySelectorAll(".dock a")];
const sections = dockLinks.map(link => document.querySelector(link.hash));
let navFrame = 0;
let currentSection = 0;

function updateDock() {
  navFrame = 0;
  const readingLine = Math.min(window.innerHeight * .38, 270);
  let next = sections.findLastIndex(section => section.getBoundingClientRect().top <= readingLine);
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5) {
    next = sections.length - 1;
  }
  next = Math.max(0, next);
  if (next === currentSection) return;
  dockLinks[currentSection].removeAttribute("aria-current");
  dockLinks[next].setAttribute("aria-current", "location");
  currentSection = next;
}

function queueDockUpdate() {
  if (!navFrame) navFrame = requestAnimationFrame(updateDock);
}

window.addEventListener("scroll", queueDockUpdate, { passive: true });
window.addEventListener("resize", queueDockUpdate);
queueDockUpdate();

const slides = [...document.querySelectorAll(".gallery-slide")];
const galleryCount = document.querySelector("#gallery-count");
let activeSlide = 0;
document.querySelector(".gallery-controls").hidden = false;
document.querySelectorAll("[data-gallery-step]").forEach(button => {
  button.addEventListener("click", () => {
    slides[activeSlide].hidden = true;
    activeSlide = (activeSlide + Number(button.dataset.galleryStep) + slides.length) % slides.length;
    slides[activeSlide].hidden = false;
    galleryCount.textContent = `${activeSlide + 1} / ${slides.length}`;
  });
});

const waveCanvas = document.querySelector("#waveform");
const inputButton = document.querySelector("[data-lab-input]");
const labStatus = document.querySelector(".lab-status");
const historyLength = 16;
let input = 0;
let output = 0;
let samples = Array.from({ length: 5 }, () => [0, 0, 0]);

function drawWaveform() {
  const surface = canvasContext(waveCanvas);
  if (!surface) return;
  const { ctx, width, height } = surface;
  const frame = 10;
  const step = (width - frame * 2) / historyLength;
  const lane = height / 3;
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#273923";
  for (let column = 0; column <= historyLength; column++) {
    const x = frame + column * step;
    strokePath(ctx, [[x, 0], [x, height]]);
  }
  [1, 2].forEach(row => strokePath(ctx, [[0, lane * row], [width, lane * row]]));
  const colors = ["#7f9f68", "#bfe7a3", "#d9fa76"];
  colors.forEach((color, index) => {
    const low = lane * (index + .69);
    const high = lane * (index + .31);
    const points = [[frame, samples[0][index] ? high : low]];
    let previous = points[0][1];
    samples.forEach((sample, column) => {
      const level = sample[index] ? high : low;
      const x = frame + column * step;
      points.push([x, previous], [x, level]);
      previous = level;
    });
    points.push([width - frame, previous]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    strokePath(ctx, points);
  });
}

function renderLab(message = "") {
  inputButton.textContent = `D = ${input}`;
  inputButton.setAttribute("aria-pressed", String(input === 1));
  labStatus.textContent = `CLK = 0 · D = ${input} · Q = ${output}${message ? ` · ${message}` : ""}`;
  drawWaveform();
}

function recordSamples(...newSamples) {
  samples = [...samples, ...newSamples].slice(-historyLength);
}

inputButton.addEventListener("click", () => {
  input = 1 - input;
  recordSamples([0, input, output]);
  renderLab("Q holds its value");
});

document.querySelector("[data-lab-clock]").addEventListener("click", () => {
  output = input;
  recordSamples([1, input, output], [0, input, output]);
  renderLab("Q captured D on the rising edge");
});

document.querySelector("[data-lab-reset]").addEventListener("click", () => {
  input = 0;
  output = 0;
  samples = Array.from({ length: 5 }, () => [0, 0, 0]);
  renderLab("Reset");
});

document.querySelector(".lab-controls").hidden = false;
watchSize(waveCanvas, drawWaveform);
