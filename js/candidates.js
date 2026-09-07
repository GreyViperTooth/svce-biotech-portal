/* Candidate Directory — search + faceted filtering.
   Renders the filter rail from FACETS and the results grid from
   CANDIDATES. With no data it shows the empty state; the moment
   data/candidates.js is populated, everything just works. */
(function () {
  var CANDIDATES = window.CANDIDATES || [];
  var FACETS = window.FACETS || {};

  var state = { q: '', program: new Set(), labType: new Set(), foi: new Set(), skill: new Set() };

  var els = {
    search: document.getElementById('search'),
    clear: document.getElementById('clearSearch'),
    rail: document.getElementById('filters'),
    results: document.getElementById('results'),
    count: document.getElementById('rcount'),
    query: document.getElementById('rquery')
  };

  var initials = function (name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };

  /* ---------- build filter rail ---------- */
  function pillGroup(title, key, values) {
    var pills = values.map(function (v) {
      return '<button class="pill-opt" role="button" aria-pressed="false" data-key="' + key + '" data-val="' + esc(v) + '">' + esc(v) + '</button>';
    }).join('');
    return '<div class="fgroup"><h4>' + title + '</h4><div class="pillrow">' + pills + '</div></div>';
  }
  function checkGroup(title, key, values) {
    var opts = values.map(function (v) {
      return '<label class="opt"><input type="checkbox" data-key="' + key + '" data-val="' + esc(v) + '"> ' + esc(v) + '</label>';
    }).join('');
    return '<div class="fgroup"><h4>' + title + '</h4>' + opts + '</div>';
  }

  function scrollToSection() {
    var el = document.getElementById('candidates');
    if (!el) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function renderRail() {
    els.rail.innerHTML =
      '<div class="fhead"><h3>Filters</h3><button class="reset" id="resetFilters">Reset</button></div>' +
      pillGroup('Program', 'program', FACETS.program || []) +
      checkGroup('Field of interest', 'foi', FACETS.fieldsOfInterest || []) +
      checkGroup('Skill area', 'skill', FACETS.skillAreas || []);

    els.rail.querySelectorAll('.pill-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        var set = state[b.dataset.key];
        if (set.has(b.dataset.val)) { set.delete(b.dataset.val); b.setAttribute('aria-pressed', 'false'); }
        else { set.add(b.dataset.val); b.setAttribute('aria-pressed', 'true'); }
        render(); scrollToSection();
      });
    });
    els.rail.querySelectorAll('input[type=checkbox]').forEach(function (c) {
      c.addEventListener('change', function () {
        var set = state[c.dataset.key];
        if (c.checked) set.add(c.dataset.val); else set.delete(c.dataset.val);
        render(); scrollToSection();
      });
    });
    document.getElementById('resetFilters').addEventListener('click', resetAll);
  }

  function resetAll() {
    state.program.clear(); state.labType.clear(); state.foi.clear(); state.skill.clear();
    els.rail.querySelectorAll('.pill-opt').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    els.rail.querySelectorAll('input[type=checkbox]').forEach(function (c) { c.checked = false; });
    render(); scrollToSection();
  }

  /* ---------- filtering ---------- */
  var hasAll = function (set, arr) {
    if (!set.size) return true;
    arr = arr || [];
    for (var v of set) if (arr.indexOf(v) === -1) return false;
    return true;
  };

  function scored() {
    var terms = state.q.toLowerCase().split(/[\s,]+/).filter(Boolean);
    return CANDIDATES.map(function (c) {
      var hay = (c.name + ' ' + (c.skills || []).join(' ') + ' ' + (c.fieldsOfInterest || []).join(' ')).toLowerCase();
      var hits = terms.filter(function (t) { return hay.indexOf(t) !== -1; }).length;
      return { c: c, hits: hits, ok: (!terms.length || hits > 0) };
    }).filter(function (r) {
      var c = r.c;
      return r.ok &&
        (!state.program.size || state.program.has(c.program)) &&
        hasAll(state.labType, c.labType) &&
        hasAll(state.foi, c.fieldsOfInterest) &&
        hasAll(state.skill, c.skillAreas);
    });
  }

  function cardHTML(r) {
    var c = r.c, terms = state.q.toLowerCase().split(/[\s,]+/).filter(Boolean);
    var foiList = (c.fieldsDisplay && c.fieldsDisplay.length) ? c.fieldsDisplay : (c.fieldsOfInterest || []);
    var foi = foiList.map(function (f) { return '<span class="b">' + esc(f) + '</span>'; }).join('');
    var sk = (c.skills || []).slice(0, 5).map(function (s) {
      var hit = terms.some(function (t) { return s.toLowerCase().indexOf(t) !== -1; });
      return '<span class="b' + (hit ? ' hit' : '') + '">' + esc(s) + '</span>';
    }).join('');
    var resume = c.resumeUrl ? '<a href="' + esc(c.resumeUrl) + '" target="_blank" rel="noopener">View résumé →</a>' : '';
    var badge = (c.program && c.program.indexOf('M.Tech') !== -1) ? ' <span class="prog-badge">M.Tech</span>' : '';
    return '<article class="candidate">' +
      '<div class="ph">' + (c.photo ? '<img src="' + esc(c.photo) + '" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">' : initials(c.name)) + '</div>' +
      '<div class="info"><div class="nm">' + esc(c.name) + badge + '</div>' +
      (c.email ? '<div class="em">' + esc(c.email) + '</div>' : '') +
      '<div class="foi">' + foi + '</div>' +
      (sk ? '<div class="sk">' + sk + '</div>' : '') +
      (resume ? '<div class="foot">' + resume + '</div>' : '') +
      '</div></article>';
  }

  function render() {
    var rows = scored();
    var q = state.q.toLowerCase();
    var pin = q.indexOf('clinic') !== -1;   // priority ordering
    var prog = function (c) { return (c.program && c.program.indexOf('M.Tech') !== -1) ? 1 : 0; }; // B.Tech before M.Tech
    rows.sort(function (a, b) {
      if (pin) {
        var ap = a.c.name === 'Neha Ramganesh' ? 1 : 0, bp = b.c.name === 'Neha Ramganesh' ? 1 : 0;
        if (ap !== bp) return bp - ap;
      }
      return (b.hits - a.hits) || (prog(a.c) - prog(b.c)) || a.c.name.localeCompare(b.c.name);
    });

    els.count.textContent = rows.length + (rows.length === 1 ? ' candidate' : ' candidates');
    els.query.textContent = state.q ? 'matching “' + state.q + '”' : (activeFilterCount() ? 'matching your filters' : 'in the cohort');

    if (!CANDIDATES.length) { els.results.innerHTML = emptyStateHTML(true); return; }
    if (!rows.length) { els.results.innerHTML = emptyStateHTML(false); return; }
    els.results.innerHTML = '<div class="cgrid">' + rows.map(cardHTML).join('') + '</div>';
  }

  function activeFilterCount() {
    return state.program.size + state.labType.size + state.foi.size + state.skill.size;
  }

  function emptyStateHTML(noData) {
    if (noData) {
      var skel = '';
      for (var i = 0; i < 4; i++) {
        skel += '<div class="skel"><div class="sc shimmer"></div><div class="sl">' +
          '<div class="shimmer l1"></div><div class="shimmer l2"></div><div class="shimmer l3"></div></div></div>';
      }
      return '<div class="empty"><div class="ei">🧬</div>' +
        '<h3>Candidate profiles are being finalized</h3>' +
        '<p>The 2026–2027 cohort will be published here — searchable by skill and filterable by field, program, and lab type. The directory below is ready the moment profiles go live.</p>' +
        '</div><div class="skeletons">' + skel + '</div>';
    }
    return '<div class="empty"><div class="ei">🔍</div><h3>No candidates match yet</h3>' +
      '<p>Try removing a filter or broadening your search.</p></div>';
  }

  /* ---------- wire up ---------- */
  renderRail();
  var t;
  els.search.addEventListener('input', function () {
    clearTimeout(t);
    t = setTimeout(function () { state.q = els.search.value.trim(); render(); }, 120);
  });
  els.clear.addEventListener('click', function () { els.search.value = ''; state.q = ''; render(); els.search.focus(); });
  render();
})();
