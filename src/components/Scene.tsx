import { Sky } from '@react-three/drei'

export function SceneLighting() {
  return (
    <>
      {/* Ambient fill light */}
      <ambientLight intensity={0.4} color="#a0b8d0" />

      {/* Main sun light */}
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.8}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={150}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      {/* Rim light from opposite side */}
      <directionalLight
        position={[-20, 30, -40]}
        intensity={0.5}
        color="#b0c4ff"
      />

      {/* Ground bounce light */}
      <hemisphereLight
        color="#87ceeb"
        groundColor="#3d6b1e"
        intensity={0.3}
      />
    </>
  )
}

export function Environment() {
  return (
    <Sky
      distance={450000}
      sunPosition={[30, 50, 20]}
      inclination={0.6}
      azimuth={0.25}
      turbidity={8}
      rayleigh={0.5}
    />
  )
}
