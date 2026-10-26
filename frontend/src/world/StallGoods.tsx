import type { StallKind } from './bazaar'

// Local coordinates: display surface at y=1.26, back wall at positive z.
export function StallGoods({ kind, quality }: { kind: StallKind; quality: 'low' | 'medium' | 'high' }) {
  switch (kind) {
    case 'silk': return <group>
      {['#edab44', '#994c83', '#448d85', '#d45755', '#5276a2'].map((color, i) => <group key={color} position={[-1.7 + i * 0.85, 1.29 + i * 0.045, -0.84]}>
        <mesh castShadow><boxGeometry args={[0.7, 0.13, 0.55]} /><meshStandardMaterial color={color} roughness={1} /></mesh>
        <mesh position={[0, 0.075, -0.16]}><boxGeometry args={[0.68, 0.018, 0.06]} /><meshStandardMaterial color="#e8b878" /></mesh>
      </group>)}
      {[-1.18, 0, 1.18].map((x, i) => <group key={x} position={[x, 2.15, 1.08]}>
        <mesh><boxGeometry args={[0.86, 1.9, 0.07]} /><meshStandardMaterial color={['#8b344b', '#b68139', '#397c77'][i]} side={2} /></mesh>
        <mesh position={[0, -0.35, -0.05]}><boxGeometry args={[0.08, 1.15, 0.025]} /><meshStandardMaterial color="#edc37d" /></mesh>
      </group>)}
      {quality !== 'low' && [-0.85, 0.85].map(x => <mesh key={x} position={[x, 1.65, -0.61]} rotation={[0, 0, x * 0.25]}><torusGeometry args={[0.17, 0.018, 5, 14]} /><meshStandardMaterial color="#e5bc76" metalness={0.55} /></mesh>)}
    </group>
    case 'diya': return <group>
      {Array.from({ length: quality === 'low' ? 8 : 12 }, (_, i) => <group key={i} position={[-1.65 + (i % 6) * 0.65, 1.33, -0.83 + Math.floor(i / 6) * 0.36]}>
        <mesh><cylinderGeometry args={[0.16, 0.105, 0.11, 8]} /><meshStandardMaterial color="#9c5135" /></mesh>
        <mesh position={[0, 0.12, 0]}><coneGeometry args={[0.05, 0.17, 5]} /><meshStandardMaterial color="#ffda7c" emissive="#ff8b2c" emissiveIntensity={2} /></mesh>
      </group>)}
      {[-1.32, 1.32].map((x) => <group key={x} position={[x, 2.3, 0.75]}>
        <mesh><cylinderGeometry args={[0.23, 0.23, 0.7, 6]} /><meshStandardMaterial color="#bb704b" emissive="#b25535" emissiveIntensity={0.35} /></mesh>
        <mesh position={[0, 0.42, 0]}><coneGeometry args={[0.29, 0.2, 6]} /><meshStandardMaterial color="#f3bc67" /></mesh>
      </group>)}
      {quality !== 'low' && <mesh position={[0, 2.72, 0.82]}><torusGeometry args={[0.53, 0.07, 6, 18]} /><meshStandardMaterial color="#d99444" roughness={0.8} /></mesh>}
    </group>
    case 'flowers': return <group>
      {[-1.3, 0, 1.3].map((x, i) => <group key={x} position={[x, 1.32, -0.8]}>
        <mesh><cylinderGeometry args={[0.42, 0.33, 0.33, 10]} /><meshStandardMaterial color="#94724d" /></mesh>
        {Array.from({ length: quality === 'low' ? 5 : 9 }, (_, n) => <mesh key={n} position={[(n % 3 - 1) * 0.22, 0.22 + (n % 2) * 0.11, (Math.floor(n / 3) - 1) * 0.19]}>
          <sphereGeometry args={[0.17, 7, 5]} /><meshStandardMaterial color={i === 1 ? '#f2be48' : n % 2 ? '#ec8e34' : '#e7a72b'} />
        </mesh>)}
      </group>)}
      <mesh position={[0, 2.12, 0.8]}><cylinderGeometry args={[0.15, 0.24, 0.53, 10]} /><meshStandardMaterial color="#cba35e" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 2.4, 0.8]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#e0b76e" metalness={0.7} roughness={0.3} /></mesh>
      {quality !== 'low' && [-1.3, 1.3].map(x => <mesh key={x} position={[x, 2.43, 0.92]} rotation={[0, 0, x * 0.14]}><torusGeometry args={[0.22, 0.067, 6, 16]} /><meshStandardMaterial color="#e9a02c" roughness={0.82} /></mesh>)}
    </group>
    case 'food': return <group>
      {[-1.05, 0, 1.05].map((x, i) => <group key={x} position={[x, 1.38, -0.77]}>
        <mesh><cylinderGeometry args={[0.39 - i * 0.05, 0.3, 0.5 + i * 0.1, 10]} /><meshStandardMaterial color="#9c8b7d" metalness={0.65} roughness={0.38} /></mesh>
        <mesh position={[0, 0.3 + i * 0.05, 0]}><cylinderGeometry args={[0.39 - i * 0.05, 0.39 - i * 0.05, 0.06, 10]} /><meshStandardMaterial color="#d4b584" metalness={0.55} /></mesh>
      </group>)}
      {[-1.35, -0.7, 0.75, 1.4].map((x) => <mesh key={x} position={[x, 1.32, -1.22]}><sphereGeometry args={[0.19, 8, 6]} /><meshStandardMaterial color="#d89b4f" /></mesh>)}
      <mesh position={[1.6, 2.1, 0.65]}><boxGeometry args={[0.55, 1, 0.08]} /><meshStandardMaterial color="#352c2b" /></mesh>
      {quality === 'high' && [-0.7, 0.2, 0.9].map(x => <mesh key={x} position={[x, 2.14, -0.73]}><sphereGeometry args={[0.11, 6, 5]} /><meshBasicMaterial color="#c7bbad" transparent opacity={0.16} depthWrite={false} /></mesh>)}
    </group>
    case 'brass': return <group>
      {[1.5, 2.25].map((y) => <mesh key={y} position={[0, y, 1.0]}><boxGeometry args={[3.5, 0.1, 0.48]} /><meshStandardMaterial color="#633b32" /></mesh>)}
      {[-1.35, -0.5, 0.5, 1.35].map((x, i) => <group key={x} position={[x, 1.34, -0.8]}>
        <mesh><cylinderGeometry args={[0.26, 0.15, 0.43 + (i % 2) * 0.16, 12]} /><meshStandardMaterial color="#d2a449" metalness={0.78} roughness={0.25} /></mesh>
        <mesh position={[0, 0.28 + (i % 2) * 0.08, 0]}><torusGeometry args={[0.18, 0.04, 5, 12]} /><meshStandardMaterial color="#f0c770" metalness={0.75} /></mesh>
      </group>)}
      {[-1.1, 0, 1.1].map((x) => <mesh key={x} position={[x, 2.55, 1]}><sphereGeometry args={[0.23, 10, 8]} /><meshStandardMaterial color="#e1b25d" metalness={0.75} roughness={0.25} /></mesh>)}
      {quality !== 'low' && [-0.5, 0.5].map(x => <mesh key={x} position={[x, 2.69, 1]}><torusGeometry args={[0.16, 0.026, 5, 12]} /><meshStandardMaterial color="#f7da8c" metalness={0.65} roughness={0.3} /></mesh>)}
    </group>
    case 'sweets': return <group>
      {[-1.12, 0.05, 1.1].map((x, i) => <group key={x} position={[x, 1.33, -0.8]}>
        <mesh><boxGeometry args={[0.98, 0.07, 0.68]} /><meshStandardMaterial color="#c69b6c" metalness={0.3} /></mesh>
        {Array.from({ length: 6 }, (_, n) => <mesh key={n} position={[(n % 3 - 1) * 0.24, 0.12, (Math.floor(n / 3) - 0.5) * 0.26]}>
          <boxGeometry args={[0.18, 0.17, 0.2]} /><meshStandardMaterial color={['#f2c476', '#dfa16d', '#d9bc76'][i]} /></mesh>)}
      </group>)}
      {[-1, 0, 1].map((x) => <group key={x} position={[x, 2, 0.8]}>
        <mesh><cylinderGeometry args={[0.19, 0.15, 0.48, 9]} /><meshStandardMaterial color="#bd855e" /></mesh>
        <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.18, 0.18, 0.025, 9]} /><meshStandardMaterial color="#f8edc8" /></mesh>
      </group>)}
    </group>
  }
}
