// 앱의 루트 컴포넌트
// - 전 화면을 덮는 카카오 지도(KakaoMap)
// - 좌측 상단 검색 박스(SearchBox)
// - 우측 하단 플로팅 버튼(FloatingButtons)
import './App.css'
import KakaoMap from './components/KakaoMap'
import SearchBox from './components/SearchBox'
import FloatingButtons from './components/FloatingButtons'
import BusSelectPopup from './components/BusSelectPopup'
import { useCallback, useEffect, useMemo, useState } from 'react'
import OrgSelectModal from './components/OrgSelectModal'
import OrgSelectButton from './components/OrgSelectButton'

const ORG_BUSES = {
  '조선대학교': [
    { id: 'chosun-1', name: '1호차', operatorId: 0 },
    { id: 'chosun-2', name: '2호차', operatorId: 1 },
  ],
  '복지관': [
    { id: 'jang-1', name: '1호차', operatorId: 0 },
    { id: 'jang-2', name: '2호차', operatorId: 1 },
  ],
}

const withAllOption = (map) => Object.fromEntries(
  Object.entries(map).map(([label, list]) => [
    label,
    [{ id: 'all', name: '전체보기', operatorId: null }, ...(Array.isArray(list) ? list : [])],
  ]),
)

const DEFAULT_ORG_GROUPS = [{ title: '선택하기', items: Object.keys(ORG_BUSES) }]

const BUS_STORAGE_KEY = 'selectedBusByOrg'

