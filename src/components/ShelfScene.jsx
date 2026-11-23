import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import GameCase from './GameCase'

const SHELF_W = 30
const SHELF_D = 2.2
const SHELF_T = 0.14
const SHELF_Y = -0.62 // top surface

function Shelf() {
  return (
    <group>
      {/* wooden shelf plank */}
      <mesh position={[0, SHELF_Y - SHELF_T / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[SHELF_W, SHELF_T, SHELF_D]} />
        <meshStandardMaterial color="#3d2b1c" roughness={0.75} metalness={0.05} />
      </mesh>
      {/* front lip */}
      <mesh position={[0, SHELF_Y - SHELF_T / 2, SHELF_D / 2 - 0.03]}>
        <boxGeometry args={[SHELF_W, SHELF_T * 0.7, 0.06]} />
        <meshStandardMaterial color="#2c1d12" roughness={0.8} />
      </mesh>
      {/* back wall panel for depth */}
      <mesh position={[0, 2.2, -SHELF_D / 2 - 0.05]} receiveShadow>
        <boxGeometry args={[SHELF_W, 6, 0.1]} />
        <meshStandardMaterial color="#101018" roughness={0.95} />
      </mesh>
      {/* subtle wall glow strip */}
      <mesh position={[0, 3.4, -SHELF_D / 2 - 0.02]}>
        <boxGeometry args={[SHELF_W, 0.06, 0.02]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

export default function ShelfScene({ games, onLaunch }) {
  const [selectedId, setSelectedId] = useState(null)

  const handleSelect = (id) => setSelectedId((cur) => (cur === id ? null : id))

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.55, games.length > 8 ? 7.5 : 5.2], fov: 42, near: 0.1, far: 60 }}
      gl={{ antialias: true }}
      onPointerMissed={() => setSelectedId(null)}
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #141428 0%, #0b0b12 70%)' }}
    >
      <Suspense fallback={null}>
        {/* lighting: warm key + cool fill + shelf spots */}
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[4, 6, 5]}
          intensity={1.1}
          color="#fff4e0"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={6}
          shadow-camera-bottom={-4}
        />
        <directionalLight position={[-5, 3, 2]} intensity={0.3} color="#7aa2ff" />
        <spotLight position={[0, 4.5, 1.5]} angle={0.7} penumbra={0.8} intensity={60} color="#ffd9a0" castShadow />
        <pointLight position={[0, 1.2, 3]} intensity={8} color="#4f7cff" />

        <Shelf />
        <ContactShadows position={[0, SHELF_Y + 0.001, 0.4]} opacity={0.55} scale={30} blur={2.2} far={2} resolution={512} color="#000000" />

        {games.map((game, i) => (
          <GameCase
            key={game.id}
            game={game}
            index={i}
            count={games.length}
            selected={selectedId === game.id}
            onSelect={handleSelect}
            onLaunch={onLaunch}
          />
        ))}

        {/* image-based lighting for nicer case materials */}
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 5, 3]} scale={[10, 4, 1]} color="#cfe4ff" />
          <Lightformer intensity={1} position={[-5, 2, -1]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#ffd9a0" />
          <Lightformer intensity={0.8} position={[5, 2, -1]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} color="#8fb0ff" />
        </Environment>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableRotate={false}
          enableZoom
          minDistance={2.2}
          maxDistance={14}
          minPolarAngle={0.35}
          maxPolarAngle={1.45}
          target={[0, 0.1, 0]}
        />
      </Suspense>
    </Canvas>
  )
}
