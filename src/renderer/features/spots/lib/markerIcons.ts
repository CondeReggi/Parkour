/**
 * Íconos custom para los markers del mapa. Usamos `divIcon` (HTML puro)
 * en lugar de los markers PNG default de Leaflet por dos razones:
 *  1. Los markers PNG de Leaflet tienen el clásico bug de bundlers
 *     (no resuelven el path en builds tipo Vite sin patch).
 *  2. Queremos respetar la identidad de marca: naranja primary, con
 *     borde sutil para que destaque sobre cualquier tile.
 *
 * Las clases CSS .spot-marker y .current-location-marker viven en
 * globals.css y leen las CSS vars del tema activo (primary / card).
 */

import L from 'leaflet'

let spotIcon: L.DivIcon | null = null
let favoriteIcon: L.DivIcon | null = null
let currentLocationIcon: L.DivIcon | null = null

export function getSpotIcon(): L.DivIcon {
  if (!spotIcon) {
    spotIcon = L.divIcon({
      className: 'spot-marker',
      html: '<div class="spot-marker__pin"></div>',
      iconSize: [24, 30],
      iconAnchor: [12, 28],
      popupAnchor: [0, -28]
    })
  }
  return spotIcon
}

export function getFavoriteSpotIcon(): L.DivIcon {
  if (!favoriteIcon) {
    favoriteIcon = L.divIcon({
      className: 'spot-marker spot-marker--favorite',
      html: '<div class="spot-marker__pin spot-marker__pin--favorite"></div>',
      iconSize: [28, 34],
      iconAnchor: [14, 32],
      popupAnchor: [0, -32]
    })
  }
  return favoriteIcon
}

export function getCurrentLocationIcon(): L.DivIcon {
  if (!currentLocationIcon) {
    currentLocationIcon = L.divIcon({
      className: 'current-location-marker',
      html: '<div class="current-location-marker__dot"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    })
  }
  return currentLocationIcon
}