function App() {
  // 초기 렌더링 시 기관 선택 모달 표시 (선택된 기관이 로컬에 없을 때)
  const [org, setOrg] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedBus, setSelectedBus] = useState('all')
  const [busOptionsByOrg, setBusOptionsByOrg] = useState(() => withAllOption(ORG_BUSES))
  const [orgGroups, setOrgGroups] = useState(DEFAULT_ORG_GROUPS)

  useEffect(() => {
    const saved = localStorage.getItem('selectedOrg') || ''
    setOrg(saved)
    setShowModal(!saved)
  }, [])

  useEffect(() => {
    if (!org) {
      setSelectedBus('all')
      return
    }
    try {
      const saved = JSON.parse(localStorage.getItem(BUS_STORAGE_KEY) || '{}')
      setSelectedBus(saved[org] || 'all')
    } catch {
      setSelectedBus('all')
    }
  }, [org])

  const persistBusSelection = (orgId, busId) => {
    if (!orgId) return
    try {
      const stored = JSON.parse(localStorage.getItem(BUS_STORAGE_KEY) || '{}')
      if (!busId || busId === 'all') {
        delete stored[orgId]
      } else {
        stored[orgId] = busId
      }
      localStorage.setItem(BUS_STORAGE_KEY, JSON.stringify(stored))
    } catch (error) {
      console.warn('버스 선택 저장에 실패했습니다.', error)
    }
  }

  const handleSelect = (next) => {
    setOrg(next)
    // 선택 즉시 저장 후 모달 닫기
    if (next) {
      try { localStorage.setItem('selectedOrg', next) } catch (error) {
        console.warn('기관 선택 저장에 실패했습니다.', error)
      }
      persistBusSelection(next, 'all')
      setSelectedBus('all')
      setShowModal(false)
    } else {
      setSelectedBus('all')
    }
  }

  const handleClose = () => {
    if (org) localStorage.setItem('selectedOrg', org)
    setShowModal(false)
  }

  const handleBusSelect = (busId) => {
    setSelectedBus(busId)
    persistBusSelection(org, busId)
  }

  const busOptions = useMemo(() => busOptionsByOrg[org] || [{ id: 'all', name: '전체보기', operatorId: null }], [busOptionsByOrg, org])

  const activeBusOption = useMemo(() => {
    return busOptions.find((bus) => bus.id === selectedBus) || busOptions[0] || null
  }, [busOptions, selectedBus])

  const selectedBusFilter = activeBusOption?.operatorId ?? null

  useEffect(() => {
    if (!org) return
    if (busOptionsByOrg[org]) return
    const fallbackOrg = orgGroups.find((group) => Array.isArray(group.items) && group.items.length)?.items?.[0] || ''
    if (fallbackOrg && fallbackOrg !== org) {
      setOrg(fallbackOrg)
      try { localStorage.setItem('selectedOrg', fallbackOrg) } catch {}
    }
  }, [org, busOptionsByOrg, orgGroups])

  useEffect(() => {
    const options = busOptionsByOrg[org]
    if (!options) return
    if (selectedBus === 'all') return
    if (options.some((opt) => opt.id === selectedBus)) return
    setSelectedBus('all')
  }, [org, busOptionsByOrg, selectedBus])

  const handleBusMetaUpdate = useCallback((metaList = []) => {
    if (!Array.isArray(metaList) || !metaList.length) {
      setBusOptionsByOrg(withAllOption(ORG_BUSES))
      setOrgGroups(DEFAULT_ORG_GROUPS)
      return
    }

    const devMode = import.meta.env.DEV
    const allowedKeys = new Set(['jang', 'chosun', 'jang-test', 'chosun-test'])
    const grouped = new Map()

    metaList.forEach((item) => {
      if (!item) return
      const { orgKey, org: orgLabel, operatorId, id: metaId, name, operatorName } = item
      if (!orgKey || !allowedKeys.has(orgKey)) return
      const isTest = /test/i.test(orgKey)
      if (isTest && !devMode) return

      const displayOrg = (orgLabel || (orgKey.startsWith('chosun') ? '조선대학교' : '복지관')).trim()
      const bucket = grouped.get(displayOrg) || { label: displayOrg, isTest, buses: [], orgKey }

      const label = (name && name !== '운행 차량')
        ? name
        : Number.isFinite(operatorId)
          ? `${operatorId}호차`
          : `버스 ${bucket.buses.length + 1}`

      const entryId = `${metaId}`
      if (!bucket.buses.some((opt) => opt.id === entryId)) {
        bucket.buses.push({
          id: entryId,
          name: label,
          operatorId: Number.isFinite(operatorId) ? operatorId : null,
          operatorName,
        })
      }
      bucket.isTest = isTest
      grouped.set(displayOrg, bucket)
    })

    if (!grouped.size) {
      setBusOptionsByOrg(withAllOption(ORG_BUSES))
      setOrgGroups(DEFAULT_ORG_GROUPS)
      return
    }

    const nextBusOptions = {}
    const primaryOrgs = []
    const testOrgs = []

    grouped.forEach((bucket, label) => {
      bucket.buses.sort((a, b) => {
        if (a.operatorId !== null && b.operatorId !== null) return a.operatorId - b.operatorId
        if (a.operatorId !== null) return -1
        if (b.operatorId !== null) return 1
        return a.name.localeCompare(b.name, 'ko')
      })
      bucket.buses.unshift({ id: 'all', name: '전체보기', operatorId: null })
      nextBusOptions[label] = bucket.buses
      if (bucket.isTest) {
        if (devMode) testOrgs.push(label)
      } else {
        primaryOrgs.push(label)
      }
    })

    primaryOrgs.sort((a, b) => a.localeCompare(b, 'ko'))
    testOrgs.sort((a, b) => a.localeCompare(b, 'ko'))

    const nextGroups = []
    if (primaryOrgs.length) nextGroups.push({ title: '선택하기', items: primaryOrgs })
    if (devMode && testOrgs.length) nextGroups.push({ title: '테스트', items: testOrgs })

    setBusOptionsByOrg(nextBusOptions)
    if (nextGroups.length) {
      setOrgGroups(nextGroups)
    } else {
      setOrgGroups(DEFAULT_ORG_GROUPS)
    }
  }, [])

  // 단순 배치만 담당하며, 로직은 각 컴포넌트 내부에 캡슐화되어 있습니다.
  return (
    <>
      <KakaoMap selectedOrg={org} selectedBusFilter={selectedBusFilter} onBusMetaUpdate={handleBusMetaUpdate} />
      <SearchBox />
      <FloatingButtons />
      <OrgSelectButton currentOrg={org} onToggle={() => setShowModal(v => !v)} />
      <OrgSelectModal open={showModal} defaultOrg={org} onSelect={handleSelect} onClose={handleClose} groups={orgGroups} />
      <BusSelectPopup orgName={org} buses={busOptions} selectedBusId={selectedBus} onSelectBus={handleBusSelect} />
    </>
  )
}

export default App
