export const FALLBACK_ORG = '복지관'

const animationState = {
  playing: false,
  rafId: null,
  entries: new Map(),
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
const MOVEMENT_EPSILON = 0.000001
const SMOOTHING_ALPHA = 0.35

const toRad = (deg) => (deg * Math.PI) / 180
const earthDistanceMeters = (aLat, aLng, bLat, bLng) => {
  if (![aLat, aLng, bLat, bLng].every(Number.isFinite)) return 0
  const R = 6371000
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const a = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)))
  return R * c
}

const computeSegmentDuration = (startLat, startLng, targetLat, targetLng) => {
  const distance = earthDistanceMeters(startLat, startLng, targetLat, targetLng)
  if (!Number.isFinite(distance) || distance <= 0) return 350
  const assumedSpeed = 13.8 // ≈ 50km/h 정도를 가정
  const duration = (distance / assumedSpeed) * 1000
  return Math.max(320, Math.min(2200, duration))
}

const tailTargetOfEntry = (entry) => {
  if (!entry) return null
  if (entry.queue?.length) return entry.queue[entry.queue.length - 1]
  return entry.segment ?? null
}

const startNextSegment = (entry, now) => {
  if (!entry.queue.length) {
    entry.segment = null
    return false
  }
  const next = entry.queue.shift()
  next.startedAt = now
  entry.segment = next
  return true
}

