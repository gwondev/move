export const FALLBACK_ORG = '복지관'

const animationState = {
  playing: false,
  rafId: null,
  entries: new Map(),
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

const startAnimationLoop = (map) => {
  if (animationState.playing) return
  animationState.playing = true

  const step = () => {
    const now = performance.now()
    let hasActive = false

    animationState.entries.forEach((entry, id) => {
      const { marker, startLat, startLng, targetLat, targetLng, startedAt, duration } = entry
      if (!marker) {
        animationState.entries.delete(id)
        return
      }

      const elapsed = now - startedAt
      const t = Math.min(1, elapsed / duration)
      const eased = easeInOut(t)
      const nextLat = startLat + (targetLat - startLat) * eased
      const nextLng = startLng + (targetLng - startLng) * eased
      marker.setPosition(new window.kakao.maps.LatLng(nextLat, nextLng))

      if (t >= 1) {
        animationState.entries.delete(id)
      } else {
        hasActive = true
      }
    })

    if (hasActive && map) {
      animationState.rafId = requestAnimationFrame(step)
    } else {
      animationState.playing = false
      animationState.rafId = null
    }
  }

  animationState.rafId = requestAnimationFrame(step)
}

const normalizeBusItem = (raw) => {
  if (!raw) return null

  const lat = Number(
    raw.lat ?? raw.latitude ?? raw.latY ?? raw.latValue ?? raw?.gps?.lat ?? raw?.gps?.latitude
  )
  const lng = Number(
    raw.lng ?? raw.longitude ?? raw.lon ?? raw.long ?? raw?.gps?.lng ?? raw?.gps?.longitude
  )
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const id = String(raw.id ?? raw.busId ?? raw.vehicleId ?? raw.plateNumber ?? `${lat}-${lng}`)
  const name =
    raw.name ??
    raw.routeName ??
    raw.label ??
    raw.title ??
    raw.busName ??
    raw.plateNumber ??
    '운행 차량'

  const speedValue = Number(raw.speed ?? raw.velocity ?? raw.speedKm ?? raw.kmh ?? raw?.telemetry?.speed)
  const updatedRaw = raw.updatedAt ?? raw.timestamp ?? raw.lastUpdated ?? raw.time ?? raw?.telemetry?.timestamp
  const updatedAt = typeof updatedRaw === 'number'
    ? updatedRaw
    : typeof updatedRaw === 'string'
      ? Date.parse(updatedRaw)
      : undefined

  const orgRaw = raw.org ?? raw.organization ?? raw.orgName ?? raw.affiliation ?? raw.group
  const org = typeof orgRaw === 'string' && orgRaw.trim() ? orgRaw.trim() : undefined

  return {
    id,
    lat,
    lng,
    name,
    speed: Number.isFinite(speedValue) ? speedValue : undefined,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
    org: org || FALLBACK_ORG,
  }
}

const createOrUpdateBusOverlay = (item, position, mapInstance, existingOverlay) => {
  if (!window.kakao?.maps) return existingOverlay ?? null

  const { speed, updatedAt } = item
  const speedText = Number.isFinite(speed) ? `${Math.round(speed)} km/h` : '속도 정보 없음'
  const updatedText = (() => {
    if (!Number.isFinite(updatedAt)) return '업데이트 정보 없음'
    const diffSec = Math.max(0, Math.round((Date.now() - updatedAt) / 1000))
    if (diffSec < 1) return '방금 업데이트'
    if (diffSec < 60) return `${diffSec}s 전 업데이트`
    const diffMin = Math.round(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m 전 업데이트`
    const diffHour = Math.round(diffMin / 60)
    return `${diffHour}h 전 업데이트`
  })()

  const ensureContent = (overlay) => {
    if (overlay) return overlay.getContent()
    const container = document.createElement('div')
    container.className = 'busOverlay'
    container.innerHTML = `
      <div class="busOverlayInner">
        <div class="busOverlaySpeed">${speedText}</div>
        <div class="busOverlayMeta">${updatedText}</div>
      </div>
    `
    return container
  }

  const content = ensureContent(existingOverlay)
  if (content?.querySelector) {
    const speedEl = content.querySelector('.busOverlaySpeed')
    const metaEl = content.querySelector('.busOverlayMeta')
    if (speedEl) speedEl.textContent = speedText
    if (metaEl) metaEl.textContent = updatedText
  }

  if (existingOverlay) {
    existingOverlay.setPosition(position)
    existingOverlay.setContent(content)
    existingOverlay.setMap(mapInstance ?? window.__kakaoMap ?? null)
    return existingOverlay
  }

  const overlay = new window.kakao.maps.CustomOverlay({
    position,
    content,
    xAnchor: 0.5,
    yAnchor: 1.25,
    zIndex: 6,
  })
  overlay.setMap(mapInstance ?? window.__kakaoMap ?? null)
  return overlay
}

export const updateBusMarkers = ({
  map,
  data,
  markerImage,
  markersRef,
  overlaysRef,
  metaRef,
  selectedOrg,
}) => {
  if (!map || !window.kakao?.maps) return

  const markers = markersRef.current
  const overlays = overlaysRef.current
  const meta = metaRef.current

  const normalized = Array.isArray(data) ? data.map(normalizeBusItem).filter(Boolean) : []
  const filtered = selectedOrg ? normalized.filter((item) => item.org === selectedOrg) : normalized

  const visibleIds = new Set()

  filtered.forEach((item) => {
    const position = new window.kakao.maps.LatLng(item.lat, item.lng)
    meta.set(item.id, item)

    let marker = markers.get(item.id)
    if (!marker) {
      const markerOptions = {
        position,
        map,
        zIndex: 5,
        title: item.name,
      }
      if (markerImage) markerOptions.image = markerImage
      marker = new window.kakao.maps.Marker(markerOptions)
      markers.set(item.id, marker)
    } else {
      const currentPos = marker.getPosition?.()
      if (currentPos) {
        animationState.entries.set(item.id, {
          marker,
          startLat: currentPos.getLat(),
          startLng: currentPos.getLng(),
          targetLat: item.lat,
          targetLng: item.lng,
          startedAt: performance.now(),
          duration: 450,
        })
        startAnimationLoop(map)
      } else {
        marker.setPosition(position)
      }
      marker.setMap(map)
      if (markerImage && marker.setImage) marker.setImage(markerImage)
    }

    const overlay = createOrUpdateBusOverlay(item, position, map, overlays.get(item.id))
    if (overlay) overlays.set(item.id, overlay)
    visibleIds.add(item.id)
  })

  markers.forEach((marker, key) => {
    if (visibleIds.has(key)) return
    marker.setMap(null)
    animationState.entries.delete(key)
    markers.delete(key)

    const overlay = overlays.get(key)
    if (overlay) overlay.setMap(null)
    overlays.delete(key)

    meta.delete(key)
  })
}

export const stopAllAnimations = () => {
  if (animationState.rafId) cancelAnimationFrame(animationState.rafId)
  animationState.playing = false
  animationState.rafId = null
  animationState.entries.clear()
}

export default updateBusMarkers
