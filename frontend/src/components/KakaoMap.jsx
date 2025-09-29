// Kakao 지도를 초기화/표시하고, 현재 위치(정확도 원 + 방향 오버레이)와
// 외부에서 전달되는 버스 마커를 그리는 컴포넌트입니다.
import React, { useEffect, useRef, useState } from "react";
import styles from './KakaoMap.module.css';
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import updateBusMarkers, { FALLBACK_ORG, stopAllAnimations } from './map/busMarkerManager'

const INITIAL_POSITION = { lat: 35.140876, lng: 126.930593 };
const getDefaultBus = () => ({
  id: 'placeholder-bus',
  lat: INITIAL_POSITION.lat,
  lng: INITIAL_POSITION.lng,
  name: '임시 운행 버스',
  speed: 0,
  updatedAt: Date.now(),
  org: FALLBACK_ORG,
});

const MapContainer = ({ busData, num, selectedOrg }) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [data, setData] = useState([getDefaultBus()]);
    const [mapReady, setMapReady] = useState(false);
    const busMarkersRef = useRef(new Map());
    const busMarkerImageRef = useRef(null);
    const busOverlaysRef = useRef(new Map());
    const busMetaRef = useRef(new Map());

    useEffect(() => {
      const rawWsUrl = import.meta.env.VITE_WS_URL || '';
      const gpsTopic = import.meta.env.VITE_GPS_TOPIC || '/move/gps/operator/1';
      const wsEndpoint = (() => {
        if (!rawWsUrl) return '';
        if (typeof window === 'undefined') return rawWsUrl;
        const isSecurePage = window.location?.protocol === 'https:';
        if (isSecurePage && rawWsUrl.startsWith('http://')) {
          return rawWsUrl.replace(/^http:/, 'https:');
        }
        return rawWsUrl;
      })();

      if (!wsEndpoint) {
        console.warn('SockJS endpoint가 설정되지 않았습니다. VITE_WS_URL을 확인하세요.');
        return () => undefined;
      }

      console.log('🌐 Using SockJS endpoint:', wsEndpoint);

      // SockJS endpoint - TODO: 추후 도메인으로 변경 예정 env 추가 
      const socket = new SockJS(wsEndpoint);

      // STOMP client
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
      });

      client.onConnect = () => {
        console.log("✅ Connected to WebSocket server");
        console.log('📌 Subscribing to topic:', gpsTopic);

        client.subscribe(gpsTopic, (message) => {
          try {
            const body = JSON.parse(message.body);
            console.log("📡 Received data:", body); // 개발자 도구에 출력
            const list = Array.isArray(body) ? body : [body];
            setData((prev) => {
              const next = list.filter(Boolean);
              if (next.length) return next;
              if (prev?.length) return prev;
              return [getDefaultBus()];
            });
          } catch (error) {
            console.error('버스 데이터 파싱 실패', error);
          }
        });
      };

      client.onStompError = (frame) => {
        console.error("❌ STOMP error:", frame);
      };
      client.onWebSocketClose = (evt) => {
        console.warn('⚠️ SockJS connection closed', evt);
      };

      client.activate();

      return () => client.deactivate();
    }, [num]);

    // SDK 로드 및 지도 초기화
    useEffect(() => {
      const scriptId = "kakao-map-sdk";
      const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY;

      const onSdkReady = () => {
        // kakao.maps.load는 SDK가 이미 로드된 경우 즉시 콜백을 실행
        if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
          window.kakao.maps.load(initializeMap);
        } else {
          console.error("❌ Kakao SDK present but load() is unavailable");
        }
      };

      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        console.log("📌 SDK already loaded or present, ensuring load() before init");
        onSdkReady();
        return;
      }

      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
      script.async = true;
      script.onerror = () => {
        console.error("❌ Failed to load Kakao Maps script");
      };
      script.onload = () => {
        console.log("✅ Kakao Maps script loaded");
        onSdkReady();
      };
      document.head.appendChild(script);

      // 실제 지도 객체를 생성하고 전역(window.__kakaoMap)에 노출
      function initializeMap() {
        console.log("✅ Initializing Kakao Map");
        const container = mapContainer.current;
        if (!container) {
          console.error("❌ Map container is null");
          return;
        }
        const options = {
          center: new window.kakao.maps.LatLng(INITIAL_POSITION.lat, INITIAL_POSITION.lng),
          level: 3,
        };
        map.current = new window.kakao.maps.Map(container, options);
        setMapReady(true);
        // 전역으로 맵 인스턴스 노출 (간단한 컴포넌트 간 연동용)
        window.__kakaoMap = map.current;
        console.log("✅ Kakao map initialized:", map.current);

        try {
          busMarkerImageRef.current = new window.kakao.maps.MarkerImage(
            '/busmarker.svg',
            new window.kakao.maps.Size(42, 42),
            { offset: new window.kakao.maps.Point(21, 36) }
          );
        } catch (error) {
          console.warn('버스 마커 이미지를 생성하지 못했습니다.', error);
        }

        // 사용자 아이콘 이미지와 회전 마커 이미지 생성 유틸리티 준비
        const userIconImg = new Image();
        userIconImg.src = '/marker/user.svg';
        userIconImg.crossOrigin = 'anonymous';
        userIconImg.onload = () => {
          try {
            const deg = window.__headingDeg ?? 0;
            if (window.__myLocationMarker) {
              window.__myLocationMarker.setImage(makeRotatedMarkerImage(deg));
            }
          } catch {}
        };

        function makeRotatedMarkerImage(angleDeg = 0) {
          const dim = 40; // 캔버스 크기(여백 포함)
          const drawSize = 40; // 실제 아이콘 렌더링 크기
          const canvas = document.createElement('canvas');
          canvas.width = dim; canvas.height = dim;
          const ctx = canvas.getContext('2d');
          ctx.translate(dim / 2, dim / 2);
          // 아이콘 기본 방향(오른쪽)을 북쪽 기준(위쪽)으로 맞추기 위해 -90도 오프셋 적용
          const rotated = (angleDeg - 90) * Math.PI / 180;
          ctx.rotate(rotated);
          try { ctx.drawImage(userIconImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize); } catch {}
          const url = canvas.toDataURL('image/png');
          return new window.kakao.maps.MarkerImage(
            url,
            new window.kakao.maps.Size(dim, dim),
            { offset: new window.kakao.maps.Point(dim / 2, dim / 2) }
          );
        }

        // ===== 현재 위치 표시 + 방향(heading) 오버레이 =====
        const createOrUpdateMyLocation = ({ latitude, longitude, accuracy, heading }) => {
          const myPos = new window.kakao.maps.LatLng(latitude, longitude);

          // 회전 가능한 사용자 아이콘 마커 생성/업데이트
          const angle = Number.isFinite(heading) ? heading : (window.__headingDeg ?? 0);
          if (!window.__myLocationMarker || typeof window.__myLocationMarker.setImage !== 'function') {
            window.__myLocationMarker = new window.kakao.maps.Marker({
              position: myPos,
              map: map.current,
              image: makeRotatedMarkerImage(angle),
              zIndex: 6,
              title: '내 위치',
            });
          } else {
            window.__myLocationMarker.setPosition(myPos);
            try { window.__myLocationMarker.setImage(makeRotatedMarkerImage(angle)); } catch {}
          }
          // 기존 정확도 원 제거(다시 그리기 위함)
          if (window.__myLocationCircle) window.__myLocationCircle.setMap(null);

          // 정확도 원 (GPS 정확도에 비례한 반투명 원)
          try {
            const circle = new window.kakao.maps.Circle({
              center: myPos,
              radius: Math.min(Math.max(accuracy || 50, 30), 200),
              strokeWeight: 1,
              strokeColor: '#1d4ed8',
              strokeOpacity: 0.7,
              strokeStyle: 'solid',
              fillColor: '#3b82f6',
              fillOpacity: 0.15,
            });
            circle.setMap(map.current);
            window.__myLocationCircle = circle;
          } catch (e) {
            console.warn('Circle overlay not created', e);
          }

          // 오버레이 대신 마커 이미지 회전으로 방향 표현
          const deg = Number.isFinite(heading) ? heading : (window.__headingDeg ?? 0);
          try { window.__myLocationMarker?.setImage(makeRotatedMarkerImage(deg)); } catch {}

          // 지도 중심/레벨 조정 (최초 호출 시에만)
          if (!window.__myLocationInitialized) {
            map.current.setCenter(myPos);
            if (typeof map.current.setLevel === 'function') map.current.setLevel(3);
            window.__myLocationInitialized = true;
          }
        };

        // 위치 한 번 획득 후, watchPosition으로 지속 추적
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude, accuracy, heading } = pos.coords;
              createOrUpdateMyLocation({ latitude, longitude, accuracy, heading });
            },
            (err) => console.warn('Geolocation failed or denied', err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );

          try {
            const watchId = navigator.geolocation.watchPosition(
              (pos) => {
                const { latitude, longitude, accuracy, heading } = pos.coords;
                createOrUpdateMyLocation({ latitude, longitude, accuracy, heading });
              },
              (err) => console.warn('watchPosition error', err),
              { enableHighAccuracy: true, maximumAge: 0 }
            );
            window.__geoWatchId = watchId;
          } catch (e) {
            console.warn('watchPosition not started', e);
          }
        } else {
          console.warn('Geolocation is not supported by this browser.');
        }

        // 디바이스 방향 센서(나침반) 활성화: iOS 권한 요청 처리
        const enableOrientation = async () => {
          try {
            if (typeof window.DeviceOrientationEvent !== 'undefined' &&
                typeof window.DeviceOrientationEvent.requestPermission === 'function') {
              const res = await window.DeviceOrientationEvent.requestPermission();
              if (res !== 'granted') return;
            }
            const onOrientation = (ev) => {
              // 일부 브라우저(iOS Safari)는 webkitCompassHeading을 제공 (북쪽=0, 시계방향 증가)
              // 그 외에는 alpha를 사용(북쪽=0, 시계방향 증가 가정). 화면 방향 보정은 필요 시 추가.
              const headingFromWebkit = typeof ev.webkitCompassHeading === 'number' ? ev.webkitCompassHeading : null;
              const alpha = typeof ev.alpha === 'number' ? ev.alpha : null;
              const headingDeg = headingFromWebkit ?? alpha;
              if (typeof headingDeg === 'number') {
                const deg = Math.round(headingDeg);
                window.__headingDeg = deg;
                // 마커 이미지 회전으로 방향 표현
                try { window.__myLocationMarker?.setImage(makeRotatedMarkerImage(deg)); } catch {}
              }
            };
            window.addEventListener('deviceorientation', onOrientation);
            window.__onOrientation = onOrientation;
          } catch (e) {
            console.warn('Device orientation permission error', e);
          }
        };

        // 사용자가 맵을 최초 클릭하면 방향 센서 권한 요청 시도 (iOS Safari 대응)
        const oneTimeClick = () => {
          enableOrientation();
          container.removeEventListener('click', oneTimeClick);
        };
        container.addEventListener('click', oneTimeClick);
      }
      return () => {
        setMapReady(false);
      };
    }, []);

    useEffect(() => {
      if (Array.isArray(busData)) {
        setData((prev) => {
          const next = busData.filter(Boolean);
          if (next.length) return next;
          if (prev?.length) return prev;
          return [getDefaultBus()];
        });
      }
    }, [busData]);


    useEffect(() => {
      if (!mapReady || !map.current) return;
      updateBusMarkers({
        map: map.current,
        data,
        markerImage: busMarkerImageRef.current ?? undefined,
        markersRef: busMarkersRef,
        overlaysRef: busOverlaysRef,
        metaRef: busMetaRef,
        selectedOrg,
      });
    }, [data, mapReady, selectedOrg]);

    useEffect(() => {
      if (!mapReady || !map.current) return;
      if (selectedOrg !== FALLBACK_ORG) return;

      const meta = busMetaRef.current;
      let target = null;
      for (const value of meta.values()) {
        if (value?.org === FALLBACK_ORG) {
          target = value;
          break;
        }
      }
      if (!target && meta.size) {
        target = meta.values().next().value;
      }
      if (!target) return;

      const marker = busMarkersRef.current.get(target.id);
      if (!marker) return;
      const pos = marker.getPosition?.();
      if (!pos) return;

      try {
        map.current.setCenter(pos);
      } catch (error) {
        console.warn('지도 중심 이동 실패', error);
      }
    }, [selectedOrg, data, mapReady]);

    useEffect(() => () => {
      busMarkersRef.current.forEach((marker) => marker.setMap(null));
      busMarkersRef.current.clear();
      busOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      busOverlaysRef.current.clear();
      busMetaRef.current.clear();
      stopAllAnimations();
    }, []);

    return (
        <div ref={mapContainer} className={styles.mapContainer}></div>
  );
};

export default MapContainer;
