// Utility helpers extracted from app.js
export function rectsOverlap(a, b) {
  return !(a.left > b.left + b.width || a.left + a.width < b.left || a.top > b.top + b.height || a.top + a.height < b.top);
}

export async function findGroupFragments(url, identifiers) {
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const results = {};
  // Collect root-level <defs> and <style> so fragments keep their styling
  const rootStyleDefs = Array.from(doc.querySelectorAll('defs, style')).map(n => n.outerHTML).join('');
  for (const id of identifiers) {
    const el = doc.getElementById(id);
    if (el) results[id] = rootStyleDefs + el.outerHTML;
  }
  const groups = Array.from(doc.getElementsByTagName('g'));
  for (const g of groups) {
    const label = g.getAttribute('inkscape:label') || '';
    const titleEl = g.querySelector('title');
    const title = titleEl ? titleEl.textContent || '' : '';
    for (const id of identifiers) {
      if (results[id]) continue;
      const low = id.toLowerCase();
      if ((label && label.toLowerCase().includes(low)) || (title && title.toLowerCase().includes(low))) {
        results[id] = rootStyleDefs + g.outerHTML;
      }
    }
  }
  return results;
}

export function makeFabricGroupFromFragment(svgFragment) {
  return new Promise((resolve) => {
    // Wrap fragment in a minimal SVG root for Fabric.js compatibility
    const wrapped = `<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:inkscape=\"http://www.inkscape.org/namespaces/inkscape\">${svgFragment}</svg>`;
    fabric.loadSVGFromString(wrapped, (objs, opts) => {
      if (!objs || objs.length === 0) return resolve(null);
      const g = fabric.util.groupSVGElements(objs, opts);
      resolve(g);
    });
  });
}

// -------------------------
// Lesson progress via cookies
// -------------------------
// Store completed lessons as a JSON array in a cookie named 'lessons_completed'.
export function _setCookie(name, value, days = 365) {
  try {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  } catch (e) { console.warn('[utils] setCookie failed', e); }
}

export function _getCookie(name) {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  } catch (e) { console.warn('[utils] getCookie failed', e); return null; }
}

export function getCompletedLessons() {
  try {
    const raw = _getCookie('lessons_completed');
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(n => parseInt(n, 10)).filter(n => !isNaN(n));
  } catch (e) { return []; }
}

export function saveCompletedLessons(list) {
  try {
    const uniq = Array.from(new Set(list.map(n => parseInt(n, 10)).filter(n => !isNaN(n))));
    _setCookie('lessons_completed', JSON.stringify(uniq));
  } catch (e) { console.warn('[utils] saveCompletedLessons failed', e); }
}

export function markLessonCompleted(lessonNumber) {
  try {
    const list = getCompletedLessons();
    if (!list.includes(lessonNumber)) {
      list.push(lessonNumber);
      saveCompletedLessons(list);
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('lessons:updated', { detail: { lesson: lessonNumber } }));
        }
      } catch (e) { /* ignore dispatch failures */ }
    }
  } catch (e) { console.warn('[utils] markLessonCompleted failed', e); }
}

export function clearLessonProgress() {
  try { _setCookie('lessons_completed', JSON.stringify([])); } catch (e) {}
}
