// 검색 입력창 컴포넌트
// - Enter/아이콘 클릭으로 Kakao Places 검색
// - 외부 클릭 시 입력 포커스 해제
// - 좌측: 돋보기 아이콘, 우측: 입력 지우기(X)
import React, { useEffect, useRef, useState } from 'react';
import styles from './SearchBox.module.css';


// size: 'sm' | 'md' | 'lg' | 'xl' (입력/버튼/아이콘 크기에 반영)
const SearchBox = ({ size = 'md' }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  // 바깥 클릭 시 입력창 블러 (호버/포커스 잔상 방지)
  useEffect(() => {
    const handleOutside = (e) => {
      // 입력창 + 버튼을 감싼 영역 밖을 클릭한 경우에만 blur 처리
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        inputRef.current.blur();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // 실제 검색 실행 로직
  // - Kakao Places keywordSearch로 첫 결과를 지도에 반영
  const runSearch = () => {
    const q = query.trim();
    if (!q) return;
    if (!(window.kakao && window.kakao.maps)) {
      console.warn('Kakao SDK not ready');
      return;
    }

    const map = window.__kakaoMap;
    if (!map) {
      console.warn('Map instance not found');
      return;
    }

    // Kakao services(Places)가 준비된 뒤에 검색 실행
    const doSearch = () => {
      if (!window.kakao.maps.services) {
        console.warn('Kakao services library missing');
        return;
      }
      const places = new window.kakao.maps.services.Places();
      places.keywordSearch(q, (data, status) => {
        if (status !== window.kakao.maps.services.Status.OK || !data?.length) {
          console.warn('No results');
          return;
        }
        const first = data[0];
        const lat = parseFloat(first.y);
        const lng = parseFloat(first.x);
        const pos = new window.kakao.maps.LatLng(lat, lng);

        // 기존 검색 마커 제거
        if (window.__searchMarker) {
          window.__searchMarker.setMap(null);
        }
        const marker = new window.kakao.maps.Marker({ position: pos, map });
        window.__searchMarker = marker;

        map.setCenter(pos);
        if (typeof map.setLevel === 'function') map.setLevel(3);

        try {
          window.__notifyManualMapInteraction?.({ reason: 'search', duration: Infinity });
        } catch (error) {
          console.warn('Manual map interaction notify failed', error);
        }

        // // 지도 위 카드형 오버레이(간단 목업) 생성
        // try {
        //   if (window.__searchOverlay) window.__searchOverlay.setMap(null);
        //   const el = document.createElement('div');
        //   el.className = 'rounded-xl bg-white shadow-lg border border-neutral-200 w-64 overflow-hidden';
        //   el.innerHTML = `
        //     <div class="h-24 bg-neutral-200"></div>
        //     <div class="p-3">
        //       <div class="text-sm font-semibold text-neutral-900 truncate">${first.place_name}</div>
        //       <div class="text-xs text-neutral-600 mt-1 truncate">${first.road_address_name || first.address_name || ''}</div>
        //       <div class="text-xs text-amber-500 mt-2">★ ★ ★ ★ ☆</div>
        //     </div>
        //   `;
        //   const overlay = new window.kakao.maps.CustomOverlay({
        //     position: pos,
        //     content: el,
        //     yAnchor: 1.1,
        //   });
        //   overlay.setMap(map);
        //   window.__searchOverlay = overlay;
        // } catch (e) {
        //   console.warn('Overlay not created', e);
        // }

        // 검색 후 포커스 해제 (모바일 키보드 닫힘 유도)
        inputRef.current?.blur();
      });
    };

    if (typeof window.kakao.maps.load === 'function' && !window.kakao.maps.services) {
      window.kakao.maps.load(doSearch);
    } else {
      doSearch();
    }
  };

  // Enter 키로 검색 실행
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runSearch();
    }
  };

  // 글자 크기 (입력/버튼 공통)
  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[size] || 'text-base';

  // 버튼의 정사각형 박스 크기 (아이콘 버튼)
  const buttonBoxSize = {
    sm: 'h-9 w-9',
    md: 'h-10 w-10',
    lg: 'h-11 w-11',
    xl: 'h-12 w-12',
  }[size] || 'h-10 w-10';

  // 아이콘 픽셀 크기
  const iconPx = {
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
  }[size] || 16;

  // Figma 토큰 맵핑 (업데이트): Primary(#4C4C4C), Background(#FFFFFF)
  const COLOR_PRIMARY = '#4C4C4C';
  const COLOR_BG = '#FFFFFF';

  const clearSearch = () => {
    setQuery('');
    try {
      if (window.__searchMarker) {
        window.__searchMarker.setMap(null);
        window.__searchMarker = null;
      }
      if (window.__searchOverlay) {
        window.__searchOverlay.setMap(null);
        window.__searchOverlay = null;
      }
    } catch (e) {
      // noop
    }
    inputRef.current?.focus();
  };

  return (
    <div className="fixed top-4 left-4 z-50">
      <div
        className="w-90 h-16 relative"
        ref={wrapperRef}
        onClick={() => inputRef.current?.focus()}
      >
        {/* 바깥 라운드 컨테이너 */}
        <div
          className="w-90 h-16 left-0 top-0 absolute rounded-[30px]"
          style={{ backgroundColor: COLOR_BG, boxShadow: '4px 4px 2px rgba(64, 45, 45, 0.25)' }}
        />

        {/* 내부 입력 박스 */}
        <div className="w-80 h-14 left-[13px] top-[6px] absolute rounded-xl overflow-hidden"
             style={{ backgroundColor: COLOR_BG }}>
          {/* 좌측 검색 아이콘 (클릭 시 검색) */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); runSearch(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); runSearch(); } }}
            aria-label="검색 실행"
            className={`w-6 h-6 left-[18px] top-[12px] absolute flex items-center justify-center ${styles.iconBtnLeft}`}
            style={{ padding: 0, border: 'none', background: 'transparent', borderRadius: 0, cursor: 'pointer' }}
          >
            <img src="/searchbox/vector.svg" alt="search" className="w-6 h-6" />
          </button>

          {/* 텍스트 입력 */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="장소명을 검색해주세요."
            className="absolute left-[60px] top-[5px] w-[220px] h-[40px] bg-transparent outline-none text-xl font-medium placeholder:opacity-70"
            style={{ color: COLOR_PRIMARY, fontFamily: "Roboto, Inter, system-ui, Avenir, Helvetica, Arial, sans-serif" }}
          />

          {/* 우측 클리어 버튼 (X 아이콘) */}
          <button
            type="button"
            onClick={clearSearch}
            aria-label="검색어 지우기"
            className={`absolute right-[8px] top-[16px] w-5 h-5 flex items-center justify-center active:scale-[0.98] ${styles.iconBtnRight}`}
            style={{ padding: 0, border: 'none', background: 'transparent', borderRadius: 0, cursor: 'pointer' }}
          >
            <img src="/searchbox/group.svg" alt="clear" className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}


export default SearchBox;
