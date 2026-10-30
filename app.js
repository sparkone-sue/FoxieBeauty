(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  if (menu && nav) {
    menu.hidden = false;
    const closeMenu = () => { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      nav.classList.toggle('is-open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menu.focus(); } });
    const desktop = matchMedia('(min-width: 701px)');
    desktop.addEventListener('change', closeMenu);
  }
  const gallery = document.querySelector('.gallery');
  const controls = document.querySelector('.gallery-controls');
  const previous = document.querySelector('#gallery-prev');
  const next = document.querySelector('#gallery-next');
  const status = document.querySelector('.gallery-position');
  const track = document.querySelector('.gallery-track');
  if (gallery && controls && track) {
    track.id = 'gallery-track';
    controls.hidden = false;
    const cards = [...track.children];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    gallery.classList.add('auto-gallery');
    // A second visual copy allows the track to wrap without a visible jump.
    cards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a').forEach(a => a.tabIndex = -1);
      track.append(clone);
    });
    const step = () => cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : gallery.clientWidth;
    const cycle = () => cards.length * step();
    const update = () => {
      const n = Math.floor(gallery.scrollLeft / step()) % cards.length;
      status.textContent = `${n + 1} / ${cards.length}`;
      previous.disabled = false;
      next.disabled = false;
    };
    let pointer = false;
    let focused = false;
    let touching = false;
    let visible = false;
    let manualUntil = 0;
    let frame = 0;
    let lastTime = 0;
    let position = gallery.scrollLeft;
    const canRun = () => !reduced.matches && visible && !document.hidden && !pointer && !focused && !touching && !document.querySelector('.lightbox[open]');
    const tick = time => {
      frame = 0;
      const dt = lastTime ? Math.min(time - lastTime, 40) : 0;
      lastTime = time;
      if (canRun() && time > manualUntil) {
        const length = cycle();
        if (length > 0) {
          position = (position + dt * (gallery.clientWidth < 600 ? 0.08 : 0.11)) % length;
          gallery.scrollLeft = position;
        }
      } else position = gallery.scrollLeft;
      if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      if (!frame && visible && !document.hidden && !reduced.matches) {
        lastTime = 0;
        position = gallery.scrollLeft;
        frame = requestAnimationFrame(tick);
      }
    };
    const manual = () => { manualUntil = performance.now() + 2200; position = gallery.scrollLeft; };
    const go = delta => {
      manual();
      let target = gallery.scrollLeft + delta;
      if (target < 0) {gallery.scrollLeft += cycle(); target += cycle();}
      gallery.scrollTo({left:target,behavior:reduced.matches?'auto':'smooth'});
    };
    previous.addEventListener('click', () => go(-step()));
    next.addEventListener('click', () => go(step()));
    gallery.addEventListener('keydown', event => {
      if (event.target !== gallery) return;
      const offsets = {ArrowRight:step(),ArrowLeft:-step(),Home:-gallery.scrollLeft,End:cycle()-step()-gallery.scrollLeft};
      if (Object.hasOwn(offsets,event.key)) {event.preventDefault();go(offsets[event.key]);}
    });
    gallery.addEventListener('pointerenter', event => {if(event.pointerType==='mouse') pointer=true;});
    gallery.addEventListener('pointerleave', () => {pointer=false;resume();});
    gallery.addEventListener('focusin', () => {focused=true;});
    gallery.addEventListener('focusout', () => {focused=false;resume();});
    gallery.addEventListener('pointerdown', () => {touching=true;manual();});
    window.addEventListener('pointerup', () => {if(touching){touching=false;manual();resume();}});
    window.addEventListener('pointercancel', () => {touching=false;resume();});
    gallery.addEventListener('wheel', manual, {passive:true});
    gallery.addEventListener('scroll', update, {passive:true});
    document.addEventListener('visibilitychange', resume);
    reduced.addEventListener('change', () => {cancelAnimationFrame(frame);frame=0;lastTime=0;resume();});
    new ResizeObserver(() => {position=gallery.scrollLeft;update();}).observe(gallery);
    if (typeof IntersectionObserver === 'function') new IntersectionObserver(entries => {
      visible=entries[0].isIntersecting;
      if(!visible){cancelAnimationFrame(frame);frame=0;lastTime=0;}
      else resume();
    },{threshold:.1}).observe(gallery);
    else {visible=true;resume();}
    update();
  }
  const dialog = document.querySelector('.lightbox');
  const fullImage = document.querySelector('.lightbox-image');
  const title = document.querySelector('#lightbox-title');
  if (dialog && typeof dialog.showModal === 'function') {
    let opener;
    document.querySelectorAll('[data-lightbox]').forEach(link => link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      opener = link;
      fullImage.src = link.href;
      fullImage.alt = link.querySelector('img')?.alt || 'FoxieBeauty image';
      title.textContent = fullImage.alt;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }));
    const close = () => dialog.close();
    dialog.querySelector('.lightbox-close').addEventListener('click', close);
    dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) close(); });
    dialog.addEventListener('close', () => { document.body.style.overflow = ''; fullImage.removeAttribute('src'); if (opener?.isConnected) opener.focus({ preventScroll: true }); });
  }
})();

// Motion is a progressive enhancement: all content remains present without JS.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || typeof IntersectionObserver !== 'function' || typeof Element.prototype.animate !== 'function') return;
  const targets = [...document.querySelectorAll('.hero h1,.hero .service-names,.hero-description,.hero-action,.hero-photo,.booking-grid>*,.nail-grid>*,.gallery-section h2,.gallery,.lash-grid>*,.inspiration-links,.lash-benefits,.price-grid>*,.policy-grid>*,.landing-intro>*,.landing-inspiration-title,.style-card,.aftercare-section h2,.aftercare-grid article,.original-hours,.original-contact,.original-booking,.original-service-names')];
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el=entry.target;
      el.classList.remove('motion-pending');
      el.classList.add('motion-visible');
      reveal.unobserve(el);
    }
  }, { threshold: 0.04, rootMargin: '0px 0px -20px 0px' });
  targets.forEach(el => {
    // display:contents has no visual box; its children carry the nail section.
    if (getComputedStyle(el).display === 'contents') return;
    const siblings=[...el.parentElement.children];
    const delay=Math.min(siblings.indexOf(el)%4,3)*75;
    el.style.setProperty('--reveal-delay', `${delay}ms`);
    el.classList.add('motion-pending');
    reveal.observe(el);
  });
  preference.addEventListener('change', event => {
    if(!event.matches) return;
    reveal.disconnect();
    targets.forEach(el=>{el.classList.remove('motion-pending','motion-visible');el.getAnimations().forEach(a=>a.cancel());});
  });
})();

// The supplied nail video plays when visible; native controls remain available.
(() => {
  const video=document.querySelector('.nail-video');
  if(!video) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  video.muted=true;
  if(typeof IntersectionObserver==='function'){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting&&!reduced.matches) video.play().catch(()=>{});
        else video.pause();
      }
    },{threshold:.2});
    observer.observe(video);
  }
  reduced.addEventListener('change',event=>{if(event.matches) video.pause();});
})();
