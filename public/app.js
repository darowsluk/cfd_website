async function fetchJSON(url){
  const res = await fetch(url, { cache: 'no-store' });
  if(!res.ok) throw new Error('Błąd pobierania');
  return res.json();
}

function renderEvents(list){
  const ul = document.getElementById('events-list');
  ul.innerHTML = '';
  if(!list || list.length === 0){
    ul.innerHTML = '<li>Wkrótce opublikujemy nowe terminy.</li>';
    return;
  }
  list.forEach(ev => {
    const li = document.createElement('li');
    li.className = 'card';
    const when = new Date(ev.dateStart).toLocaleDateString('pl-PL', {day:'2-digit', month:'short', year:'numeric'});
    const badge = ev.type ? `<span class="badge">${ev.type}</span>` : '';
    li.innerHTML = `
      ${badge}
      <h3>${ev.title}</h3>
      <p><strong>${when}</strong>${ev.dateEnd ? ` – ${new Date(ev.dateEnd).toLocaleDateString('pl-PL',{day:'2-digit',month:'short'})}`:''}</p>
      ${ev.place ? `<p>Miejsce: ${ev.place}</p>`:''}
      ${ev.link ? `<p><a class="btn" target="_blank" rel="noopener" href="${ev.link}">Szczegóły i zapisy</a></p>`:''}
    `;
    ul.appendChild(li);
  });
}

function renderDirectors(list){
  const box = document.getElementById('directors-list');
  box.innerHTML = '';
  if(!list || list.length === 0){
    box.innerHTML = '<p>Lista w przygotowaniu.</p>';
    return;
  }
  list.forEach(p => {
    const div = document.createElement('div');
    div.className = 'person';
    const initials = (p.name || 'CFD').split(' ').map(s=>s[0]).slice(0,2).join('');
    const avatar = p.photo
      ? `<img class="avatar avatar-img" src="${p.photo}" alt="${p.name}" loading="lazy" />`
      : `<div class=\"avatar\" aria-hidden=\"true\">${initials}</div>`;
    div.innerHTML = `
      ${avatar}
      <div>
        <h4>${p.name}</h4>
        ${p.role ? `<p>${p.role}</p>`:''}
      </div>
    `;
    box.appendChild(div);
  });
}

async function init(){
  document.getElementById('year').textContent = new Date().getFullYear();
  // Mobile nav
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('main-nav');
  if(toggle && menu){
    const setOpen = (open)=>{
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
    };
    toggle.addEventListener('click', ()=>{
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
    });
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>setOpen(false)));
    document.addEventListener('click', (e)=>{
      if(!menu.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape') setOpen(false);
    });
  }
  // Determine if backend API exists; if not, use static JSON files
  // Prefer relative URLs for GitHub Pages subpaths
  const hasBackend = await fetch('./api/health', { cache: 'no-store' }).then(r=>r.ok).catch(()=>false);
  try{
    const [events, directors] = await Promise.all([
      hasBackend ? fetchJSON('./api/events') : fetchJSON('./data/events.json'),
      hasBackend ? fetchJSON('./api/directors') : fetchJSON('./data/directors.json')
    ]);
    renderEvents(events);
    renderDirectors(directors);
  }catch(e){
    console.error('Błąd ładowania danych wydarzeń/prowadzących:', e);
    // Opcjonalna informacja dla użytkownika (bez psucia layoutu)
    const ul = document.getElementById('events-list');
    if(ul && ul.children.length === 0){
      const li = document.createElement('li');
      li.textContent = 'Nie udało się załadować danych kalendarza.';
      ul.appendChild(li);
    }
    const box = document.getElementById('directors-list');
    if(box && box.children.length === 0){
      const p = document.createElement('p');
      p.textContent = 'Nie udało się załadować listy prowadzących.';
      box.appendChild(p);
    }
  }

  const form = document.getElementById('download-form');
  const input = document.getElementById('entry-code');
  const msg = document.getElementById('download-message');
  const hasBackendForDownload = await fetch('./api/health', { cache: 'no-store' }).then(r=>r.ok).catch(()=>false);
  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    msg.textContent = hasBackendForDownload ? 'Przygotowujemy archiwum…' : 'Przygotowujemy plik demonstracyjny…';
    const code = input.value.trim();
    if(!code){ msg.textContent = 'Podaj kod.'; return; }
    try{
      if(!hasBackendForDownload){
        // Mock: na GitHub Pages pobieramy statyczny plik demo
        const a = document.createElement('a');
        a.href = './downloads/default.mp3';
        a.download = 'rekolekcje-default.mp3';
        document.body.appendChild(a);
        a.click();
        a.remove();
        msg.textContent = 'Pobieranie pliku demonstracyjnego rozpoczęte.';
        return;
      }
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if(!res.ok){
        const data = await res.json().catch(()=>({error:'Błąd pobierania.'}));
        msg.textContent = data.error || 'Niepowodzenie.';
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rekolekcje.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      msg.textContent = 'Pobieranie rozpoczęte.';
    }catch(err){
      console.error(err);
      msg.textContent = 'Wystąpił błąd sieci.';
    }
  });

//   if(!hasBackendForDownload){
//     // Dodaj delikatną notkę informacyjną pod formularzem
//     const note = document.createElement('p');
//     note.className = 'message';
//     note.style.marginTop = '.4rem';
//     note.textContent = 'To jest wersja demonstracyjna na GitHub Pages – pobierzesz przykładowy plik default.mp3.';
//     form.appendChild(note);
//   }
}

document.addEventListener('DOMContentLoaded', init);
