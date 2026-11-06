// Show one section at a time based on the URL hash (#experience, #projects, #more).
const sections = ['experience', 'projects', 'more'];
const links = document.querySelectorAll('#nav a');

function show() {
  let id = location.hash.slice(1);
  if (!sections.includes(id)) id = '';

  for (const s of sections) {
    document.getElementById(`s-${s}`).hidden = s !== id;
  }
  for (const a of links) {
    if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

window.addEventListener('hashchange', show);
show();

// Steering wheel: click to spin a full turn (alternating left, then right),
// or press and drag to turn it by hand; on release it springs back.
const wheel = document.getElementById('wheel');
const wheelSvg = wheel.querySelector('svg');

const SPIN = 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)';
const RETURN = 'transform 0.7s cubic-bezier(0.34, 1.4, 0.64, 1)';
const DRAG_THRESHOLD = 5; // px moved before a press counts as a drag

let angle = 0; // resting angle in degrees
let direction = -1; // -1 = left (anticlockwise), 1 = right
let drag = null;
let justDragged = false;

function setRotation(deg, transition) {
  wheelSvg.style.transition = transition;
  wheelSvg.style.transform = `rotate(${deg}deg)`;
}

function pointerAngle(e) {
  const r = wheelSvg.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  return (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
}

function wrap(deg) {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

// Current on-screen angle, including partway through an animation.
function currentAngle() {
  const t = getComputedStyle(wheelSvg).transform;
  if (!t || t === 'none') return angle;
  const m = new DOMMatrixReadOnly(t);
  const visual = (Math.atan2(m.b, m.a) * 180) / Math.PI;
  return angle + wrap(visual - angle);
}

wheel.addEventListener('click', () => {
  if (justDragged) {
    justDragged = false;
    return;
  }
  angle += direction * 360;
  direction = -direction;
  setRotation(angle, SPIN);
});

wheel.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  drag = {
    id: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    lastPointer: pointerAngle(e),
    rotation: currentAngle(),
    active: false,
  };
  wheel.setPointerCapture(e.pointerId);
});

wheel.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;

  if (!drag.active) {
    const moved = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (moved < DRAG_THRESHOLD) return;
    drag.active = true;
    wheel.classList.add('dragging');
  }

  const a = pointerAngle(e);
  drag.rotation += wrap(a - drag.lastPointer);
  drag.lastPointer = a;
  setRotation(drag.rotation, 'none');
});

function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  if (drag.active) {
    // Swallow the click that follows this pointerup, but don't let the flag
    // linger if the browser doesn't fire one (e.g. released off the wheel).
    justDragged = true;
    setTimeout(() => (justDragged = false), 0);
    wheel.classList.remove('dragging');
    setRotation(angle, RETURN);
  }
  drag = null;
}

wheel.addEventListener('pointerup', endDrag);
wheel.addEventListener('pointercancel', endDrag);
