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
  // Event delegation, since nav links are rendered dynamically from the CMS.
  navLinks.addEventListener('click', (e) => {
    if (e.target.closest('a')) navLinks.classList.remove('open');
  });
}

// Render the global nav menu from the CMS (content/menu.json) on every page.
if (navLinks) {
  loadJSON('content/menu.json').then(data => {
    const items = data.items || [];
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    const isCurrent = (href) => {
      if (!href) return false;
      const linkPath = href.split('#')[0].split('?')[0];
      return linkPath && linkPath === currentPath;
    };

    navLinks.innerHTML = items.map(item => {
      const children = Array.isArray(item.children) ? item.children : [];
      const hasChildren = children.length > 0;
      const isActive = isCurrent(item.href) || children.some(c => isCurrent(c.href));
      const classes = [item.isButton ? 'nav-cta' : '', isActive ? 'active' : ''].filter(Boolean).join(' ');
      const href = item.href || '#';

      if (!hasChildren) {
        return `<li><a href="${href}"${classes ? ` class="${classes}"` : ''}>${item.label}</a></li>`;
      }

      return `
        <li class="has-submenu">
          <a href="${href}"${classes ? ` class="${classes}"` : ''}>${item.label}</a>
          <button class="submenu-toggle" type="button" aria-label="Toggle submenu">&#9662;</button>
          <ul class="submenu">
            ${children.map(c => `<li><a href="${c.href}"${isCurrent(c.href) ? ' class="active"' : ''}>${c.label}</a></li>`).join('')}
          </ul>
        </li>`;
    }).join('');

    // Tapping the caret toggles the submenu instead of navigating.
    navLinks.querySelectorAll('.submenu-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.closest('.has-submenu').classList.toggle('open');
      });
    });

    // A parent link with no real href (just "#") toggles the submenu rather than jumping to top.
    navLinks.querySelectorAll('.has-submenu > a[href="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        a.closest('.has-submenu').classList.toggle('open');
      });
    });
  }).catch(() => {
    navLinks.innerHTML = '<li><a href="index.html">Home</a></li>';
  });
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
        <a class="event-card reveal-up ${isPast ? 'is-past' : ''}" href="event-detail.html?id=${ev.id}">
          <div class="event-date">
            <span class="event-day">${evDate.getDate()}</span>
            <span class="event-month">${evDate.toLocaleDateString('en-ZA', { month: 'short' })}</span>
          </div>
          <div class="event-body">
            <span class="event-status">${isPast ? 'Past' : 'Upcoming'}${ev.categoryLabel ? ' · ' + ev.categoryLabel : ''}</span>
            <h3>${ev.title}</h3>
            <p class="event-meta">${dateLabel}${ev.time ? ' · ' + ev.time : ''}${ev.venue ? ' · ' + ev.venue : ''}${ev.city ? ', ' + ev.city : ''}</p>
            <p class="event-desc">${ev.description || ''}</p>
            ${ev.registrationEnabled && !isPast ? `<span class="tag">Registration Open</span>` : ''}
          </div>
        </a>`;
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

/* ===================== EVENT DETAIL (event-detail.html) ===================== */
const eventHero = document.getElementById('eventHero');
const eventDetail = document.getElementById('eventDetail');
if (eventHero && eventDetail) {
  loadJSON('content/events.json').then(data => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const events = data.events || [];
    const idx = Math.max(0, events.findIndex(ev => ev.id === id));
    const ev = events.find(e => e.id === id) || events[0];
    const [c1, c2] = GRADIENT_PAIRS[idx % GRADIENT_PAIRS.length];

    document.title = ev.title + ' — BLKSM Events';

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const evDate = new Date(ev.date);
    const isPast = evDate < today;
    const dateLabel = evDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

    const heroMedia = ev.image
      ? `background-image:url('${ev.image}');background-size:cover;background-position:center`
      : `--c1:${c1};--c2:${c2}`;

    eventHero.innerHTML = `
      <div class="member-card-hero">
        <div class="member-avatar project-avatar" style="${heroMedia}"></div>
        <div class="member-meta">
          <p class="eyebrow">${isPast ? 'Past Event' : 'Upcoming Event'}${ev.categoryLabel ? ' · ' + ev.categoryLabel : ''}</p>
          <h1>${ev.title}</h1>
          <p class="team-role">${dateLabel}${ev.time ? ' · ' + ev.time : ''}${ev.venue ? ' · ' + ev.venue : ''}${ev.city ? ', ' + ev.city : ''}</p>
        </div>
      </div>
    `;

    const gallery = Array.isArray(ev.gallery) ? ev.gallery.filter(Boolean) : [];
    const galleryHTML = gallery.length
      ? `<div class="project-gallery">${gallery.map(src => `<div class="project-gallery-item"><img src="${src}" alt="${ev.title}"></div>`).join('')}</div>`
      : '';

    eventDetail.innerHTML = `
      <div class="detail-body">
        <p>${ev.description || ''}</p>
        ${galleryHTML}
        <div class="detail-tags">
          ${ev.categoryLabel ? `<span class="tag">${ev.categoryLabel}</span>` : ''}
          <span class="tag">${dateLabel}</span>
          ${ev.venue ? `<span class="tag">${ev.venue}${ev.city ? ', ' + ev.city : ''}</span>` : ''}
        </div>
        ${ev.ticketLink ? `<a href="${ev.ticketLink}" class="btn btn-primary" target="_blank" rel="noopener">Tickets / More Info</a>` : ''}
      </div>
    `;

    renderRegistrationForm(ev);
  }).catch(() => {
    eventDetail.innerHTML = '<p style="color:var(--muted)">Unable to load this event right now.</p>';
  });
}

function slugifyFieldLabel(label, usedNames) {
  let base = label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'field';
  let name = base;
  let i = 2;
  while (usedNames.has(name)) { name = `${base}-${i}`; i++; }
  usedNames.add(name);
  return name;
}

function renderRegistrationForm(ev) {
  const section = document.getElementById('registrationSection');
  const host = document.getElementById('registrationFormHost');
  if (!section || !host) return;

  if (!ev.registrationEnabled) {
    section.hidden = true;
    return;
  }

  const templateId = (ev.registrationTemplate || '').trim();
  if (templateId) {
    loadJSON('content/form-templates.json').then(data => {
      const template = (data.templates || []).find(t => t.id === templateId);
      renderRegistrationFormWithFields(ev, template ? template.fields : []);
    }).catch(() => {
      renderRegistrationFormWithFields(ev, ev.registrationFields || []);
    });
  } else {
    renderRegistrationFormWithFields(ev, ev.registrationFields || []);
  }
}

function renderRegistrationFormWithFields(ev, fields) {
  const section = document.getElementById('registrationSection');
  const host = document.getElementById('registrationFormHost');
  const title = document.getElementById('registrationTitle');
  if (!section || !host) return;

  if (!Array.isArray(fields) || !fields.length) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  if (title) title.textContent = ev.registrationButtonLabel ? `${ev.registrationButtonLabel.replace(/now$/i, '').trim() || 'Register'} for ${ev.title}` : `Register for ${ev.title}`;

  const usedNames = new Set();
  const fieldEntries = fields.map(f => {
    const name = slugifyFieldLabel(f.label || 'field', usedNames);
    const required = f.required !== false;
    const reqAttr = required ? 'required' : '';
    const opts = (f.options || '').split('\n').map(o => o.trim()).filter(Boolean);
    const width = f.width === 'half' ? 'half' : 'full';

    const html = (() => {
    if (f.type === 'radio') {
      return `<fieldset class="field field-group">
        <legend>${f.label}${required ? '' : ' (optional)'}</legend>
        ${opts.map((o, i) => `
          <label class="option-row">
            <input type="radio" name="${name}" value="${o}" ${i === 0 ? reqAttr : ''}> ${o}
          </label>`).join('')}
      </fieldset>`;
    }

    if (f.type === 'checkbox') {
      if (!opts.length) {
        return `<div class="field field-group">
          <label class="option-row">
            <input type="checkbox" id="rf-${name}" name="${name}" value="yes" ${reqAttr}> ${f.label}
          </label>
        </div>`;
      }
      return `<fieldset class="field field-group">
        <legend>${f.label}${required ? '' : ' (optional)'}</legend>
        ${opts.map(o => `
          <label class="option-row">
            <input type="checkbox" name="${name}" value="${o}"> ${o}
          </label>`).join('')}
      </fieldset>`;
    }

    let control;
    if (f.type === 'textarea') {
      control = `<textarea id="rf-${name}" name="${name}" rows="4" ${reqAttr}></textarea>`;
    } else if (f.type === 'select') {
      control = `<select id="rf-${name}" name="${name}" ${reqAttr}>
        <option value="" disabled selected>Select an option</option>
        ${opts.map(o => `<option value="${o}">${o}</option>`).join('')}
      </select>`;
    } else if (f.type === 'file') {
      control = `<input type="file" id="rf-${name}" name="${name}" ${f.multiple ? 'multiple' : ''} ${reqAttr}>`;
    } else {
      const type = ['email', 'tel', 'number', 'date'].includes(f.type) ? f.type : 'text';
      control = `<input type="${type}" id="rf-${name}" name="${name}" ${reqAttr}>`;
    }
    return `<div class="field"><label for="rf-${name}">${f.label}${required ? '' : ' (optional)'}</label>${control}</div>`;
    })();

    return { width, html, name, label: f.label, type: f.type };
  });

  // Pair up consecutive half-width fields into a side-by-side row.
  let fieldsHTML = '';
  for (let i = 0; i < fieldEntries.length; i++) {
    const cur = fieldEntries[i];
    const next = fieldEntries[i + 1];
    if (cur.width === 'half' && next && next.width === 'half') {
      fieldsHTML += `<div class="form-row">${cur.html}${next.html}</div>`;
      i++;
    } else {
      fieldsHTML += cur.html;
    }
  }

  host.innerHTML = `
    <form class="contact-form" id="registrationForm" enctype="multipart/form-data">
      <input type="hidden" name="form-name" value="event-registration">
      <input type="hidden" name="event" value="${ev.title}">
      <p style="display:none"><label>Don't fill this out: <input name="bot-field"></label></p>
      ${fieldsHTML}
      <button type="submit" class="btn btn-primary btn-lg">${ev.registrationButtonLabel || 'Register Now'}</button>
      <p class="form-status" id="registrationStatus" style="display:none"></p>
    </form>
  `;

  const form = document.getElementById('registrationForm');
  const status = document.getElementById('registrationStatus');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    // Netlify Forms only reliably captures fields it saw in the static stub
    // form at build time. Since each event asks different custom questions,
    // we can't rely on those custom field names reaching Netlify directly —
    // instead, consolidate every answer into the stub's fixed "responses"
    // field, map any uploaded files into the generic file1–file5 slots, and
    // best-effort-fill name/email/phone so the dashboard/email still show
    // something recognizable at a glance.
    // Netlify Forms limit: 10 MB per file, 20 MB total across all files.
    const MAX_FILE = 10 * 1024 * 1024;
    const MAX_TOTAL = 20 * 1024 * 1024;
    let totalSize = 0;
    let oversizeFile = null;
    form.querySelectorAll('input[type="file"]').forEach(inp => {
      Array.from(inp.files).forEach(f => {
        totalSize += f.size;
        if (f.size > MAX_FILE && !oversizeFile) oversizeFile = f.name;
      });
    });
    if (oversizeFile || totalSize > MAX_TOTAL) {
      status.style.display = 'block';
      status.textContent = oversizeFile
        ? `"${oversizeFile}" is larger than the 10 MB limit. Please use a smaller file and try again.`
        : `Total upload size exceeds 20 MB. Please reduce the number or size of files and try again.`;
      submitBtn.disabled = false;
      submitBtn.textContent = ev.registrationButtonLabel || 'Register Now';
      return;
    }

    const payload = new FormData();
    payload.append('form-name', 'event-registration');
    payload.append('event', ev.title);
    const honeypot = form.querySelector('[name="bot-field"]');
    payload.append('bot-field', honeypot ? honeypot.value : '');

    let responses = '';
    let fileSlot = 1;
    let detectedName = '', detectedEmail = '', detectedPhone = '';

    fieldEntries.forEach(entry => {
      const { name, label, type } = entry;

      if (type === 'file') {
        const input = form.querySelector(`[name="${name}"]`);
        const files = input ? Array.from(input.files) : [];
        if (files.length) {
          responses += `${label}: ${files.map(f => f.name).join(', ')}\n`;
          files.forEach(file => {
            if (fileSlot <= 5) {
              payload.append(`file${fileSlot}`, file, file.name);
              fileSlot++;
            }
          });
        }
        return;
      }

      if (type === 'radio') {
        const checked = form.querySelector(`[name="${name}"]:checked`);
        responses += `${label}: ${checked ? checked.value : ''}\n`;
        return;
      }

      if (type === 'checkbox') {
        const allBoxes = form.querySelectorAll(`[name="${name}"]`);
        const checked = Array.from(form.querySelectorAll(`[name="${name}"]:checked`));
        if (allBoxes.length === 1) {
          // Single yes/no consent checkbox.
          responses += `${label}: ${checked.length ? 'Yes' : 'No'}\n`;
        } else {
          // Checkbox group (pick any number).
          responses += `${label}: ${checked.map(b => b.value).join(', ') || '(none selected)'}\n`;
        }
        return;
      }

      const input = form.querySelector(`[name="${name}"]`);
      const value = input ? input.value : '';
      responses += `${label}: ${value}\n`;

      if (type === 'email' && !detectedEmail) detectedEmail = value;
      if (type === 'tel' && !detectedPhone) detectedPhone = value;
      if (type === 'text' && !detectedName && /name/i.test(label)) detectedName = value;
    });

    payload.append('name', detectedName);
    payload.append('email', detectedEmail);
    payload.append('phone', detectedPhone);
    payload.append('responses', responses.trim());

    fetch('/', {
      method: 'POST',
      body: payload,
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        host.innerHTML = `<p class="form-success">Thanks — you're registered for <strong>${ev.title}</strong>. We've got your details and will be in touch if anything changes.</p>`;
      })
      .catch(err => {
        const isOversize = err && /413/.test(err.message);
        status.style.display = 'block';
        status.textContent = isOversize
          ? 'Your files are too large to upload (max 10 MB per file, 20 MB total). Please reduce file sizes and try again.'
          : 'Something went wrong submitting the form. Please try again or contact us directly at hello@blksm.events.';
        submitBtn.disabled = false;
        submitBtn.textContent = ev.registrationButtonLabel || 'Register Now';
      });
  });
}

/* ===================== CUSTOM PAGE GRID (custom-page.html) ===================== */
const customPageHero = document.getElementById('customPageHero');
const customPageGrid = document.getElementById('customPageGrid');
if (customPageHero && customPageGrid) {
  const slug = new URLSearchParams(window.location.search).get('slug');
  loadJSON('content/pages.json').then(data => {
    const page = (data.pages || []).find(p => p.slug === slug);
    if (!page) {
      customPageHero.innerHTML = `<p class="eyebrow">Page Not Found</p><h1 class="hero-title page-title">UNKNOWN PAGE</h1>`;
      customPageGrid.innerHTML = '';
      return;
    }

    document.title = page.title + ' — BLKSM Events';

    customPageHero.innerHTML = `
      ${page.eyebrow ? `<p class="eyebrow reveal">${page.eyebrow}</p>` : ''}
      <h1 class="hero-title page-title reveal">${page.title}</h1>
      ${page.intro ? `<p class="hero-sub reveal">${page.intro}</p>` : ''}
    `;

    const items = page.items || [];
    customPageGrid.innerHTML = items.map((item, i) => {
      const [g1, g2] = GRADIENT_PAIRS[i % GRADIENT_PAIRS.length];
      const mediaStyle = item.image
        ? `background-image:url('${item.image}');background-size:cover;background-position:center`
        : `--g1:${g1};--g2:${g2}`;
      return `
      <a class="portfolio-card reveal-up" href="custom-page-detail.html?slug=${page.slug}&id=${item.id}">
        <div class="portfolio-media" style="${mediaStyle}"></div>
        <h3>${item.title}</h3>
        <p>${item.summary || ''}</p>
      </a>`;
    }).join('');
    observeReveals();
  }).catch(() => {
    customPageGrid.innerHTML = '<p style="color:var(--muted)">Unable to load this page right now.</p>';
  });
}

/* ===================== CUSTOM PAGE ITEM DETAIL (custom-page-detail.html) ===================== */
const customItemHero = document.getElementById('customItemHero');
const customItemDetail = document.getElementById('customItemDetail');
if (customItemHero && customItemDetail) {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const id = params.get('id');

  loadJSON('content/pages.json').then(data => {
    const page = (data.pages || []).find(p => p.slug === slug);
    const items = page ? (page.items || []) : [];
    const idx = Math.max(0, items.findIndex(it => it.id === id));
    const item = items.find(it => it.id === id) || items[0];

    if (!page || !item) {
      customItemHero.innerHTML = `<p class="eyebrow">Not Found</p><h1>Item Not Found</h1>`;
      customItemDetail.innerHTML = '';
      return;
    }

    document.title = item.title + ' — BLKSM Events';

    const [c1, c2] = GRADIENT_PAIRS[idx % GRADIENT_PAIRS.length];
    const heroMedia = item.image
      ? `background-image:url('${item.image}');background-size:cover;background-position:center`
      : `--c1:${c1};--c2:${c2}`;

    customItemHero.innerHTML = `
      <div class="member-card-hero">
        <div class="member-avatar project-avatar" style="${heroMedia}"></div>
        <div class="member-meta">
          <p class="eyebrow">${page.itemLabelSingular || 'Item'}</p>
          <h1>${item.title}</h1>
        </div>
      </div>
    `;

    const gallery = Array.isArray(item.gallery) ? item.gallery.filter(Boolean) : [];
    const galleryHTML = gallery.length
      ? `<div class="project-gallery">${gallery.map(src => `<div class="project-gallery-item"><img src="${src}" alt="${item.title}"></div>`).join('')}</div>`
      : '';

    customItemDetail.innerHTML = `
      <div class="detail-body">
        <p>${item.details || item.summary || ''}</p>
        ${galleryHTML}
      </div>
    `;

    const backTag = document.getElementById('customItemBackTag');
    const backTitle = document.getElementById('customItemBackTitle');
    const backLink = document.getElementById('customItemBackLink');
    if (backTag) backTag.textContent = page.title;
    if (backTitle) backTitle.textContent = `Full ${page.title} List`;
    if (backLink) {
      backLink.href = `custom-page.html?slug=${page.slug}`;
      backLink.textContent = `View All ${page.title}`;
    }
  }).catch(() => {
    customItemDetail.innerHTML = '<p style="color:var(--muted)">Unable to load this item right now.</p>';
  });
}

/* ===================== PARTNERS / SPONSORS CAROUSEL ===================== */
(function () {
  const slot = document.getElementById('partnersCarousel');
  if (!slot) return;

  // Determine which page we're on by filename
  const filename = window.location.pathname.split('/').pop() || 'index.html';
  const pageKey = filename === 'index.html' || filename === '' ? 'home'
    : filename === 'team.html' ? 'team'
    : filename === 'portfolio.html' ? 'portfolio'
    : filename === 'events.html' ? 'events'
    : null;

  if (!pageKey) return;

  loadJSON('content/partners.json').then(data => {
    const carousels = Array.isArray(data.carousels) ? data.carousels : [];
    const matching = carousels.filter(c => Array.isArray(c.pages) && c.pages.includes(pageKey));
    if (!matching.length) return;

    slot.innerHTML = matching.map(carousel => {
      const logos = Array.isArray(carousel.logos) ? carousel.logos.filter(l => l.image) : [];
      if (!logos.length) return '';

      const all = [...logos, ...logos];
      const items = all.map(l => {
        const img = `<img src="${l.image}" alt="${l.name || ''}">`;
        return `<div class="carousel-logo">${l.url
          ? `<a href="${l.url}" target="_blank" rel="noopener noreferrer">${img}</a>`
          : img}</div>`;
      }).join('');

      const duration = Math.max(20, logos.length * 4) + 's';

      return `
        <section class="partners-section">
          <div class="container">
            <div class="section-tag">Partners &amp; Sponsors</div>
            <h2 class="section-title">${carousel.heading || 'Our Partners'}</h2>
            ${carousel.subtext ? `<p class="partners-subtext">${carousel.subtext}</p>` : ''}
          </div>
          <div class="carousel-track-wrap">
            <div class="carousel-track" style="animation-duration:${duration}">${items}</div>
          </div>
        </section>
      `;
    }).join('');
  }).catch(() => {});
})();
