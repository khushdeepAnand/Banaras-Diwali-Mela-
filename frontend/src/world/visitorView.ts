export type CameraMode = 'third' | 'first'
export type VisitorTool = 'none' | 'wardrobe' | 'photo' | 'help' | 'journey' | 'rangoli' | 'social'
export type PhotoPreset = 'orbit' | 'ganga' | 'ghats' | 'market' | 'wheel' | 'fireworks' | 'festival'
export type VisitorView = { camera: CameraMode; tool: VisitorTool; yaw: number; pitch: number; distance: number; preset: PhotoPreset }
export type CaptureJob = { resolve: (image: Blob) => void; reject: (error: Error) => void }
export type CaptureQueue = { job: CaptureJob | null }
export const PHOTO_PRESETS = {
  festival: { label: 'Ganga, ghats & lights', eye: [22, 7, -9], target: [-4, 3, 8] },
  ganga: { label: 'Ganga riverfront', eye: [0, 4.2, 9], target: [-4, 1, -12] },
  ghats: { label: 'Illuminated ghats', eye: [-24, 6, 7], target: [0, 6, 24] },
  market: { label: 'Market stalls', eye: [0, 4.6, 12], target: [0, 5, 17] },
  wheel: { label: 'Ferris wheel', eye: [4, 6, 14], target: [15.5, 7.25, 5] },
  fireworks: { label: 'Fireworks viewing', eye: [0, 5.5, 9], target: [0, 18, -22] },
} as const
