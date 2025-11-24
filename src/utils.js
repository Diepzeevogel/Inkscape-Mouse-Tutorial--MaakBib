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
