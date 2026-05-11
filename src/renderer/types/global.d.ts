import type { ParkourApi } from '@shared/api'

declare global {
  interface Window {
    parkourApi: ParkourApi
  }
}

export {}
