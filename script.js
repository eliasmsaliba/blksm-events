document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());

// Nav scroll state
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

// Cursor glow (desktop only)
const glow = document.getElementById('cursorGlow');
if (glow) {
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', e => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
    });
  } else {
    glow.style.display = 'none';
  }
}

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
function observeReveals() {
  document.querySelectorAll('.reveal-up:not(.in-view)').forEach(el => observer.observe(el));
}
observeReveals();

// Department accordion
document.querySelectorAll('.dept-head').forEach(head => {
  head.addEventListener('click', () => {
    const dept = head.parentElement;
    const isOpen = dept.getAttribute('data-open') === 'true';
    document.querySelectorAll('.dept').forEach(d => {
      d.setAttribute('data-open', 'false');
      d.querySelector('.dept-body').style.maxHeight = null;
    });
    if (!isOpen) {
      dept.setAttribute('data-open', 'true');
      const body = dept.querySelector('.dept-body');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
});
window.addEventListener('load', () => {
  const first = document.querySelector('.dept[data-open="true"] .dept-body');
  if (first) first.style.maxHeight = first.scrollHeight + 'px';
});

// Alternating brand gradient pairs for cards without a custom image
const GRADIENT_PAIRS = [
  ['var(--magenta)', 'var(--cyan)'],
  ['var(--cyan)', 'var(--magenta)']
];

async function loadJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load ' + path);
  return res.json();
}

/* ===================== HOME PAGE TEXT (index.html) ===================== */
const homeKeyEls = document.querySelectorAll('[data-key]');
if (homeKeyEls.length && document.body.contains(document.getElementById('top'))) {
  loadJSON('content/home.json').then(data => {
    homeKeyEls.forEach(el => {
      const key = el.dataset.key;
      if (data[key] !== undefined) el.textContent = data[key];
    });
  }).catch(() => {});
}

/* ===================== TEAM GRID (team.html) ===================== */
const teamGrid = document.getElementById('teamGrid');
if (teamGrid) {
  loadJSON('content/team.json').then(data => {
    teamGrid.innerHTML = data.members.map((m, i) => {
      const [c1, c2] = GRADIENT_PAIRS[i % GRADIENT_PAIRS.length];
      const initials = m.name.split(' ').map(w => w[0]).slice(0, 2).join('');
      return `
      <a class="team-card reveal-up" href="team-member.html?id=${m.id}">
        <div class="team-photo" style="--c1:${c1};--c2:${c2}">
          ${m.photo ? `<img src="${m.photo}" alt="${m.name}">` : `<span>${initials}</span>`}
        </div>
        <h3>${m.name}</h3>
        <p class="team-role">${m.role}</p>
        <p class="team-bio">${m.bio}</p>
      </a>`;
    }).join('');
    observeReveals();
  }).catch(() => {
    teamGrid.innerHTML = '<p style="color:var(--muted)">Unable to load team members right now.</p>';
  });
}

/* ===================== MEMBER DETAIL (team-member.html) ===================== */
const memberHero = document.getElementById('memberHero');
const memberDetail = document.getElementById('memberDetail');
if (memberHero && memberDetail) {
  loadJSON('content/team.json').then(data => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const idx = Math.max(0, data.members.findIndex(m => m.id === id));
    const member = data.members.find(m => m.id === id) || data.members[0];
    const [c1, c2] = GRADIENT_PAIRS[idx % GRADIENT_PAIRS.length];
    const initials = member.name.split(' ').map(w => w[0]).slice(0, 2).join('');

    document.title = member.name + ' — BLKSM Events';

    memberHero.innerHTML = `
      <div class="member-card-hero">
        <div class="member-avatar" style="--c1:${c1};--c2:${c2}">
          ${member.photo ? `<img src="${member.photo}" alt="${member.name}">` : `<span>${initials}</span>`}
        </div>
        <div class="member-meta">
          <p class="eyebrow">${member.department}</p>
          <h1>${member.name}</h1>
          <p class="team-role">${member.role}</p>
        </div>
      </div>
    `;

    const paragraphs = member.details.split('\n\n').map(p => `<p>${p}</p>`).join('');

    memberDetail.innerHTML = `
      <div class="detail-body">
        ${paragraphs}
        <div class="detail-tags">
          <span class="tag">${member.department}</span>
          <span class="tag">${member.email}</span>
          ${member.phone ? `<span class="tag">${member.phone}</span>` : ''}
        </div>
        <a href="mailto:${member.email}" class="btn btn-primary">Email ${member.name.split(' ')[0]}</a>
      </div>
    `;
  }).catch(() => {
    memberDetail.innerHTML = '<p style="color:var(--muted)">Unable to load this team member right now.</p>';
  });
}

/* ===================== PORTFOLIO GRID (portfolio.html) ===================== */
const portfolioGrid = document.getElementById('portfolioGrid');
if (portfolioGrid) {
  loadJSON('content/portfolio.json').then(data => {
    portfolioGrid.innerHTML = data.projects.map((p, i) => {
      const [g1, g2] = GRADIENT_PAIRS[i % GRADIENT_PAIRS.length];
      const mediaStyle = p.image
        ? `background-image:url('${p.image}');background-size:cover;background-position:center`
        : `--g1:${g1};--g2:${g2}`;
      return `
      <a class="portfolio-card reveal-up" data-cat="${p.category}" href="portfolio-detail.html?id=${p.id}">
        <div class="portfolio-media" style="${mediaStyle}"><span class="portfolio-cat">${p.categoryLabel}</span></div>
        <h3>${p.title}</h3>
        <p>${p.summary}</p>
      </a>`;
    }).join('');
    observeReveals();

    // Portfolio filter (bound after render)
    const filterRowEl = document.querySelector('.filter-row');
    if (filterRowEl) {
      filterRowEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn || !btn.dataset.filter) return;
        filterRowEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        document.querySelectorAll('.portfolio-card').forEach(card => {
          const match = filter === 'all' || card.dataset.cat === filter;
          card.classList.toggle('hidden', !match);
        });
      });
    }
  }).catch(() => {
    portfolioGrid.innerHTML = '<p style="color:var(--muted)">Unable to load portfolio projects right now.</p>';
  });
}

