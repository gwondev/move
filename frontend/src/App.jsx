// 앱의 루트 컴포넌트
// - 전 화면을 덮는 카카오 지도(KakaoMap)
// - 좌측 상단 검색 박스(SearchBox)
// - 우측 하단 플로팅 버튼(FloatingButtons)
import './App.css'
import KakaoMap from './components/KakaoMap'
import SearchBox from './components/SearchBox'
import FloatingButtons from './components/FloatingButtons'
import BusSelectPopup from './components/BusSelectPopup'
import { useEffect, useMemo, useState } from 'react'
import OrgSelectModal from './components/OrgSelectModal'
import OrgSelectButton from './components/OrgSelectButton'

const ORG_BUSES = {
  '조선대학교': [
    { id: 'chosun-1', name: '1호차' },
    { id: 'chosun-2', name: '2호차' },
  ],
  '복지관': [
    { id: 'welfare-1', name: '셔틀 A' },
  ],
}

const BUS_STORAGE_KEY = 'selectedBusByOrg'

function App() {
  // 초기 렌더링 시 기관 선택 모달 표시 (선택된 기관이 로컬에 없을 때)
  const [org, setOrg] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedBus, setSelectedBus] = useState('all')

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

  const busOptions = useMemo(() => ORG_BUSES[org] || [], [org])

  // 단순 배치만 담당하며, 로직은 각 컴포넌트 내부에 캡슐화되어 있습니다.
  return (
    <>
      <KakaoMap selectedOrg={org} />
      <SearchBox />
      <FloatingButtons />
      <OrgSelectButton onToggle={() => setShowModal(v => !v)} />
      <OrgSelectModal open={showModal} defaultOrg={org} onSelect={handleSelect} onClose={handleClose} />
      <BusSelectPopup orgName={org} buses={busOptions} selectedBusId={selectedBus} onSelectBus={handleBusSelect} />
    </>
  )
}

export default App
