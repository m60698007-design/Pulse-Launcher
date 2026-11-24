import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { colorFromString, lighten, makeSpineTexture, makeBackTexture, getFallbackCoverDataUrl } from '../three/textures'
import { STATUS_META } from '../meta'

const CASE_W = 0.62   // spine-to-spine width (x)
const CASE_H = 0.92   // height (y)
const CASE_D = 0.09   // thickness/depth (z)
const SHELF_Y = -0.62 // top surface of the shelf plank
export const CASE_SPACING = CASE_W + 0.07

export default function GameCase({ game, index, count, selected, flipped = false, spinRef, resetNonce = 0, onSelect, onLaunch }) {
  const group = useRef()
  const mesh = useRef()
  const { gl } = useThree()

  const [dragging, setDragging] = useState(false)
  const dragInfo = useRef(null)
  const targetRot = useRef({ x: 0, y: 0 })
  const pulled = useRef(0) // 0 = on shelf, 1 = fully pulled out

  // layout: side by side centered on x axis
  const spacing = CASE_SPACING
  const x = (index - (count - 1) / 2) * spacing
  const restY = SHELF_Y + CASE_H / 2 + 0.01

  const spineColor = useMemo(() => colorFromString(game.name || 'game'), [game.name])

  const coverUrl = game.coverDataUrl || (game.cover ? null : getFallbackCoverDataUrl(game.name))
  const coverTex = useTexture(coverUrl || getFallbackCoverDataUrl(game.name))
  coverTex.colorSpace = THREE.SRGBColorSpace
  coverTex.anisotropy = 8

  // Case finish -> PBR material props (Steelbook = metallic, Holographic = iridescent)
  const finish = game.finish || 'standard'
  const finishProps = useMemo(() => {
    switch (finish) {
      case 'steelbook':
        return { roughness: 0.22, metalness: 0.9, clearcoat: 0.7, clearcoatRoughness: 0.2, envMapIntensity: 1.5 }
      case 'holographic':
        return { roughness: 0.15, metalness: 0.65, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 1, iridescenceIOR: 1.3, envMapIntensity: 1.6 }
      default:
        return { roughness: 0.55, metalness: 0.05, envMapIntensity: 1 }
    }
  }, [finish])
  const coverEnv = finish === 'standard' ? 1 : 1.35

  const statusMeta = STATUS_META[game.status || 'backlog'] || STATUS_META.backlog

  const spineTex = useMemo(() => makeSpineTexture(game.name || 'Game', spineColor), [game.name, spineColor])
  const spineTexM = useMemo(() => makeSpineTexture(game.name || 'Game', spineColor, true), [game.name, spineColor])
  const backTex = useMemo(
    () => makeBackTexture(game, spineColor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game.name, game.notes, game.hoursPlayed, spineColor],
  )

  // dispose canvas textures on unmount / change
  useEffect(() => () => {
    spineTex.dispose()
    spineTexM.dispose()
    backTex.dispose()
  }, [spineTex, spineTexM, backTex])

  // drag-to-rotate with mouse (only while pulled out)
  useEffect(() => {
    if (!selected) return
    const el = gl.domElement

    const onMove = (e) => {
      if (!dragInfo.current) return
      const dx = e.clientX - dragInfo.current.x
      const dy = e.clientY - dragInfo.current.y
      dragInfo.current.x = e.clientX
      dragInfo.current.y = e.clientY
      if (Math.abs(dx) + Math.abs(dy) > 2) dragInfo.current.moved = true
      targetRot.current.y += dx * 0.012
      targetRot.current.x = THREE.MathUtils.clamp(targetRot.current.x + dy * 0.008, -0.7, 0.7)
    }
    const onUp = () => {
      dragInfo.current = null
      setDragging(false)
    }
    el.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [selected, gl])

  // reset drag rotation when the case is deselected or the parent asks for a reset
  useEffect(() => {
    if (!selected || resetNonce) {
      targetRot.current = { x: 0, y: 0 }
      setDragging(false)
    }
  }, [selected, resetNonce])

  useFrame((state, dt) => {
    if (!group.current) return

    // right-stick live rotation while selected
    if (selected && spinRef && spinRef.current) {
      const { x, y } = spinRef.current
      if (x || y) {
        targetRot.current.y += x * dt * 2.6
        targetRot.current.x = THREE.MathUtils.clamp(targetRot.current.x + y * dt * 2.0, -0.7, 0.7)
      }
    }

    // pull-out amount eases toward 1 when selected
    pulled.current = THREE.MathUtils.damp(pulled.current, selected ? 1 : 0, 6, dt)
    const p = pulled.current

    const targetZ = p * 1.9
    const targetY = restY + p * 0.15
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, targetZ, 6, dt)
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, targetY, 6, dt)

    // rotation eases toward drag target; 180° flip shows the back cover
    const baseY = flipped && selected ? Math.PI : 0
    const targetRY = baseY + (selected ? targetRot.current.y : 0)
    const targetRX = selected ? targetRot.current.x : 0
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetRY, dragging ? 30 : 8, dt)
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetRX, dragging ? 30 : 8, dt)

    // subtle shelf idle sway
    if (!selected) {
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + index) * 0.004
    } else {
      group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, 0, 8, dt)
    }
  })

  const edge = '#0a0a12'

  return (
    <group ref={group} position={[x, restY, 0]}>
      <mesh
        ref={mesh}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation()
          if (!(dragInfo.current && dragInfo.current.moved)) onSelect(game.id)
        }}
        onPointerDown={(e) => {
          if (!selected) return
          e.stopPropagation()
          dragInfo.current = { x: e.clientX, y: e.clientY, moved: false }
          setDragging(true)
          document.body.style.cursor = 'grabbing'
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = selected ? 'grab' : 'pointer'
        }}
        onPointerOut={() => {
          if (!dragging) document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[CASE_W, CASE_H, CASE_D]} />
        {/* material order: +x, -x, +y, -y, +z (front), -z (back) */}
        <meshPhysicalMaterial attach="material-0" map={spineTex} {...finishProps} />
        <meshPhysicalMaterial attach="material-1" map={spineTexM} {...finishProps} />
        <meshPhysicalMaterial attach="material-2" color={edge} {...finishProps} />
        <meshPhysicalMaterial attach="material-3" color={edge} {...finishProps} />
        <meshStandardMaterial attach="material-4" map={coverTex} roughness={0.35} metalness={0.02} envMapIntensity={coverEnv} />
        <meshPhysicalMaterial attach="material-5" map={backTex} {...finishProps} />
      </mesh>

      {/* completion status badge floating above the case */}
      <Html
        position={[0, CASE_H / 2 + 0.14, 0]}
        center
        zIndexRange={[5, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur ${statusMeta.chip}`}
          title={`${statusMeta.label} · ${finish === 'standard' ? 'Standard' : finish === 'steelbook' ? 'Steelbook' : 'Holographic'} finish`}
        >
          {statusMeta.label}
        </div>
      </Html>

      {/* thin glowing base strip when selected */}
      {selected && (
        <mesh position={[0, -CASE_H / 2 - 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CASE_W * 0.9, 0.02]} />
          <meshBasicMaterial color={lighten(spineColor, 20)} transparent opacity={0.8} />
        </mesh>
      )}

      {/* floating label + launch button */}
      {selected && (
        <Html
          position={[0, CASE_H / 2 + 0.28, 0]}
          center
          zIndexRange={[30, 0]}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex flex-col items-center gap-2 whitespace-nowrap">
            <div
              className="rounded-md px-3 py-1 text-xs font-bold text-white backdrop-blur"
              style={{
                background: spineColor,
                boxShadow: `0 0 18px ${spineColor}, 0 0 40px ${spineColor}66`,
              }}
            >
              {game.name}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLaunch(game)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-lg px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white transition-transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                boxShadow: '0 0 20px rgba(59,130,246,0.8), 0 0 50px rgba(99,102,241,0.4), inset 0 0 12px rgba(255,255,255,0.15)',
              }}
            >
              ▶ Launch Game
            </button>
          </div>
        </Html>
      )}
    </group>
  )
}
