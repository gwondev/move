// 기관 선택 모달(초기 렌더링 시 표시)
// - X 버튼으로 닫기
// - 아코디언 목록에서 기관 선택
import React, { useEffect, useState } from 'react'
import styles from './OrgSelectModal.module.css'

const OrgSelectModal = ({ open, defaultOrg, onSelect, onClose, groups }) => {
  const [selected, setSelected] = useState(defaultOrg || '')
  const [openGroups, setOpenGroups] = useState({})

  // 아코디언에 표시할 그룹/기관 목록 (필요 시 데이터로 대체 가능)
  const ORG_GROUPS = groups && groups.length
    ? groups
    : [{ title: '선택하기', items: ['조선대학교', '복지관'] }]

  useEffect(() => {
    setSelected(defaultOrg || '')
  }, [defaultOrg])

  useEffect(() => {
    if (!open) return
    if (!ORG_GROUPS.length) return
    setOpenGroups((prev) => {
      const next = {}
      let hasOpen = false
      ORG_GROUPS.forEach((group, index) => {
        const wasOpen = !!prev[group.title]
        next[group.title] = wasOpen
        if (wasOpen) hasOpen = true
      })
      if (!hasOpen) {
        const first = ORG_GROUPS[0]
        next[first.title] = true
      }
      return next
    })
  }, [open, ORG_GROUPS])

  if (!open) return null

  const choose = (org) => {
    const next = org === selected ? '' : org
    setSelected(next)
    if (onSelect) onSelect(next)
  }

  const toggleGroup = (title) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.content}>
            <div>
              <div className={styles.title}>기관을 선택해주세요.</div>
              <div className={styles.subtitle}>조회하고 싶은 버스가 소속된 기관을 선택해주세요.</div>
            </div>
            <div className={styles.accordion}>
              {ORG_GROUPS.map((group) => {
                const isOpen = !!openGroups[group.title]
                return (
                  <div
                    key={group.title}
                    className={`${styles.accGroup} ${isOpen ? styles.accGroupOpen : ''}`}
                  >
                    <button
                      type="button"
                      className={styles.accHeader}
                      aria-expanded={isOpen}
                      onClick={() => toggleGroup(group.title)}
                    >
                      <span className={styles.accTitle}>{group.title}</span>
                      <span className={styles.chevron} aria-hidden>▾</span>
                    </button>
                    <div className={`${styles.accItems} ${isOpen ? styles.accItemsOpen : ''}`}>
                      {group.items.map((org) => (
                        <button
                          key={org}
                          type="button"
                          className={`${styles.accItem} ${selected === org ? styles.accItemActive : ''}`}
                          onClick={() => choose(org)}
                        >
                          <span className={styles.itemBullet} />
                          <span className={styles.itemLabel}>{org}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.closeArea}>
            <button type="button" className={styles.closeCircle} aria-label="닫기" onClick={onClose}>
              <img src="/searchbox/group.svg" alt="close" className={styles.closeIcon} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrgSelectModal
