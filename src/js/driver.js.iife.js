this.driver = this.driver || {};
this.driver.js = (function (F) {
  'use strict';
  let z = {},
    q;
  function V(e = {}) {
    z = {
      animate: !0,
      allowClose: !0,
      overlayClickBehavior: 'close',
      overlayOpacity: 0.7,
      smoothScroll: !1,
      disableActiveInteraction: !1,
      showProgress: !1,
      stagePadding: 10,
      stageRadius: 5,
      popoverOffset: 10,
      showButtons: ['next', 'previous', 'close'],
      disableButtons: [],
      overlayColor: '#000',
      ...e,
    };
  }
  function s(e) {
    return e ? z[e] : z;
  }
  function le(e) {
    q = e;
  }
  function S() {
    return q;
  }
  let A = {};
  function N(e, i) {
    A[e] = i;
  }
  function T(e) {
    var i;
    (i = A[e]) == null || i.call(A);
  }
  function de() {
    A = {};
  }
  function O(e, i, t, o) {
    return (e /= o / 2) < 1
      ? (t / 2) * e * e + i
      : (-t / 2) * (--e * (e - 2) - 1) + i;
  }
  function K(e) {
    const i =
      'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])';
    return e
      .flatMap((t) => {
        const o = t.matches(i),
          d = Array.from(t.querySelectorAll(i));
        return [...(o ? [t] : []), ...d];
      })
      .filter((t) => getComputedStyle(t).pointerEvents !== 'none' && ve(t));
  }
  function Y(e) {
    if (!e || ue(e)) return;
    const i = s('smoothScroll'),
      t = e.offsetHeight > window.innerHeight;
    e.scrollIntoView({
      behavior: !i || pe(e) ? 'auto' : 'smooth',
      inline: 'center',
      block: t ? 'start' : 'center',
    });
  }
  function pe(e) {
    if (!e || !e.parentElement) return;
    const i = e.parentElement;
    return i.scrollHeight > i.clientHeight;
  }
  function ue(e) {
    const i = e.getBoundingClientRect();
    return (
      i.top >= 0 &&
      i.left >= 0 &&
      i.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      i.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  function ve(e) {
    return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
  }
  let D = {};
  function k(e, i) {
    D[e] = i;
  }
  function l(e) {
    return e ? D[e] : D;
  }
  function X() {
    D = {};
  }
  function fe(e, i, t, o) {
    let d = l('__activeStagePosition');
    const n = d || t.getBoundingClientRect(),
      f = o.getBoundingClientRect(),
      w = O(e, n.x, f.x - n.x, i),
      r = O(e, n.y, f.y - n.y, i),
      v = O(e, n.width, f.width - n.width, i),
      g = O(e, n.height, f.height - n.height, i);
    (d = { x: w, y: r, width: v, height: g }),
      Q(d),
      k('__activeStagePosition', d);
  }
  function j(e) {
    if (!e) return;
    const i = e.getBoundingClientRect(),
      t = { x: i.x, y: i.y, width: i.width, height: i.height };
    k('__activeStagePosition', t), Q(t);
  }
  function he() {
    const e = l('__activeStagePosition'),
      i = l('__overlaySvg');
    if (!e) return;
    if (!i) {
      console.warn('No stage svg found.');
      return;
    }
    const t = window.innerWidth,
      o = window.innerHeight;
    i.setAttribute('viewBox', `0 0 ${t} ${o}`);
  }
  function ge(e) {
    const i = we(e);
    document.body.appendChild(i),
      U(i, (t) => {
        t.target.tagName === 'path' && T('overlayClick');
      }),
      k('__overlaySvg', i);
  }
  function Q(e) {
    const i = l('__overlaySvg');
    if (!i) {
      ge(e);
      return;
    }
    const t = i.firstElementChild;
    if ((t == null ? void 0 : t.tagName) !== 'path')
      throw new Error('no path element found in stage svg');
    t.setAttribute('d', Z(e));
  }
  function we(e) {
    const i = window.innerWidth,
      t = window.innerHeight,
      o = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    o.classList.add('driver-overlay', 'driver-overlay-animated'),
      o.setAttribute('viewBox', `0 0 ${i} ${t}`),
      o.setAttribute('xmlSpace', 'preserve'),
      o.setAttribute('xmlnsXlink', 'http://www.w3.org/1999/xlink'),
      o.setAttribute('version', '1.1'),
      o.setAttribute('preserveAspectRatio', 'xMinYMin slice'),
      (o.style.fillRule = 'evenodd'),
      (o.style.clipRule = 'evenodd'),
      (o.style.strokeLinejoin = 'round'),
      (o.style.strokeMiterlimit = '2'),
      (o.style.zIndex = '10000'),
      (o.style.position = 'fixed'),
      (o.style.top = '0'),
      (o.style.left = '0'),
      (o.style.width = '100%'),
      (o.style.height = '100%');
    const d = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    return (
      d.setAttribute('d', Z(e)),
      (d.style.fill = s('overlayColor') || 'rgb(0,0,0)'),
      (d.style.opacity = `${s('overlayOpacity')}`),
      (d.style.pointerEvents = 'auto'),
      (d.style.cursor = 'auto'),
      o.appendChild(d),
      o
    );
  }
  function Z(e) {
    const i = window.innerWidth,
      t = window.innerHeight,
      o = s('stagePadding') || 0,
      d = s('stageRadius') || 0,
      n = e.width + o * 2,
      f = e.height + o * 2,
      w = Math.min(d, n / 2, f / 2),
      r = Math.floor(Math.max(w, 0)),
      v = e.x - o + r,
      g = e.y - o,
      y = n - r * 2,
      a = f - r * 2;
    return `M${i},0L0,0L0,${t}L${i},${t}L${i},0Z
    M${v},${g} h${y} a${r},${r} 0 0 1 ${r},${r} v${a} a${r},${r} 0 0 1 -${r},${r} h-${y} a${r},${r} 0 0 1 -${r},-${r} v-${a} a${r},${r} 0 0 1 ${r},-${r} z`;
  }
  function me() {
    const e = l('__overlaySvg');
    e && e.remove();
  }
  function ye() {
    const e = document.getElementById('driver-dummy-element');
    if (e) return e;
    let i = document.createElement('div');
    return (
      (i.id = 'driver-dummy-element'),
      (i.style.width = '0'),
      (i.style.height = '0'),
      (i.style.pointerEvents = 'none'),
      (i.style.opacity = '0'),
      (i.style.position = 'fixed'),
      (i.style.top = '50%'),
      (i.style.left = '50%'),
      document.body.appendChild(i),
      i
    );
  }
  function G(e) {
    const { element: i } = e;
    let t =
      typeof i == 'function'
        ? i()
        : typeof i == 'string'
        ? document.querySelector(i)
        : i;
    t || (t = ye()), xe(t, e);
  }
  function be() {
    const e = l('__activeElement'),
      i = l('__activeStep');
    e && (j(e), he(), ne(e, i));
  }
  function xe(e, i) {
    var C;
    const o = Date.now(),
      d = l('__activeStep'),
      n = l('__activeElement') || e,
      f = !n || n === e,
      w = e.id === 'driver-dummy-element',
      r = n.id === 'driver-dummy-element',
      v = s('animate'),
      g = i.onHighlightStarted || s('onHighlightStarted'),
      y = (i == null ? void 0 : i.onHighlighted) || s('onHighlighted'),
      a = (d == null ? void 0 : d.onDeselected) || s('onDeselected'),
      p = s(),
      c = l();
    !f && a && a(r ? void 0 : n, d, { config: p, state: c, driver: S() }),
      g && g(w ? void 0 : e, i, { config: p, state: c, driver: S() });
    const u = !f && v;
    let h = !1;
    _e(),
      k('previousStep', d),
      k('previousElement', n),
      k('activeStep', i),
      k('activeElement', e);
    const m = () => {
      if (l('__transitionCallback') !== m) return;
      const x = Date.now() - o,
        L = 400 - x <= 400 / 2;
      i.popover && L && !h && u && (ee(e, i), (h = !0)),
        s('animate') && x < 400
          ? fe(x, 400, n, e)
          : (j(e),
            y && y(w ? void 0 : e, i, { config: s(), state: l(), driver: S() }),
            k('__transitionCallback', void 0),
            k('__previousStep', d),
            k('__previousElement', n),
            k('__activeStep', i),
            k('__activeElement', e)),
        window.requestAnimationFrame(m);
    };
    k('__transitionCallback', m),
      window.requestAnimationFrame(m),
      Y(e),
      !u && i.popover && ee(e, i),
      n.classList.remove('driver-active-element', 'driver-no-interaction'),
      n.removeAttribute('aria-haspopup'),
      n.removeAttribute('aria-expanded'),
      n.removeAttribute('aria-controls'),
      ((C = i.disableActiveInteraction) != null
        ? C
        : s('disableActiveInteraction')) &&
        e.classList.add('driver-no-interaction'),
      e.classList.add('driver-active-element'),
      e.setAttribute('aria-haspopup', 'dialog'),
      e.setAttribute('aria-expanded', 'true'),
      e.setAttribute('aria-controls', 'driver-popover-content');
  }
  function Ce() {
    var e;
    (e = document.getElementById('driver-dummy-element')) == null || e.remove(),
      document.querySelectorAll('.driver-active-element').forEach((i) => {
        i.classList.remove('driver-active-element', 'driver-no-interaction'),
          i.removeAttribute('aria-haspopup'),
          i.removeAttribute('aria-expanded'),
          i.removeAttribute('aria-controls');
      });
  }
  function H() {
    const e = l('__resizeTimeout');
    e && window.cancelAnimationFrame(e),
      k('__resizeTimeout', window.requestAnimationFrame(be));
  }
  function Pe(e) {
    var r;
    if (!l('isInitialized') || !(e.key === 'Tab' || e.keyCode === 9)) return;
    const o = l('__activeElement'),
      d = (r = l('popover')) == null ? void 0 : r.wrapper,
      n = K([...(d ? [d] : []), ...(o ? [o] : [])]),
      f = n[0],
      w = n[n.length - 1];
    if ((e.preventDefault(), e.shiftKey)) {
      const v = n[n.indexOf(document.activeElement) - 1] || w;
      v == null || v.focus();
    } else {
      const v = n[n.indexOf(document.activeElement) + 1] || f;
      v == null || v.focus();
    }
  }
  function J(e) {
    var t;
    ((t = s('allowKeyboardControl')) == null || t) &&
      (e.key === 'Escape'
        ? T('escapePress')
        : e.key === 'ArrowRight'
        ? T('arrowRightPress')
        : e.key === 'ArrowLeft' && T('arrowLeftPress'));
  }
  function U(e, i, t) {
    const o = (n, f) => {
      const w = n.target;
      e.contains(w) &&
        ((!t || t(w)) &&
          (n.preventDefault(),
          n.stopPropagation(),
          n.stopImmediatePropagation()),
        f == null || f(n));
    };
    document.addEventListener('pointerdown', o, !0),
      document.addEventListener('mousedown', o, !0),
      document.addEventListener('pointerup', o, !0),
      document.addEventListener('mouseup', o, !0),
      document.addEventListener(
        'click',
        (n) => {
          o(n, i);
        },
        !0
      );
  }
  function ke() {
    window.addEventListener('keyup', J, !1),
      window.addEventListener('keydown', Pe, !1),
      window.addEventListener('resize', H),
      window.addEventListener('scroll', H);
  }
  function Se() {
    window.removeEventListener('keyup', J),
      window.removeEventListener('resize', H),
      window.removeEventListener('scroll', H);
  }
  function _e() {
    const e = l('popover');
    e && (e.wrapper.style.display = 'none');
  }
  function ee(e, i) {
    var x, P;
    let t = l('popover');
    t && document.body.removeChild(t.wrapper),
      (t = Te()),
      document.body.appendChild(t.wrapper);
    const {
      title: o,
      description: d,
      showButtons: n,
      disableButtons: f,
      showProgress: w,
      nextBtnText: r = s('nextBtnText') || 'Siguiente &rarr;',
      prevBtnText: v = s('prevBtnText') || '&larr; Anterior',
      progressText: g = s('progressText') || '{current} de {total}',
    } = i.popover || {};
    (t.nextButton.innerHTML = r),
      (t.previousButton.innerHTML = v),
      (t.progress.innerHTML = g),
      o
        ? ((t.title.innerHTML = o), (t.title.style.display = 'block'))
        : (t.title.style.display = 'none'),
      d
        ? ((t.description.innerHTML = d),
          (t.description.style.display = 'block'))
        : (t.description.style.display = 'none');
    const y = n || s('showButtons'),
      a = w || s('showProgress') || !1,
      p =
        (y == null ? void 0 : y.includes('next')) ||
        (y == null ? void 0 : y.includes('previous')) ||
        a;
    (t.closeButton.style.display = y.includes('close') ? 'block' : 'none'),
      p
        ? ((t.footer.style.display = 'flex'),
          (t.progress.style.display = a ? 'block' : 'none'),
          (t.nextButton.style.display = y.includes('next') ? 'block' : 'none'),
          (t.previousButton.style.display = y.includes('previous')
            ? 'block'
            : 'none'))
        : (t.footer.style.display = 'none');
    const c = f || s('disableButtons') || [];
    c != null &&
      c.includes('next') &&
      ((t.nextButton.disabled = !0),
      t.nextButton.classList.add('driver-popover-btn-disabled')),
      c != null &&
        c.includes('previous') &&
        ((t.previousButton.disabled = !0),
        t.previousButton.classList.add('driver-popover-btn-disabled')),
      c != null &&
        c.includes('close') &&
        ((t.closeButton.disabled = !0),
        t.closeButton.classList.add('driver-popover-btn-disabled'));
    const u = t.wrapper;
    (u.style.display = 'block'),
      (u.style.left = ''),
      (u.style.top = ''),
      (u.style.bottom = ''),
      (u.style.right = ''),
      (u.id = 'driver-popover-content'),
      u.setAttribute('role', 'dialog'),
      u.setAttribute('aria-labelledby', 'driver-popover-title'),
      u.setAttribute('aria-describedby', 'driver-popover-description');
    const h = t.arrow;
    h.className = 'driver-popover-arrow';
    const m =
      ((x = i.popover) == null ? void 0 : x.popoverClass) ||
      s('popoverClass') ||
      '';
    (u.className = `driver-popover ${m}`.trim()),
      U(
        t.wrapper,
        (L) => {
          var W, I, M;
          const E = L.target,
            $ =
              ((W = i.popover) == null ? void 0 : W.onNextClick) ||
              s('onNextClick'),
            B =
              ((I = i.popover) == null ? void 0 : I.onPrevClick) ||
              s('onPrevClick'),
            R =
              ((M = i.popover) == null ? void 0 : M.onCloseClick) ||
              s('onCloseClick');
          if (E.classList.contains('driver-popover-next-btn'))
            return $
              ? $(e, i, { config: s(), state: l(), driver: S() })
              : T('nextClick');
          if (E.classList.contains('driver-popover-prev-btn'))
            return B
              ? B(e, i, { config: s(), state: l(), driver: S() })
              : T('prevClick');
          if (E.classList.contains('driver-popover-close-btn'))
            return R
              ? R(e, i, { config: s(), state: l(), driver: S() })
              : T('closeClick');
        },
        (L) =>
          !(t != null && t.description.contains(L)) &&
          !(t != null && t.title.contains(L)) &&
          typeof L.className == 'string' &&
          L.className.includes('driver-popover')
      ),
      k('popover', t);
    const b =
      ((P = i.popover) == null ? void 0 : P.onPopoverRender) ||
      s('onPopoverRender');
    b && b(t, { config: s(), state: l(), driver: S() }), ne(e, i), Y(u);
    const C = e.classList.contains('driver-dummy-element'),
      _ = K([u, ...(C ? [] : [e])]);
    _.length > 0 && _[0].focus();
  }
  function te() {
    const e = l('popover');
    if (!(e != null && e.wrapper)) return;
    const i = e.wrapper.getBoundingClientRect(),
      t = s('stagePadding') || 0,
      o = s('popoverOffset') || 0;
    return {
      width: i.width + t + o,
      height: i.height + t + o,
      realWidth: i.width,
      realHeight: i.height,
    };
  }
  function ie(e, i) {
    const {
      elementDimensions: t,
      popoverDimensions: o,
      popoverPadding: d,
      popoverArrowDimensions: n,
    } = i;
    return e === 'start'
      ? Math.max(
          Math.min(t.top - d, window.innerHeight - o.realHeight - n.width),
          n.width
        )
      : e === 'end'
      ? Math.max(
          Math.min(
            t.top - (o == null ? void 0 : o.realHeight) + t.height + d,
            window.innerHeight - (o == null ? void 0 : o.realHeight) - n.width
          ),
          n.width
        )
      : e === 'center'
      ? Math.max(
          Math.min(
            t.top + t.height / 2 - (o == null ? void 0 : o.realHeight) / 2,
            window.innerHeight - (o == null ? void 0 : o.realHeight) - n.width
          ),
          n.width
        )
      : 0;
  }
  function oe(e, i) {
    const {
      elementDimensions: t,
      popoverDimensions: o,
      popoverPadding: d,
      popoverArrowDimensions: n,
    } = i;
    return e === 'start'
      ? Math.max(
          Math.min(t.left - d, window.innerWidth - o.realWidth - n.width),
          n.width
        )
      : e === 'end'
      ? Math.max(
          Math.min(
            t.left - (o == null ? void 0 : o.realWidth) + t.width + d,
            window.innerWidth - (o == null ? void 0 : o.realWidth) - n.width
          ),
          n.width
        )
      : e === 'center'
      ? Math.max(
          Math.min(
            t.left + t.width / 2 - (o == null ? void 0 : o.realWidth) / 2,
            window.innerWidth - (o == null ? void 0 : o.realWidth) - n.width
          ),
          n.width
        )
      : 0;
  }
  function ne(e, i) {
    const t = l('popover');
    if (!t) return;
    const { align: o = 'start', side: d = 'left' } =
        (i == null ? void 0 : i.popover) || {},
      n = o,
      f = e.id === 'driver-dummy-element' ? 'over' : d,
      w = s('stagePadding') || 0,
      r = te(),
      v = t.arrow.getBoundingClientRect(),
      g = e.getBoundingClientRect(),
      y = g.top - r.height;
    let a = y >= 0;
    const p = window.innerHeight - (g.bottom + r.height);
    let c = p >= 0;
    const u = g.left - r.width;
    let h = u >= 0;
    const m = window.innerWidth - (g.right + r.width);
    let b = m >= 0;
    const C = !a && !c && !h && !b;
    let _ = f;
    if (
      (f === 'top' && a
        ? (b = h = c = !1)
        : f === 'bottom' && c
        ? (b = h = a = !1)
        : f === 'left' && h
        ? (b = a = c = !1)
        : f === 'right' && b && (h = a = c = !1),
      f === 'over')
    ) {
      const x = window.innerWidth / 2 - r.realWidth / 2,
        P = window.innerHeight / 2 - r.realHeight / 2;
      (t.wrapper.style.left = `${x}px`),
        (t.wrapper.style.right = 'auto'),
        (t.wrapper.style.top = `${P}px`),
        (t.wrapper.style.bottom = 'auto');
    } else if (C) {
      const x = window.innerWidth / 2 - (r == null ? void 0 : r.realWidth) / 2,
        P = 10;
      (t.wrapper.style.left = `${x}px`),
        (t.wrapper.style.right = 'auto'),
        (t.wrapper.style.bottom = `${P}px`),
        (t.wrapper.style.top = 'auto');
    } else if (h) {
      const x = Math.min(
          u,
          window.innerWidth - (r == null ? void 0 : r.realWidth) - v.width
        ),
        P = ie(n, {
          elementDimensions: g,
          popoverDimensions: r,
          popoverPadding: w,
          popoverArrowDimensions: v,
        });
      (t.wrapper.style.left = `${x}px`),
        (t.wrapper.style.top = `${P}px`),
        (t.wrapper.style.bottom = 'auto'),
        (t.wrapper.style.right = 'auto'),
        (_ = 'left');
    } else if (b) {
      const x = Math.min(
          m,
          window.innerWidth - (r == null ? void 0 : r.realWidth) - v.width
        ),
        P = ie(n, {
          elementDimensions: g,
          popoverDimensions: r,
          popoverPadding: w,
          popoverArrowDimensions: v,
        });
      (t.wrapper.style.right = `${x}px`),
        (t.wrapper.style.top = `${P}px`),
        (t.wrapper.style.bottom = 'auto'),
        (t.wrapper.style.left = 'auto'),
        (_ = 'right');
    } else if (a) {
      const x = Math.min(y, window.innerHeight - r.realHeight - v.width);
      let P = oe(n, {
        elementDimensions: g,
        popoverDimensions: r,
        popoverPadding: w,
        popoverArrowDimensions: v,
      });
      (t.wrapper.style.top = `${x}px`),
        (t.wrapper.style.left = `${P}px`),
        (t.wrapper.style.bottom = 'auto'),
        (t.wrapper.style.right = 'auto'),
        (_ = 'top');
    } else if (c) {
      const x = Math.min(
        p,
        window.innerHeight - (r == null ? void 0 : r.realHeight) - v.width
      );
      let P = oe(n, {
        elementDimensions: g,
        popoverDimensions: r,
        popoverPadding: w,
        popoverArrowDimensions: v,
      });
      (t.wrapper.style.left = `${P}px`),
        (t.wrapper.style.bottom = `${x}px`),
        (t.wrapper.style.top = 'auto'),
        (t.wrapper.style.right = 'auto'),
        (_ = 'bottom');
    }
    C ? t.arrow.classList.add('driver-popover-arrow-none') : Le(n, _, e);
  }
  function Le(e, i, t) {
    const o = l('popover');
    if (!o) return;
    const d = t.getBoundingClientRect(),
      n = te(),
      f = o.arrow,
      w = n.width,
      r = window.innerWidth,
      v = d.width,
      g = d.left,
      y = n.height,
      a = window.innerHeight,
      p = d.top,
      c = d.height;
    f.className = 'driver-popover-arrow';
    let u = i,
      h = e;
    if (
      (i === 'top'
        ? (g + v <= 0
            ? ((u = 'right'), (h = 'end'))
            : g + v - w <= 0 && ((u = 'top'), (h = 'start')),
          g >= r
            ? ((u = 'left'), (h = 'end'))
            : g + w >= r && ((u = 'top'), (h = 'end')))
        : i === 'bottom'
        ? (g + v <= 0
            ? ((u = 'right'), (h = 'start'))
            : g + v - w <= 0 && ((u = 'bottom'), (h = 'start')),
          g >= r
            ? ((u = 'left'), (h = 'start'))
            : g + w >= r && ((u = 'bottom'), (h = 'end')))
        : i === 'left'
        ? (p + c <= 0
            ? ((u = 'bottom'), (h = 'end'))
            : p + c - y <= 0 && ((u = 'left'), (h = 'start')),
          p >= a
            ? ((u = 'top'), (h = 'end'))
            : p + y >= a && ((u = 'left'), (h = 'end')))
        : i === 'right' &&
          (p + c <= 0
            ? ((u = 'bottom'), (h = 'start'))
            : p + c - y <= 0 && ((u = 'right'), (h = 'start')),
          p >= a
            ? ((u = 'top'), (h = 'start'))
            : p + y >= a && ((u = 'right'), (h = 'end'))),
      !u)
    )
      f.classList.add('driver-popover-arrow-none');
    else {
      f.classList.add(`driver-popover-arrow-side-${u}`),
        f.classList.add(`driver-popover-arrow-align-${h}`);
      const m = t.getBoundingClientRect(),
        b = f.getBoundingClientRect(),
        C = s('stagePadding') || 0,
        _ =
          m.left - C < window.innerWidth &&
          m.right + C > 0 &&
          m.top - C < window.innerHeight &&
          m.bottom + C > 0;
      i === 'bottom' &&
        _ &&
        (b.x > m.x && b.x + b.width < m.x + m.width
          ? (o.wrapper.style.transform = 'translateY(0)')
          : (f.classList.remove(`driver-popover-arrow-align-${h}`),
            f.classList.add('driver-popover-arrow-none'),
            (o.wrapper.style.transform = `translateY(-${C / 2}px)`)));
    }
  }
  function Te() {
    const e = document.createElement('div');
    e.classList.add('driver-popover');
    const i = document.createElement('div');
    i.classList.add('driver-popover-arrow');
    const t = document.createElement('header');
    (t.id = 'driver-popover-title'),
      t.classList.add('driver-popover-title'),
      (t.style.display = 'none'),
      (t.innerText = 'Título');
    const o = document.createElement('div');
    (o.id = 'driver-popover-description'),
      o.classList.add('driver-popover-description'),
      (o.style.display = 'none'),
      (o.innerText = 'Descripción');
    const d = document.createElement('button');
    (d.type = 'button'),
      d.classList.add('driver-popover-close-btn'),
      d.setAttribute('aria-label', 'Close'),
      (d.innerHTML = '&times;');
    const n = document.createElement('footer');
    n.classList.add('driver-popover-footer');
    const f = document.createElement('span');
    f.classList.add('driver-popover-progress-text'), (f.innerText = '');
    const w = document.createElement('span');
    w.classList.add('driver-popover-navigation-btns');
    const r = document.createElement('button');
    (r.type = 'button'),
      r.classList.add('driver-popover-prev-btn'),
      (r.innerHTML = '&larr; Anterior');
    const v = document.createElement('button');
    return (
      (v.type = 'button'),
      v.classList.add('driver-popover-next-btn'),
      (v.innerHTML = 'Next &rarr;'),
      w.appendChild(r),
      w.appendChild(v),
      n.appendChild(f),
      n.appendChild(w),
      e.appendChild(d),
      e.appendChild(i),
      e.appendChild(t),
      e.appendChild(o),
      e.appendChild(n),
      {
        wrapper: e,
        arrow: i,
        title: t,
        description: o,
        footer: n,
        previousButton: r,
        nextButton: v,
        closeButton: d,
        footerButtons: w,
        progress: f,
      }
    );
  }
  function Ee() {
    var i;
    const e = l('popover');
    e && ((i = e.wrapper.parentElement) == null || i.removeChild(e.wrapper));
  }
  const $e = '';
  function Ae(e = {}) {
    V(e);
    function i() {
      s('allowClose') && g();
    }
    function t() {
      const a = s('overlayClickBehavior');
      if (s('allowClose') && a === 'close') {
        g();
        return;
      }
      a === 'nextStep' && o();
    }
    function o() {
      const a = l('activeIndex'),
        p = s('steps') || [];
      if (typeof a == 'undefined') return;
      const c = a + 1;
      p[c] ? v(c) : g();
    }
    function d() {
      const a = l('activeIndex'),
        p = s('steps') || [];
      if (typeof a == 'undefined') return;
      const c = a - 1;
      p[c] ? v(c) : g();
    }
    function n(a) {
      (s('steps') || [])[a] ? v(a) : g();
    }
    function f() {
      var b;
      if (l('__transitionCallback')) return;
      const p = l('activeIndex'),
        c = l('__activeStep'),
        u = l('__activeElement');
      if (
        typeof p == 'undefined' ||
        typeof c == 'undefined' ||
        typeof l('activeIndex') == 'undefined'
      )
        return;
      const m =
        ((b = c.popover) == null ? void 0 : b.onPrevClick) || s('onPrevClick');
      if (m) return m(u, c, { config: s(), state: l(), driver: S() });
      d();
    }
    function w() {
      var m;
      if (l('__transitionCallback')) return;
      const p = l('activeIndex'),
        c = l('__activeStep'),
        u = l('__activeElement');
      if (typeof p == 'undefined' || typeof c == 'undefined') return;
      const h =
        ((m = c.popover) == null ? void 0 : m.onNextClick) || s('onNextClick');
      if (h) return h(u, c, { config: s(), state: l(), driver: S() });
      o();
    }
    function r() {
      l('isInitialized') ||
        (k('isInitialized', !0),
        document.body.classList.add(
          'driver-active',
          s('animate') ? 'driver-fade' : 'driver-simple'
        ),
        ke(),
        N('overlayClick', t),
        N('escapePress', i),
        N('arrowLeftPress', f),
        N('arrowRightPress', w));
    }
    function v(a = 0) {
      var R, W, I, M, re, se, ae, ce;
      const p = s('steps');
      if (!p) {
        console.error('No steps to drive through'), g();
        return;
      }
      if (!p[a]) {
        g();
        return;
      }
      k('__activeOnDestroyed', document.activeElement), k('activeIndex', a);
      const c = p[a],
        u = p[a + 1],
        h = p[a - 1],
        m =
          ((R = c.popover) == null ? void 0 : R.doneBtnText) ||
          s('doneBtnText') ||
          'Finalizar',
        b = s('allowClose'),
        C =
          typeof ((W = c.popover) == null ? void 0 : W.showProgress) !=
          'undefined'
            ? (I = c.popover) == null
              ? void 0
              : I.showProgress
            : s('showProgress'),
        x = (
          ((M = c.popover) == null ? void 0 : M.progressText) ||
          s('progressText') ||
          '{{current}} de {{total}}'
        )
          .replace('{{current}}', `${a + 1}`)
          .replace('{{total}}', `${p.length}`),
        P =
          ((re = c.popover) == null ? void 0 : re.showButtons) ||
          s('showButtons'),
        L = ['next', 'previous', ...(b ? ['close'] : [])].filter(
          (He) => !(P != null && P.length) || P.includes(He)
        ),
        E =
          ((se = c.popover) == null ? void 0 : se.onNextClick) ||
          s('onNextClick'),
        $ =
          ((ae = c.popover) == null ? void 0 : ae.onPrevClick) ||
          s('onPrevClick'),
        B =
          ((ce = c.popover) == null ? void 0 : ce.onCloseClick) ||
          s('onCloseClick');
      G({
        ...c,
        popover: {
          showButtons: L,
          nextBtnText: u ? void 0 : m,
          disableButtons: [...(h ? [] : ['previous'])],
          showProgress: C,
          progressText: x,
          onNextClick:
            E ||
            (() => {
              u ? v(a + 1) : g();
            }),
          onPrevClick:
            $ ||
            (() => {
              v(a - 1);
            }),
          onCloseClick:
            B ||
            (() => {
              g();
            }),
          ...((c == null ? void 0 : c.popover) || {}),
        },
      });
    }
    function g(a = !0) {
      const p = l('__activeElement'),
        c = l('__activeStep'),
        u = l('__activeOnDestroyed'),
        h = s('onDestroyStarted');
      if (a && h) {
        const C = !p || (p == null ? void 0 : p.id) === 'driver-dummy-element';
        h(C ? void 0 : p, c, { config: s(), state: l(), driver: S() });
        return;
      }
      const m = (c == null ? void 0 : c.onDeselected) || s('onDeselected'),
        b = s('onDestroyed');
      if (
        (document.body.classList.remove(
          'driver-active',
          'driver-fade',
          'driver-simple'
        ),
        Se(),
        Ee(),
        Ce(),
        me(),
        de(),
        X(),
        p && c)
      ) {
        const C = p.id === 'driver-dummy-element';
        m && m(C ? void 0 : p, c, { config: s(), state: l(), driver: S() }),
          b && b(C ? void 0 : p, c, { config: s(), state: l(), driver: S() });
      }
      u && u.focus();
    }
    const y = {
      isActive: () => l('isInitialized') || !1,
      refresh: H,
      drive: (a = 0) => {
        r(), v(a);
      },
      setConfig: V,
      setSteps: (a) => {
        X(), V({ ...s(), steps: a });
      },
      getConfig: s,
      getState: l,
      getActiveIndex: () => l('activeIndex'),
      isFirstStep: () => l('activeIndex') === 0,
      isLastStep: () => {
        const a = s('steps') || [],
          p = l('activeIndex');
        return p !== void 0 && p === a.length - 1;
      },
      getActiveStep: () => l('activeStep'),
      getActiveElement: () => l('activeElement'),
      getPreviousElement: () => l('previousElement'),
      getPreviousStep: () => l('previousStep'),
      moveNext: o,
      movePrevious: d,
      moveTo: n,
      hasNextStep: () => {
        const a = s('steps') || [],
          p = l('activeIndex');
        return p !== void 0 && !!a[p + 1];
      },
      hasPreviousStep: () => {
        const a = s('steps') || [],
          p = l('activeIndex');
        return p !== void 0 && !!a[p - 1];
      },
      highlight: (a) => {
        r(),
          G({
            ...a,
            popover: a.popover
              ? {
                  showButtons: [],
                  showProgress: !1,
                  progressText: '',
                  ...a.popover,
                }
              : void 0,
          });
      },
      destroy: () => {
        g(!1);
      },
    };
    return le(y), y;
  }
  return (
    (F.driver = Ae),
    Object.defineProperty(F, Symbol.toStringTag, { value: 'Module' }),
    F
  );
})({});
