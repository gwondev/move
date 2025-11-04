// 우측 하단 플로팅 버튼 묶음
import React, { useState } from 'react'
import styles from './FloatingButtons.module.css'

// 우측 하단 고정 플로팅 버튼 묶음
// 아이콘은 텍스트/기호로 간단 표시 (추후 react-icons로 대체 가능)
// 공통 원형 버튼 (아이콘 지원, 실패 시 라벨 폴백)
const CircleBtn = ({ label, iconSrc, iconAlt, onClick }) => {
  const [iconError, setIconError] = useState(false)
  return (
    <button type="button" onClick={onClick} className={styles.circleBtn} aria-label={iconAlt || label}>
      {iconSrc && !iconError ? (
        <img src={iconSrc} alt={iconAlt || label} className={styles.icon} onError={() => setIconError(true)} />
      ) : (
        <span className={styles.label}>{label}</span>
      )}
    </button>
  )
}

const FloatingButtons = () => {
  return (
    <div className={styles.container}>
      <CircleBtn
        label="↺"
        iconSrc="/mapsize/line-rounded-reset.svg"
        iconAlt="기본 크기"
        onClick={() => {
          try {
            window.__resetMapToSelection?.({ reason: 'reset-zoom', level: 3 })
          } catch (error) {
            console.warn('기본 크기 복원 실패', error)
          }
        }}
      />
      <CircleBtn
        label="+"
        iconSrc="/mapsize/line-rounded-plus.svg"
        iconAlt="확대"
        onClick={() => window.__kakaoMap?.setLevel?.(Math.max(1, (window.__kakaoMap?.getLevel?.() ?? 3) - 1))}
      />
      <CircleBtn
        label="-"
        iconSrc="/mapsize/line-rounded-minus.svg"
        iconAlt="축소"
        onClick={() => window.__kakaoMap?.setLevel?.((window.__kakaoMap?.getLevel?.() ?? 3) + 1)}
      />
      <CircleBtn
        label="◎"
        iconSrc="/mapsize/livestream.svg"
        iconAlt="내 위치로 이동"
        onClick={() => {
          if (window.__myLocationMarker && window.__kakaoMap) {
            const pos = window.__myLocationMarker.getPosition()
            window.__kakaoMap.setCenter(pos)
            try {
              window.__notifyManualMapInteraction?.({ reason: 'user-location', duration: Infinity })
            } catch (error) {
              console.warn('Manual map interaction notify failed', error)
            }
          }
        }}
      />
    </div>
  )
}

export default FloatingButtons
