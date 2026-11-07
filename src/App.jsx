import React, { useEffect, useRef, useState, Component } from 'react'
import { Link } from 'react-scroll'
import Scene3D from './components/Scene3D'
import { useLenis } from './hooks/useLenis'

class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    console.warn('Canvas 3D Error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

/* ── 4 Primary Scenes (Matching 01 / 04 Format) ─────────────── */
const SCENES = [
  {
    id: 'sc0',
    scrollId: 'home',
    step: '01 / 04',
    align: 'l',
    isHero: true,
  },
  {
    id: 'sc1',
    scrollId: 'technology',
    step: '02 / 04',
    align: 'r',
    label: '02 / 04 · Kinetic Architecture',
    title: <>ADAPTIVE <span className="highlight">SUSPENSION</span></>,
    body: 'Precision hollow-core heel chassis engineered with dampening polymers. Absorbs horizontal impact vectors while propelling forward momentum with zero wasted energy.',
    stats: [
      { n: '12°', l: 'ANATOMIC PITCH' },
      { n: '3.4×', l: 'SHOCK DAMPENING' },
      { n: '0.4mm', l: 'FLEX SHELL' },
    ],
    features: [
      { num: '01', title: 'AERATION MESH', desc: 'Breathable mono-filament knit with multi-zone thermal dispersal.' },
      { num: '02', title: 'AIR SUSPENSION', desc: 'Twin pressurized nitrogen pods for dynamic rebound at high velocity.' },
    ],
  },
  {
    id: 'sc2',
    scrollId: 'performance',
    step: '03 / 04',
    align: 'l',
    label: '03 / 04 · Ground Contact',
    title: <>LIQUID-FORM <span className="highlight">TRACTION</span></>,
    body: 'High-density carbon fiber matrix with 128 micro-lug contact nodes. Fluid aerodynamic geometry locks onto multi-directional terrain with surgical grip.',
    stats: [
      { n: '128', l: 'KINETIC LUG NODES' },
      { n: '99.2%', l: 'KINETIC RETURN' },
      { n: '210g', l: 'CHASSIS WEIGHT' },
    ],
    features: [
      { num: '03', title: 'CARBON PLATE', desc: 'Sculpted aerospace carbon-fiber backbone offering torsional stiffness.' },
      { num: '04', title: 'ZERO-SLIP COMPOUND', desc: 'Custom formulated vulcanized polymer engineered for wet & dry surfaces.' },
    ],
  },
  {
    id: 'sc3',
    scrollId: 'shop',
    step: '04 / 04',
    align: 'c',
    label: '04 / 04 · Acquisition',
    title: <>STEP <span className="highlight">BEYOND</span></>,
    body: 'Handcrafted in limited seasonal batches for India. Every component precision-calibrated for athletes and creators who demand uncompromising performance.',
    shop: true,
    testimonials: true,
  },
]

const NAV_LINKS = [
  { label: 'Shop', to: 'shop' },
  { label: 'Technology', to: 'technology' },
  { label: 'About', to: 'shop' },
]

const N = SCENES.length
const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)
const ek = (k, dt) => 1 - Math.exp(-k * dt)

