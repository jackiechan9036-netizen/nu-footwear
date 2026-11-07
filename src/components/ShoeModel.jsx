import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'

/**
 * ShoeModel — 4-scene scroll-driven 3D animation for NU.
 *
 * 0: HERO (Move Different)
 * 1: TECHNOLOGY (The Heel & Adaptive Suspension)
 * 2: PERFORMANCE (The Sole & Carbon Traction)
 * 3: STEP BEYOND (The Next Generation & Acquisition)
 */

// ── Desktop keyframes ─────────────────────────────────────────
const KF_DESKTOP = [
  { rx:-0.08, ry: 0.55, rz: 0.04, px: 0.55, py: 0.08, sc: 1.10, cz: 3.40 }, // 0 HERO
  { rx: 0.15, ry: 2.75, rz: 0.08, px:-0.62, py: 0.04, sc: 1.28, cz: 3.20 }, // 1 TECH (heel left)
  { rx: 1.48, ry: 0.25, rz: 0.00, px: 0.00, py:-0.16, sc: 1.28, cz: 3.00 }, // 2 SOLE (top-down)
  { rx: 0.10, ry: 6.28, rz: 0.00, px: 0.00, py: 0.08, sc: 0.90, cz: 3.90 }, // 3 SHOP (full spin)
]

// ── Tablet keyframes (≤1024px) ────────────────────────────────
const KF_TABLET = [
  { rx:-0.06, ry: 0.50, rz: 0.03, px: 0.30, py: 0.10, sc: 0.98, cz: 3.80 },
  { rx: 0.12, ry: 2.75, rz: 0.06, px:-0.35, py: 0.05, sc: 1.12, cz: 3.50 },
  { rx: 1.48, ry: 0.25, rz: 0.00, px: 0.00, py:-0.10, sc: 1.15, cz: 3.30 },
  { rx: 0.10, ry: 6.28, rz: 0.00, px: 0.00, py: 0.10, sc: 0.78, cz: 4.20 },
]

// ── Mobile keyframes (≤768px) ─────────────────────────────────
const KF_MOBILE = [
  { rx:-0.05, ry: 0.45, rz: 0.02, px: 0.00, py: 0.22, sc: 0.82, cz: 4.20 },
  { rx: 0.12, ry: 2.75, rz: 0.04, px: 0.00, py: 0.28, sc: 0.85, cz: 4.00 },
  { rx: 1.45, ry: 0.25, rz: 0.00, px: 0.00, py: 0.24, sc: 0.88, cz: 3.80 },
  { rx: 0.10, ry: 6.28, rz: 0.00, px: 0.00, py: 0.26, sc: 0.65, cz: 4.50 },
]

const N = KF_DESKTOP.length

const lerp  = (a,b,t) => a+(b-a)*t
const clamp = (v,lo,hi) => Math.min(Math.max(v,lo),hi)
const ss    = x => { const t=clamp(x,0,1); return t*t*(3-2*t) }
const ek    = (k,dt) => 1-Math.exp(-k*dt)

const _box = new THREE.Box3()
const _ctr = new THREE.Vector3()
const _sz  = new THREE.Vector3()

function getKF() {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200
  if (w <= 768)  return KF_MOBILE
  if (w <= 1024) return KF_TABLET
  return KF_DESKTOP
}

export default function ShoeModel() {
  const meshRef = useRef()
  const { camera } = useThree()
  const { scene: mdl } = useGLTF('/models/shoe.glb')
  const logoTexture = useTexture('/images/nu-logo-only.png')

  if (logoTexture) {
    logoTexture.encoding = THREE.sRGBEncoding
  }

  // Start v at HERO keyframe values
  const KF0 = KF_DESKTOP[0]
  const V = useRef({
    rx: KF0.rx, ry: KF0.ry, rz: KF0.rz,
    px: KF0.px, py: KF0.py, sc: KF0.sc, t: 0,
  })

  useEffect(() => {
    if (!mdl) return

    _box.setFromObject(mdl)
    _box.getCenter(_ctr)
    _box.getSize(_sz)
    const s = 1.8 / Math.max(_sz.x, _sz.y, _sz.z)
    mdl.scale.setScalar(s)
    mdl.position.copy(_ctr).multiplyScalar(-s)
    mdl.rotation.y = Math.PI * 0.08

    mdl.traverse(c => {
      if (c.isMesh && c.material) {
        c.material.transparent = false
        c.material.opacity = 1
        if (c.material.map) {
          c.material.map.encoding = THREE.sRGBEncoding
        }
        c.material.needsUpdate = true
      }
    })
  }, [mdl])

  useFrame((_, dt) => {
    if (!meshRef.current) return
    const v = V.current
    const d = Math.min(dt, 0.05)
    v.t += d

    const scrollY = window.__lenis ? window.__lenis.scroll : window.scrollY
    const KF = getKF()

    const sf = clamp(scrollY / window.innerHeight, 0, N - 1)
    const si = clamp(Math.floor(sf), 0, N - 2)
    const st = ss(sf - si)
    const A = KF[si], B = KF[Math.min(si + 1, N - 1)]

    const lf = ek(9, d)
    v.rx = lerp(v.rx, lerp(A.rx, B.rx, st), lf)
    v.ry = lerp(v.ry, lerp(A.ry, B.ry, st), lf)
    v.rz = lerp(v.rz, lerp(A.rz, B.rz, st), lf)
    v.px = lerp(v.px, lerp(A.px, B.px, st), lf)
    v.py = lerp(v.py, lerp(A.py, B.py, st), lf)
    v.sc = lerp(v.sc, lerp(A.sc, B.sc, st), lf)
    camera.position.z = lerp(camera.position.z, lerp(A.cz, B.cz, st), ek(6, d))

    // Idle float
    const fy = Math.sin(v.t * 0.68) * 0.025
    const fx = Math.cos(v.t * 0.41) * 0.010

    meshRef.current.rotation.x = v.rx + fx * 0.15
    meshRef.current.rotation.y = v.ry
    meshRef.current.rotation.z = v.rz + fx * 0.04
    meshRef.current.position.x = v.px + fx
    meshRef.current.position.y = v.py + fy
    meshRef.current.scale.setScalar(v.sc)

    meshRef.current.visible = true
  })

  return (
    <group ref={meshRef}>
      <primitive object={mdl} />

      {/* ── Brand Badges Projected on Shoe Surfaces ── */}
      {/* 1. Lateral Flank (Outer Midfoot facing camera in Hero) */}
      <mesh
        position={[-0.018, 0.045, 0.258]}
        rotation={[-0.22, 0.12, 0.06]}
      >
        <planeGeometry args={[0.22, 0.11]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent
          alphaTest={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Medial Flank (Inner Side) */}
      <mesh
        position={[-0.015, 0.065, -0.288]}
        rotation={[0.22, Math.PI - 0.12, -0.06]}
      >
        <planeGeometry args={[0.22, 0.11]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent
          alphaTest={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Upper Tongue */}
      <mesh
        position={[0.17, 0.23, -0.035]}
        rotation={[-0.88, 0, 0]}
      >
        <planeGeometry args={[0.13, 0.065]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent
          alphaTest={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

useGLTF.preload('/models/shoe.glb')
useTexture.preload('/images/nu-logo-only.png')
