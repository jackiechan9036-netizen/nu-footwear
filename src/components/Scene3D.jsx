import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, useProgress } from '@react-three/drei'
import ShoeModel from './ShoeModel'

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'}}>
        <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:'1.3rem',letterSpacing:'.4em',color:'#ffffff',fontWeight:700}}>NU</div>
        <div style={{width:160,height:1,background:'rgba(255,255,255,.1)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:'0 auto 0 0',background:'linear-gradient(90deg, #888, #fff)',width:`${progress}%`,transition:'width .1s'}}/>
        </div>
        <div style={{fontSize:'.55rem',letterSpacing:'.3em',color:'rgba(255,255,255,.4)'}}>{Math.round(progress)}%</div>
      </div>
    </Html>
  )
}

export default function Scene3D() {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1
  return (
    <div style={{position:'fixed',inset:0,zIndex:1,pointerEvents:'none'}}>
      <Canvas
        camera={{ position:[0,0,3.5], fov:42, near:0.05, far:50 }}
        gl={{
          antialias: dpr < 2,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        dpr={dpr}
        shadows
        onCreated={({gl}) => {
          gl.toneMapping = 3
          gl.toneMappingExposure = 1.2
          gl.shadowMap.autoUpdate = false
          gl.shadowMap.needsUpdate = true
        }}
        style={{background:'transparent'}}
      >
        <ambientLight intensity={0.4} color="#e0e8f5" />
        <directionalLight position={[6,10,7]} intensity={2.8} color="#ffffff"
          castShadow shadow-mapSize-width={512} shadow-mapSize-height={512}/>
        <directionalLight position={[-6,-2,4]} intensity={1.2} color="#8da0b8"/>
        <directionalLight position={[0,-6,-5]} intensity={0.8} color="#556070"/>
        <pointLight position={[-2,3,2]} intensity={2.4} color="#dbe5f0" distance={16}/>
        <pointLight position={[3,-2,2]} intensity={1.5} color="#ffffff" distance={10}/>
        <Suspense fallback={<Loader/>}>
          <ShoeModel />
        </Suspense>
      </Canvas>
    </div>
  )
}