export default function App() {
  const lenisRef = useLenis()
  const panelRefs = useRef([])
  const pbRef = useRef(null)
  const counterRef = useRef(null)
  const bgOverlayRef = useRef(null)
  const railNodesRef = useRef([])
  const curRef = useRef(null)
  const ringRef = useRef(null)
  const mouse = useRef({ x: 0, y: 0, rx: 0, ry: 0 })

  const [activeStep, setActiveStep] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState('10.5')
  const [acquired, setAcquired] = useState(false)

  const isFine = typeof window !== 'undefined' && window.matchMedia('(pointer:fine)').matches

  /* Custom Cursor */
  useEffect(() => {
    if (!isFine) return
    const onMove = e => { mouse.current.x = e.clientX; mouse.current.y = e.clientY }
    document.addEventListener('mousemove', onMove, { passive: true })

    const big = () => {
      if (curRef.current) { curRef.current.style.width = '12px'; curRef.current.style.height = '12px' }
      if (ringRef.current) { ringRef.current.style.width = '48px'; ringRef.current.style.height = '48px'; ringRef.current.style.borderColor = 'rgba(255,255,255,0.7)' }
    }
    const sm = () => {
      if (curRef.current) { curRef.current.style.width = '6px'; curRef.current.style.height = '6px' }
      if (ringRef.current) { ringRef.current.style.width = '32px'; ringRef.current.style.height = '32px'; ringRef.current.style.borderColor = 'rgba(255,255,255,0.35)' }
    }

    document.querySelectorAll('a, button, .nu-rail-node').forEach(el => {
      el.addEventListener('mouseenter', big)
      el.addEventListener('mouseleave', sm)
    })
    return () => document.removeEventListener('mousemove', onMove)
  }, [isFine])

  /* Main Animation Frame */
  useEffect(() => {
    let rafId
    let lastStep = -1
    const m = mouse.current
    const DT = 1 / 60

    function frame() {
      rafId = requestAnimationFrame(frame)

      const scrollY = window.__lenis ? window.__lenis.scroll : window.scrollY
      const maxScroll = (N - 1) * window.innerHeight
      const progress = clamp(scrollY / maxScroll, 0, 1)
      const sf = clamp(scrollY / window.innerHeight, 0, N - 1)

      // Progress bar
      if (pbRef.current) {
        pbRef.current.style.transform = `scaleX(${progress})`
      }

      // Background overlay opacity based on scroll
      if (bgOverlayRef.current) {
        if (sf > 0.15) {
          bgOverlayRef.current.classList.add('scrolled')
        } else {
          bgOverlayRef.current.classList.remove('scrolled')
        }
      }

      // Current Step calculation
      const currentIdx = Math.min(Math.round(sf), N - 1)
      if (currentIdx !== lastStep) {
        lastStep = currentIdx
        setActiveStep(currentIdx)
        if (counterRef.current) {
          counterRef.current.textContent = `0${currentIdx + 1} / 04`
        }
      }

      // Panel animations
      for (let i = 0; i < panelRefs.current.length; i++) {
        const p = panelRefs.current[i]
        if (!p) continue
        const dist = sf - i
        const adist = Math.abs(dist)

        if (adist > 1.8) {
          p.style.visibility = 'hidden'
          continue
        }
        p.style.visibility = 'visible'

        const op = clamp(1 - adist * 1.3, 0, 1)
        const sc = lerp(0.94, 1, clamp(1 - adist * 0.85, 0, 1))
        const isMobile = window.innerWidth <= 768

        let tx = 0, ty = 0
        if (isMobile) {
          ty = clamp(dist * 40, -60, 60)
        } else if (SCENES[i].align === 'c') {
          ty = clamp(dist * 50, -80, 80)
        } else if (SCENES[i].align === 'r') {
          tx = clamp(dist * -65, -95, 95)
        } else {
          tx = clamp(dist * 65, -95, 95)
        }

        p.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`
        p.style.opacity = op
        p.style.pointerEvents = adist < 0.45 ? 'all' : 'none'
      }

      // Smooth custom cursor
      if (isFine) {
        m.rx = lerp(m.rx, m.x, ek(14, DT))
        m.ry = lerp(m.ry, m.y, ek(14, DT))
        if (curRef.current) { curRef.current.style.left = m.x + 'px'; curRef.current.style.top = m.y + 'px' }
        if (ringRef.current) { ringRef.current.style.left = m.rx + 'px'; ringRef.current.style.top = m.ry + 'px' }
      }
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [isFine])

  /* Keyboard Navigation */
  useEffect(() => {
    const keys = e => {
      const cur = Math.round((window.__lenis?.scroll ?? window.scrollY) / window.innerHeight)
      const next = e.key === 'ArrowDown' || e.key === 'PageDown' ? Math.min(cur + 1, N - 1)
        : e.key === 'ArrowUp' || e.key === 'PageUp' ? Math.max(cur - 1, 0)
        : null
      if (next === null) return
      goToScene(next)
    }
    document.addEventListener('keydown', keys)
    return () => document.removeEventListener('keydown', keys)
  }, [])

  const goToScene = idx => {
    const target = idx * window.innerHeight
    if (window.__lenis) window.__lenis.scrollTo(target, { duration: 1.2 })
    else window.scrollTo({ top: target, behavior: 'smooth' })
  }

  const SCROLL_OFFSET = typeof window !== 'undefined' && window.innerWidth <= 768 ? -50 : -70

  return (
    <>
      {/* Custom Cursor */}
      {isFine && (
        <>
          <div id="cur" ref={curRef} />
          <div id="cur-ring" ref={ringRef} />
        </>
      )}

      {/* ── Fixed Background Viewport (Image Format requested by user) ── */}
      <div id="nu-bg" />
      <div id="nu-bg-overlay" ref={bgOverlayRef} />

      {/* Top Progress Line */}
      <div id="pb" ref={pbRef} />

      {/* ── Fixed Ambient Accents (Mockup Elements) ── */}
      {/* Bottom Left: 01 / 04 */}
      <div className="nu-bottom-left">
        <span className="nu-counter" ref={counterRef}>01 / 04</span>
        <div className="nu-counter-line" />
      </div>

      {/* Bottom Right: STEP BEYOND. */}
      <div className="nu-bottom-right">STEP BEYOND.</div>

      {/* Right Progress Rail with Ring indicator */}
      <div id="nu-rail">
        {SCENES.map((_, i) => (
          <div
            key={i}
            className={`nu-rail-node${activeStep === i ? ' active' : ''}`}
            onClick={() => goToScene(i)}
            title={`Scene 0${i + 1}`}
          >
            <div className="nu-rail-ring" />
            <div className="nu-rail-dot" />
          </div>
        ))}
      </div>

      {/* ── Top Navigation (SHOP | TECHNOLOGY | ABOUT) ── */}
      <nav id="nav">
        <Link
          className="nav-brand"
          to="home"
          smooth
          duration={1200}
          offset={SCROLL_OFFSET}
        >
          <img src="/images/nu-logo-only.png" alt="NU" className="nav-logo-img" />
        </Link>

        {/* Desktop Nav Links */}
        <ul className="nav-links">
          {NAV_LINKS.map(l => (
            <li key={l.label}>
              <Link
                to={l.to}
                smooth
                duration={1200}
                offset={SCROLL_OFFSET}
                spy
                activeClass="active"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile Hamburger */}
        <button
          id="menu-btn"
          className={mobileOpen ? 'open' : ''}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Navigation Menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile Drawer */}
      <div id="mobile-nav" className={mobileOpen ? 'open' : ''}>
        {NAV_LINKS.map(l => (
          <Link
            key={l.label}
            to={l.to}
            smooth
            duration={1200}
            offset={SCROLL_OFFSET}
            onClick={() => setMobileOpen(false)}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* ── 3D Canvas — always visible, shoe animates from scene 0 through all 4 scenes ── */}
      <CanvasErrorBoundary>
        <Scene3D />
      </CanvasErrorBoundary>

      {/* ── Scroll Content (4 Scenes × 100vh) ── */}
      <div id="content">
        {SCENES.map((sc, i) => (
          <div className="scene" key={sc.id} id={sc.scrollId}>
            <div className="pin">
              <div
                className={`panel${sc.align === 'r' ? ' r' : sc.align === 'c' ? ' c' : ''}`}
                ref={el => { panelRefs.current[i] = el }}
              >
                <div className="pc">

                  {/* ── SCENE 1: HERO (EXACT FORMAT MATCH TO MOCKUP) ── */}
                  {sc.isHero && (
                    <div className="hero-brand-block">
                      {/* Official NU Brand Emblem */}
                      <img src="/images/nu-logo-only.png" alt="NU" className="hero-nu-logo" />

                      {/* MOVE DIFFERENT. */}
                      <h1 className="hero-slogan">MOVE DIFFERENT.</h1>

                      {/* Subtitles */}
                      <div className="hero-subtext">
                        Engineered for more.<br />
                        Designed for you.
                      </div>

                      {/* Thin vertical accent line with star sparkle */}
                      <div className="hero-sparkle-line">
                        <div className="v-line" />
                        <span className="star">✦</span>
                      </div>

                      {/* Actions: single EXPLORE → pill */}
                      <div className="nu-actions-row">
                        <Link
                          className="nu-btn-pill"
                          to="technology"
                          smooth
                          duration={1200}
                          offset={SCROLL_OFFSET}
                        >
                          EXPLORE <span className="arr">→</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* ── SCENES 2 & 3: TECHNOLOGY & PERFORMANCE ── */}
                  {!sc.isHero && !sc.shop && (
                    <>
                      <span className="p-label">{sc.label}</span>
                      <div className="p-title">{sc.title}</div>
                      {sc.body && <p className="p-body">{sc.body}</p>}

                      {/* Metric Stats */}
                      {sc.stats && (
                        <div className="p-stats">
                          {sc.stats.map(s => (
                            <div className="st-item" key={s.l}>
                              <div className="st-n">{s.n}</div>
                              <div className="st-l">{s.l}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Features Cards */}
                      {sc.features && (
                        <div className="nu-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '1.6rem' }}>
                          {sc.features.map(f => (
                            <div className="nu-card" key={f.title}>
                              <div className="nu-card-num">{f.num}</div>
                              <h4>{f.title}</h4>
                              <p>{f.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── SCENE 4: SHOP & STEP BEYOND ── */}
                  {sc.shop && (
                    <>
                      <span className="p-label">{sc.label}</span>
                      <div className="p-title">{sc.title}</div>
                      <p className="p-body">{sc.body}</p>

                      {/* Acquisition Card & Size Selector */}
                      <div className="nu-shop-box">
                        <div style={{ textAlign: 'left' }}>
                          <div className="nu-price">₹24,999</div>
                          <div style={{ fontSize: '0.62rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)', marginTop: '0.2rem', textTransform: 'uppercase' }}>
                            Incl. GST & Express Delivery in India
                          </div>
                        </div>

                        {/* Sizes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Select Size (UK / India)</div>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'].map(sz => (
                              <button
                                key={sz}
                                onClick={() => setSelectedSize(sz)}
                                style={{
                                  padding: '0.45rem 0.8rem',
                                  background: selectedSize === sz ? '#ffffff' : 'rgba(255,255,255,0.06)',
                                  color: selectedSize === sz ? '#070709' : '#ffffff',
                                  border: '1px solid rgba(255,255,255,0.18)',
                                  borderRadius: '3px',
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          className="nu-btn-primary"
                          onClick={() => setAcquired(true)}
                        >
                          {acquired ? 'PAIRED & RESERVED IN INDIA ✓' : 'PRE-ORDER NOW — ₹24,999'}
                        </button>
                      </div>

                      {/* Testimonials from Indian Creators & Athletes */}
                      <div className="nu-testimonials">
                        <div className="nu-quote-card">
                          <p className="nu-quote-text">
                            "NU completely redefines footwear ergonomics on Indian tarmac. The adaptive hollow-core suspension makes uneven city streets feel like a track."
                          </p>
                          <span className="nu-quote-author">Arjun Singhania · Bengaluru, Karnataka</span>
                        </div>
                        <div className="nu-quote-card">
                          <p className="nu-quote-text">
                            "The liquid metal aesthetics turn heads everywhere in Bandra. Unrivaled comfort from morning shoots to late night runs across Mumbai."
                          </p>
                          <span className="nu-quote-author">Meera Nambiar · Mumbai, Maharashtra</span>
                        </div>
                        <div className="nu-quote-card">
                          <p className="nu-quote-text">
                            "Finally, a world-class engineered sneaker directly available with India pricing. The carbon sole snap and lightweight feel are unreal."
                          </p>
                          <span className="nu-quote-author">Kabir Sen · New Delhi</span>
                        </div>
                        <div className="nu-quote-card">
                          <p className="nu-quote-text">
                            "Exceptional biomechanics. The 12° anatomic pitch significantly reduces heel and Achilles impact during high intensity training."
                          </p>
                          <span className="nu-quote-author">Dr. Rohit Verma · Hyderabad, Telangana</span>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ── Footer ── */}
        <footer>
          <span>© 2025 NU FOOTWEAR INDIA. ALL RIGHTS RESERVED.</span>
          <span>BENGALURU · MUMBAI · NEW DELHI · HYDERABAD</span>
        </footer>
      </div>
    </>
  )
}
