// app/lib/zustandStore.ts
import {create} from 'zustand'

/**
 * SideFile represents an uploaded side (front/back).
 * We store:
 * - id: unique id
 * - name: filename
 * - type: 'pdf' | 'image'
 * - file: the original File object (optional but useful)
 * - url: object URL for preview (created via URL.createObjectURL(file))
 */
export type SideFile = {
  id: string
  name: string
  type: 'pdf' | 'image'
  file?: File
  url: string
}

type LayoutOptions = {
  paperSize: 'A4'|'B4'|'A3'|'Custom'
  paperWidthMm?: number
  paperHeightMm?: number
  cardWidthMm?: number
  cardHeightMm?: number
  cardCount: number
  horizontalOnly: boolean
  verticalOnly: boolean
  autoRotate: boolean
}

type Store = {
  // Wizard state
  isDoubleSided: boolean | null
  front?: SideFile
  back?: SideFile
  setSide: (side: 'front'|'back', file: SideFile) => void
  removeSide: (side: 'front'|'back') => void
  setDoubleSided: (v: boolean) => void
  resetWizard: () => void

  // Workspace state
  layout: LayoutOptions
  setLayout: (patch: Partial<LayoutOptions>) => void

  // Optimization result (rect placements)
  placements: any[]
  setPlacements: (p: any[]) => void
}

export const useStore = create<Store>((set, get) => ({
  // initial wizard state
  isDoubleSided: null,
  front: undefined,
  back: undefined,

  setSide: (side, file) => {
    // if there was a previous file, revoke its URL to avoid leaks
    const prev = get()[side]
    if (prev?.url) {
      try { URL.revokeObjectURL(prev.url) } catch (e) {}
    }
    set({ [side]: file } as any)
  },

  removeSide: (side) => {
    const prev = get()[side]
    if (prev?.url) {
      try { URL.revokeObjectURL(prev.url) } catch (e) {}
    }
    set({ [side]: undefined } as any)
  },

  setDoubleSided: (v) => set({ isDoubleSided: v }),

  resetWizard: () => {
    const { front, back } = get()
    if (front?.url) try { URL.revokeObjectURL(front.url) } catch (e) {}
    if (back?.url) try { URL.revokeObjectURL(back.url) } catch (e) {}
    set({ isDoubleSided: null, front: undefined, back: undefined })
  },

  // layout defaults (mm)
  layout: {
    paperSize: 'A4',
    paperWidthMm: 210,
    paperHeightMm: 297,
    cardWidthMm: 50,
    cardHeightMm: 90,
    cardCount: 10,
    horizontalOnly: false,
    verticalOnly: false,
    autoRotate: true,
  },
  setLayout: (patch) => set((s) => ({ layout: { ...s.layout, ...patch } })),

  placements: [],
  setPlacements: (p) => set({ placements: p }),
}))