/* ===================== PROJECT DETAIL (portfolio-detail.html) ===================== */
const projectHero = document.getElementById('projectHero');
const projectDetail = document.getElementById('projectDetail');
if (projectHero && projectDetail) {
  loadJSON('content/portfolio.json').then(data => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const idx = Math.max(0, data.projects.findIndex(p => p.id === id));
    const project = data.projects.find(p => p.id === id) || data.projects[0];
    const [g1, g2] = GRADIENT_PAIRS[idx % GRADIENT_PAIRS.length];

    document.title = project.title + ' — BLKSM Events';

    const heroMedia = project.image
      ? `background-image:url('${project.image}');background-size:cover;background-position:center`
      : `--c1:${g1};--c2:${g2}`;

    projectHero.innerHTML = `
      <div class="member-card-hero">
        <div class="member-avatar project-avatar" style="${heroMedia}"></div>
        <div class="member-meta">
          <p class="eyebrow">${project.categoryLabel}</p>
          <h1>${project.title}</h1>
          ${project.nextEvent ? `<p class="team-role">Next Event: ${project.nextEvent}</p>` : ''}
        </div>
      </div>
    `;

    const gallery = Array.isArray(project.gallery) ? project.gallery.filter(Boolean) : [];
    const galleryHTML = gallery.length
      ? `<div class="project-gallery">${gallery.map(src => `<div class="project-gallery-item"><img src="${src}" alt="${project.title}"></div>`).join('')}</div>`
      : '';

    projectDetail.innerHTML = `
      <div class="detail-body">
        <p>${project.details || project.summary}</p>
        ${galleryHTML}
        <div class="detail-tags">
          <span class="tag">${project.categoryLabel}</span>
          ${project.nextEvent ? `<span class="tag">Next: ${project.nextEvent}</span>` : ''}
        </div>
        <a href="index.html#contact" class="btn btn-primary">Enquire About a Similar Event</a>
      </div>
    `;
  }).catch(() => {
    projectDetail.innerHTML = '<p style="color:var(--muted)">Unable to load this project right now.</p>';
  });
}

/* ===================== EVENTS CALENDAR (events.html) ===================== */
const eventsList = document.getElementById('eventsList');
if (eventsList) {
  loadJSON('content/events.json').then(data => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const events = (data.events || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));

    function renderEvents(filter) {
      const filtered = events.filter(ev => {
        const evDate = new Date(ev.date);
        const isPast = evDate < today;
        if (filter === 'upcoming') return !isPast;
        if (filter === 'past') return isPast;
        return true;
      });

      if (!filtered.length) {
        eventsList.innerHTML = `<p style="color:var(--muted)">No ${filter === 'all' ? '' : filter} events to show right now.</p>`;
        return;
      }

      eventsList.innerHTML = filtered.map(ev => {
        const evDate = new Date(ev.date);
        const isPast = evDate < today;
        const dateLabel = evDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
        return `
        <div class="event-card reveal-up ${isPast ? 'is-past' : ''}">
          <div class="event-date">
            <span class="event-day">${evDate.getDate()}</span>
            <span class="event-month">${evDate.toLocaleDateString('en-ZA', { month: 'short' })}</span>
          </div>
          <div class="event-body">
            <span class="event-status">${isPast ? 'Past' : 'Upcoming'}${ev.categoryLabel ? ' · ' + ev.categoryLabel : ''}</span>
            <h3>${ev.title}</h3>
            <p class="event-meta">${dateLabel}${ev.time ? ' · ' + ev.time : ''}${ev.venue ? ' · ' + ev.venue : ''}${ev.city ? ', ' + ev.city : ''}</p>
            <p class="event-desc">${ev.description || ''}</p>
            ${ev.ticketLink ? `<a href="${ev.ticketLink}" class="btn btn-ghost" target="_blank" rel="noopener">Event Details</a>` : ''}
          </div>
        </div>`;
      }).join('');
      observeReveals();
    }

    renderEvents('upcoming');

    const filterRow = document.querySelector('.filter-row');
    if (filterRow) {
      filterRow.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn || !btn.dataset.eventsFilter) return;
        filterRow.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderEvents(btn.dataset.eventsFilter);
      });
    }
  }).catch(() => {
    eventsList.innerHTML = '<p style="color:var(--muted)">Unable to load events right now.</p>';
  });
}
