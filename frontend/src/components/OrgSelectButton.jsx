import React from 'react'
import styles from './OrgSelectButton.module.css'

// 기관 선택 모달을 열고/닫는 트리거 버튼
// - 아이콘: public/checkbox.svg 사용
// - 클릭 시 onToggle 호출 (모달 open 토글)
const OrgSelectButton = ({ onToggle }) => {
  return (
    <div className={styles.root}>
      <button type="button" className={styles.button} onClick={onToggle} aria-label="기관 선택">
        <div className={styles.outer}>
          <div className={styles.pill}>
            <div className={styles.inner}>
              <img src="/checkbox.svg" alt="checkbox" className={styles.icon} />
              <div className={styles.label}>기관 선택1</div>
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}

export default OrgSelectButton

