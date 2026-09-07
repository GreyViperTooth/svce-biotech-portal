/* Shared header + footer for the single-page site: anchor nav with
   scroll-spy highlighting, theme toggle, and a mobile menu. */
(function () {
  var NAV = [
    { href: '#about', label: 'About' },
    { href: '#faculty', label: 'Faculty' },
    { href: '#facilities', label: 'Facilities' },
    { href: '#curriculum', label: 'Curriculum' },
    { href: '#candidates', label: 'Candidates' },
    { href: '#recruit', label: 'Recruit With Us', cta: true }
  ];

  /* ---- theme (persisted + ?theme= override) ---- */
  var saved = null;
  try { saved = localStorage.getItem('svce-theme'); } catch (e) {}
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  try {
    var qp = new URLSearchParams(location.search).get('theme');
    if (qp === 'light' || qp === 'dark') document.documentElement.setAttribute('data-theme', qp);
  } catch (e) {}
  function themeIcon() {
    var t = document.documentElement.getAttribute('data-theme');
    var dark = t === 'dark' || (!t && window.matchMedia && matchMedia('(prefers-color-scheme:dark)').matches);
    return dark ? '☀️' : '🌙';
  }

  /* ---- header ---- */
  var links = NAV.map(function (n) {
    return '<a href="' + n.href + '"' + (n.cta ? ' class="cta"' : '') + '>' + n.label + '</a>';
  }).join('');

  var header = '' +
    '<header class="nav"><div class="nav-inner wrap">' +
      '<a class="logo" href="#home"><img src="img/brand/svce-wordmark.png" alt="Sri Venkateswara College of Engineering"><span class="logo-dept">Biotechnology</span></a>' +
      '<button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">☰</button>' +
      '<nav class="nav-links">' + links +
        '<button class="theme-btn" aria-label="Toggle light or dark theme">' + themeIcon() + '</button>' +
      '</nav>' +
    '</div></header>';

  /* ---- footer ---- */
  var footLinks = NAV.map(function (n) { return '<a href="' + n.href + '">' + n.label + '</a>'; }).join('');
  var footer = '' +
    '<footer class="site"><div class="wrap">' +
      '<div class="cols">' +
        '<div>' +
          '<div class="fb">Department of Biotechnology</div>' +
          '<p>Sri Venkateswara College of Engineering — a research centre under Anna University, established 2005. Nurturing future-ready biotechnologists for science, society, and industry.</p>' +
        '</div>' +
        '<div><h5>On this page</h5><nav>' + footLinks + '</nav></div>' +
        '<div><h5>Placement Cell</h5><nav>' +
          '<a href="#recruit">Recruit with us</a>' +
          '<a href="mailto:placements@svce.ac.in">placements@svce.ac.in</a>' +
          '<a href="mailto:hodbt@svce.ac.in">hodbt@svce.ac.in</a>' +
          '<a href="mailto:bt@svce.ac.in">bt@svce.ac.in</a>' +
          '<a href="mailto:ganeshprasathk@svce.ac.in">ganeshprasathk@svce.ac.in</a>' +
        '</nav></div>' +
      '</div>' +
      '<div class="base"><span>© ' + new Date().getFullYear() + ' Department of Biotechnology, SVCE.</span>' +
        '<span>Placement Brochure 2026–2027 · Interactive edition</span></div>' +
    '</div></footer>';

  var h = document.getElementById('app-header');
  var f = document.getElementById('app-footer');
  if (h) h.outerHTML = header;
  if (f) f.outerHTML = footer;

  /* ---- mobile menu ---- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.nav-links');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* ---- theme toggle ---- */
  var tbtn = document.querySelector('.theme-btn');
  if (tbtn) {
    tbtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var dark = cur === 'dark' || (!cur && window.matchMedia && matchMedia('(prefers-color-scheme:dark)').matches);
      var next = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('svce-theme', next); } catch (e) {}
      tbtn.textContent = themeIcon();
    });
  }

  /* ---- scroll-spy: highlight the section in view ---- */
  var linkFor = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
    linkFor[a.getAttribute('href').slice(1)] = a;
  });
  var sections = Object.keys(linkFor).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          Object.keys(linkFor).forEach(function (id) { linkFor[id].classList.remove('active'); });
          if (linkFor[e.target.id]) linkFor[e.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }
})();
