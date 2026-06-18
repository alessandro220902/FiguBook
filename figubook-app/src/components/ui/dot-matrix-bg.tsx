import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cn } from '@/lib/utils'

// Effetto sfondo a matrice di puntini (estratto da 21st sign-in-flow-1, erikx),
// ricolorato identita' FiguBook. Solo l'effetto: niente flusso/navbar/next.

type Uniforms = { [key: string]: { value: number[] | number[][] | number; type: string } }

interface ShaderProps {
  source: string
  uniforms: Uniforms
  maxFps?: number
}

export const CanvasRevealEffect = ({
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[194, 242, 61]],
  containerClassName,
  dotSize,
  showGradient = true,
}: {
  opacities?: number[]
  colors?: number[][]
  containerClassName?: string
  dotSize?: number
  showGradient?: boolean
}) => {
  return (
    <div className={cn('h-full relative w-full', containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[194, 242, 61]]}
          dotSize={dotSize ?? 3}
          opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
          center={['x', 'y']}
        />
      </div>
      {showGradient && <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />}
    </div>
  )
}

interface DotMatrixProps {
  colors?: number[][]
  opacities?: number[]
  totalSize?: number
  dotSize?: number
  center?: ('x' | 'y')[]
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  center = ['x', 'y'],
}) => {
  const uniforms = useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]]
    if (colors.length === 2) {
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]]
    } else if (colors.length === 3) {
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]]
    }
    return {
      u_colors: {
        value: colorsArray.map((color) => [color[0] / 255, color[1] / 255, color[2] / 255]),
        type: 'uniform3fv',
      },
      u_opacities: { value: opacities, type: 'uniform1fv' },
      u_total_size: { value: totalSize, type: 'uniform1f' },
      u_dot_size: { value: dotSize, type: 'uniform1f' },
      u_reverse: { value: 0, type: 'uniform1i' },
    }
  }, [colors, opacities, totalSize, dotSize])

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;
        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;
        out vec4 fragColor;
        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) { return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x); }
        void main() {
            vec2 st = fragCoord.xy;
            ${center.includes('x') ? 'st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));' : ''}
            ${center.includes('y') ? 'st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));' : ''}
            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);
            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));
            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));
            vec3 color = u_colors[int(show_offset * 6.0)];
            float animation_speed_factor = 0.5;
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);
            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
            opacity *= step(timing_offset_intro, u_time * animation_speed_factor);
            opacity *= clamp((1.0 - step(timing_offset_intro + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  )
}

const ShaderMaterial = ({ source, uniforms }: { source: string; uniforms: Uniforms; maxFps?: number }) => {
  const { size } = useThree()
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const material = ref.current.material as THREE.ShaderMaterial
    material.uniforms.u_time.value = clock.getElapsedTime()
  })

  const getUniforms = () => {
    const prepared: Record<string, { value: unknown; type?: string }> = {}
    for (const name in uniforms) {
      const u = uniforms[name] as { value: number | number[] | number[][]; type: string }
      switch (u.type) {
        case 'uniform1f':
          prepared[name] = { value: u.value, type: '1f' }
          break
        case 'uniform1i':
          prepared[name] = { value: u.value, type: '1i' }
          break
        case 'uniform1fv':
          prepared[name] = { value: u.value, type: '1fv' }
          break
        case 'uniform3fv':
          prepared[name] = {
            value: (u.value as number[][]).map((v) => new THREE.Vector3().fromArray(v)),
            type: '3fv',
          }
          break
        default:
          break
      }
    }
    prepared['u_time'] = { value: 0, type: '1f' }
    prepared['u_resolution'] = { value: new THREE.Vector2(size.width * 2, size.height * 2) }
    return prepared
  }

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        in vec2 coordinates;
        uniform vec2 u_resolution;
        out vec2 fragCoord;
        void main(){
          float x = position.x;
          float y = position.y;
          gl_Position = vec4(x, y, 0.0, 1.0);
          fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
          fragCoord.y = u_resolution.y - fragCoord.y;
        }`,
      fragmentShader: source,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      uniforms: getUniforms() as any,
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, source])

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  )
}

export default CanvasRevealEffect