const startAnimationLoop = (map, overlaysRef) => {
  if (animationState.playing) return
  animationState.playing = true

  const step = () => {
    const now = performance.now()
    let hasActive = false

    animationState.entries.forEach((entry, id) => {
      const { marker } = entry
      if (!marker) {
        animationState.entries.delete(id)
        return
      }

      if (!entry.segment && !startNextSegment(entry, now)) {
        animationState.entries.delete(id)
        return
      }

      const segment = entry.segment
      if (!segment) return

      if (!segment.startedAt) segment.startedAt = now
      const elapsed = now - segment.startedAt
      const t = segment.duration > 0 ? Math.min(1, elapsed / segment.duration) : 1
      const eased = easeInOut(t)
      const nextLat = segment.startLat + (segment.targetLat - segment.startLat) * eased
      const nextLng = segment.startLng + (segment.targetLng - segment.startLng) * eased
      const nextPos = new window.kakao.maps.LatLng(nextLat, nextLng)
      marker.setPosition(nextPos)

      const overlay = overlaysRef?.current?.get(id)
      if (overlay?.setPosition) overlay.setPosition(nextPos)

      if (typeof entry.onMove === 'function') {
        try {
          entry.onMove({ id, position: nextPos, item: entry.meta ?? null, progress: t })
        } catch (error) {
          console.warn('onMove callback failed', error)
        }
      }

      if (t >= 1) {
        if (!startNextSegment(entry, now)) {
          animationState.entries.delete(id)
        } else {
          hasActive = true
        }
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

const ORG_LABELS = {
  jang: '복지관',
  'jang-test': '복지관 테스트',
  chosun: '조선대학교',
  'chosun-test': '조선대학교 테스트',
}

const detectOrgKey = (token) => {
  if (!token) return null
  if (token.includes('chosuntest') || token.includes('조선대학교테스트') || token.includes('조선테스트')) return 'chosun-test'
  if (token.includes('jangtest') || token.includes('복지관테스트') || token.includes('복지테스트')) return 'jang-test'
  if (token.includes('chosun') || token.includes('조선대학교') || token.includes('조선')) return 'chosun'
  if (token.includes('jang') || token.includes('복지관') || token.includes('복지')) return 'jang'
  return null
}

const cleanOrgToken = (value) => {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u3131-\u318e\uac00-\ud7a3]+/g, '')
}

const resolveOrgMeta = (raw) => {
  const candidates = [
    raw?.operatorName,
    raw?.operation,
    raw?.org,
    raw?.organization,
    raw?.orgName,
    raw?.affiliation,
    raw?.group,
  ]

  for (const candidate of candidates) {
    const token = cleanOrgToken(candidate)
    if (!token) continue
    const key = detectOrgKey(token)
    if (key) return { label: ORG_LABELS[key], key }
  }
  const fallbackLabel = candidates.find((value) => typeof value === 'string' && value.trim())
  if (typeof fallbackLabel === 'string') {
    const normalized = cleanOrgToken(fallbackLabel)
    return { label: fallbackLabel.trim(), key: normalized || 'unassigned' }
  }
  return { label: FALLBACK_ORG, key: 'jang' }
}

const cleanKeySegment = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' && Number.isFinite(value)) return `n${value}`
  if (typeof value !== 'string') return ''
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return ''
  return trimmed.replace(/[^a-z0-9\u3131-\u318e\uac00-\ud7a3]+/g, '-')
}

const resolveBusKey = (raw) => {
  const candidates = [
    raw?.id,
    raw?.busId,
    raw?.busID,
    raw?.vehicleId,
    raw?.vehicleID,
    raw?.vehicleSeq,
    raw?.busSeq,
    raw?.plateNumber,
    raw?.busNumber,
    raw?.identifier,
    raw?.name,
    raw?.busName,
    raw?.routeName,
    raw?.label,
    raw?.title,
  ]

  for (const candidate of candidates) {
    const key = cleanKeySegment(candidate)
    if (key) return key
  }

  const operatorCandidate = cleanKeySegment(
    raw?.operatorVehicle ??
    raw?.operatorCode ??
    raw?.operatorId ??
    raw?.operatorID ??
    raw?.operator
  )
  if (operatorCandidate) return `operator-${operatorCandidate}`

  const crewCandidate = cleanKeySegment(raw?.driver ?? raw?.driverName ?? raw?.crew)
  if (crewCandidate) return `crew-${crewCandidate}`

  return ''
}

export const orgKeyFromSelection = (value) => {
  const token = cleanOrgToken(value)
  const detected = detectOrgKey(token)
  if (detected) return detected
  return token
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

  const operatorIdRaw = Number(raw.operatorId ?? raw.operatorID ?? raw.operator_id ?? raw.operator)
  const operatorId = Number.isFinite(operatorIdRaw) ? operatorIdRaw : undefined

  const baseId = raw.id ?? raw.busId ?? raw.vehicleId ?? raw.plateNumber
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
  const { label: displayOrg, key: orgKeyRaw } = resolveOrgMeta(raw)
  const orgKey = orgKeyRaw || 'unassigned'
  const busKey = resolveBusKey(raw)
  const baseIdKey = cleanKeySegment(baseId)
  const opNameKey = cleanKeySegment(raw?.operatorName)

  const idParts = [orgKey]
  if (busKey) idParts.push(`bus-${busKey}`)
  if (baseIdKey) idParts.push(`id-${baseIdKey}`)
  if (Number.isFinite(operatorId)) idParts.push(`op-${operatorId}`)
  if (opNameKey) idParts.push(`opname-${opNameKey}`)

  if (idParts.length === 1) {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      idParts.push(`pos-${lat.toFixed(4)}-${lng.toFixed(4)}`)
    } else {
      idParts.push(`rand-${Math.random().toString(36).slice(2, 8)}`)
    }
  }

  const id = idParts.join(':')

  return {
    id,
    lat,
    lng,
    name,
    speed: Number.isFinite(speedValue) ? speedValue : undefined,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
    org: displayOrg,
    orgKey,
    operatorId,
    busKey,
    operatorName: typeof raw?.operatorName === 'string' ? raw.operatorName.trim() : undefined,
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
    const targetMap = mapInstance ?? window.__kakaoMap ?? null
    const currentMap = existingOverlay.getMap ? existingOverlay.getMap() : null
    if (currentMap !== targetMap) {
      existingOverlay.setMap(targetMap)
    }
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
  selectedBusFilter,
  onMarkerMove,
}) => {
  if (!map || !window.kakao?.maps) return

  const markers = markersRef.current
  const overlays = overlaysRef.current
  const meta = metaRef.current
  const onMove = typeof onMarkerMove === 'function' ? onMarkerMove : null
  const busFilterId = typeof selectedBusFilter === 'number' && Number.isFinite(selectedBusFilter)
    ? selectedBusFilter
    : null

  const normalized = Array.isArray(data) ? data.map(normalizeBusItem).filter(Boolean) : []
  const selectedOrgKey = orgKeyFromSelection(selectedOrg)
  const filteredByOrg = selectedOrgKey
    ? normalized.filter((item) => item.orgKey === selectedOrgKey)
    : normalized
  const filtered = busFilterId !== null
    ? filteredByOrg.filter((item) => Number(item.operatorId) === busFilterId)
    : filteredByOrg

  const normalizedIds = new Set()
  normalized.forEach((item) => {
    normalizedIds.add(item.id)
    meta.set(item.id, item)
  })
  meta.forEach((_, key) => {
    if (!normalizedIds.has(key)) meta.delete(key)
  })

  const visibleIds = new Set()

  filtered.forEach((item) => {
    const position = new window.kakao.maps.LatLng(item.lat, item.lng)
    meta.set(item.id, item)

    let marker = markers.get(item.id)
    let overlayPosition = position

    if (!marker) {
      const markerOptions = {
        position,
        map,
        zIndex: 5,
        title: item.name,
      }
      marker = new window.kakao.maps.Marker(markerOptions)
      if (markerImage && marker.setImage) {
        marker.setImage(markerImage)
        marker.__assignedImage = markerImage
      }
      markers.set(item.id, marker)
    } else {
      const currentMap = marker.getMap?.()
      if (currentMap !== map) {
        marker.setMap(map)
      }
      const currentPos = marker.getPosition?.()
      if (currentPos) {
        overlayPosition = currentPos
      } else {
        marker.setPosition(position)
      }
    }

    if (markerImage && marker.setImage && marker.__assignedImage !== markerImage) {
      marker.setImage(markerImage)
      marker.__assignedImage = markerImage
    }

    const markerPos = marker.getPosition?.()
    const currentLat = typeof markerPos?.getLat === 'function' ? markerPos.getLat() : undefined
    const currentLng = typeof markerPos?.getLng === 'function' ? markerPos.getLng() : undefined

    const targetLat = item.lat
    const targetLng = item.lng

    const existingEntry = animationState.entries.get(item.id)
    const tail = tailTargetOfEntry(existingEntry)
    const baseLat = Number.isFinite(tail?.targetLat) ? tail.targetLat : currentLat
    const baseLng = Number.isFinite(tail?.targetLng) ? tail.targetLng : currentLng

    const entry = existingEntry ?? { marker, queue: [], segment: null }
    entry.marker = marker
    entry.queue = entry.queue ?? []
    entry.meta = item
    entry.onMove = onMove

    let smoothLat = targetLat
    let smoothLng = targetLng
    if (Number.isFinite(targetLat) && Number.isFinite(targetLng)) {
      const prevLat = Number.isFinite(entry.filterLat) ? entry.filterLat : targetLat
      const prevLng = Number.isFinite(entry.filterLng) ? entry.filterLng : targetLng
      smoothLat = prevLat + (targetLat - prevLat) * SMOOTHING_ALPHA
      smoothLng = prevLng + (targetLng - prevLng) * SMOOTHING_ALPHA
      entry.filterLat = smoothLat
      entry.filterLng = smoothLng
    }

    if (Number.isFinite(smoothLat) && Number.isFinite(smoothLng) && window.kakao?.maps) {
      overlayPosition = new window.kakao.maps.LatLng(smoothLat, smoothLng)
    }

    const deltaLat = Number.isFinite(baseLat) ? smoothLat - baseLat : 0
    const deltaLng = Number.isFinite(baseLng) ? smoothLng - baseLng : 0
    const shouldAnimate =
      Number.isFinite(smoothLat) &&
      Number.isFinite(smoothLng) &&
      (Math.abs(deltaLat) > MOVEMENT_EPSILON || Math.abs(deltaLng) > MOVEMENT_EPSILON)

    if (shouldAnimate) {
      const segmentStartLat = Number.isFinite(baseLat) ? baseLat : smoothLat
      const segmentStartLng = Number.isFinite(baseLng) ? baseLng : smoothLng

      entry.queue.push({
        startLat: segmentStartLat,
        startLng: segmentStartLng,
        targetLat: smoothLat,
        targetLng: smoothLng,
        duration: computeSegmentDuration(segmentStartLat, segmentStartLng, smoothLat, smoothLng),
        startedAt: null,
      })

      while (entry.queue.length > 5) entry.queue.shift()

      animationState.entries.set(item.id, entry)
      startAnimationLoop(map, overlaysRef)
    } else {
      if (!existingEntry) {
        animationState.entries.set(item.id, entry)
      }
    }

    const overlay = createOrUpdateBusOverlay(item, overlayPosition, map, overlays.get(item.id))
    if (overlay) overlays.set(item.id, overlay)
    visibleIds.add(item.id)

    if (onMove) {
      let latestPos = marker.getPosition?.()
      if (!latestPos && Number.isFinite(smoothLat) && Number.isFinite(smoothLng) && window.kakao?.maps) {
        latestPos = new window.kakao.maps.LatLng(smoothLat, smoothLng)
      }
      if (!latestPos) latestPos = overlayPosition ?? position
      if (latestPos) {
        try {
          onMove({ id: item.id, position: latestPos, item })
        } catch (error) {
          console.warn('onMove callback failed', error)
        }
      }
    }
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
