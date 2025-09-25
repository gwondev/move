import React, { useEffect, useMemo, useRef, useState } from 'react'
import styles from './BusSelectPopup.module.css'
import orgSelectStyles from './OrgSelectModal.module.css'
import chevronIcon from '/images/line-rounded-chevron-down.svg'

const DEFAULT_OPTION = { id: 'all', name: '전체보기' }

const BusSelectPopup = ({ orgName, buses = [], selectedBusId = DEFAULT_OPTION.id, onSelectBus }) => {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  const options = useMemo(() => {
    if (!Array.isArray(buses)) return [DEFAULT_OPTION]
    return [DEFAULT_OPTION, ...buses]
  }, [buses])

  const activeOption = useMemo(() => {
    return options.find((opt) => opt.id === selectedBusId) || DEFAULT_OPTION
  }, [options, selectedBusId])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [selectedBusId, buses])

  if (!orgName || !buses || buses.length < 2) {
    return null
  }

  const handleSelect = (busId) => {
    if (onSelectBus) onSelectBus(busId)
    setOpen(false)
  }

  const rootClassName = `${styles.root} ${open ? styles.rootRaised : ''}`

  return (
    <aside className={rootClassName} aria-live="polite">
      <div className={`${styles.card} ${open ? styles.cardRaised : ''}`} ref={dropdownRef}>
        <div className={styles.header}>
          <h2 className={styles.title}>버스 선택</h2>
          <p className={styles.subtitle}>실시간 이동 및 노선을 보고싶은 버스를 선택해주세요.</p>
        </div>

        <div className={styles.divider} />

        <div className={styles.body}>
          <div className={styles.dropdown}>
            <button
              type="button"
              className={styles.dropdownTrigger}
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={() => setOpen((prev) => !prev)}
            >
              <span className={styles.dropdownLabel}>
                <span className={`${orgSelectStyles.itemBullet} ${activeOption.id !== DEFAULT_OPTION.id ? styles.bulletActive : ''}`} />
                <span className={styles.dropdownText}>{activeOption.name}</span>
              </span>
              <img
                src={chevronIcon}
                alt=""
                className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
                aria-hidden="true"
              />
            </button>

            <ul
              className={`${styles.dropdownList} ${open ? styles.dropdownListOpen : ''}`}
              role="listbox"
              aria-label={orgName ? `${orgName} 버스 목록` : '버스 목록'}
            >
              {options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.id === activeOption.id}
                    className={`${orgSelectStyles.accItem} ${styles.optionButton} ${option.id === activeOption.id ? `${orgSelectStyles.accItemActive} ${styles.optionButtonActive}` : ''}`}
                    onClick={() => handleSelect(option.id)}
                  >
                    <span className={orgSelectStyles.itemBullet} />
                    <span className={orgSelectStyles.itemLabel}>{option.name}</span>
                    {option.id === activeOption.id && (
                      <img src={chevronIcon} alt="" className={styles.optionChevron} aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default BusSelectPopup
