import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

const RADIUS = 2;
const DOT_SIZE = 0.12;

/* 将经纬度转换为三维坐标 */
function latLngToVec3(lat, lng, radius = RADIUS) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export default function GlobeView({ markers, onPlaceClick, previewMarker }) {
  const containerRef = useRef(null);
  const cleanupRef = useRef(null);

  /* ── 拖拽旋转状态 ── */
  const dragState = useRef({
    isDragging: false,
    hasMoved: false,
    prevX: 0,
    prevY: 0,
    autoRotate: true,
    autoRotateTimer: null,
  });

  /* ── 纯点击（非拖拽）时触发标记选择 ── */
  const handleClick = useCallback((event, scene, camera, raycaster) => {
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(mouse, camera);

    const dotMeshes = [];
    scene.children.forEach((child) => {
      if (child.userData?.isMarker) dotMeshes.push(child);
    });

    const intersects = raycaster.intersectObjects(dotMeshes);
    if (intersects.length > 0) {
      const hit = intersects[0].object.userData.placeName;
      if (hit && onPlaceClick) onPlaceClick(hit);
    }
  }, [onPlaceClick]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    /* ── 场景 ── */
    const scene = new THREE.Scene();

    /* ── 相机 ── */
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 100);
    camera.position.set(0, 0, 6);

    /* ── 渲染器 ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    /* ── 地球纹理 ── */
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    );

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 64, 64),
      new THREE.MeshPhongMaterial({
        map: earthTexture,
        specular: new THREE.Color(0x333333),
        shininess: 5,
      }),
    );

    /* ── 大气层发光 ── */
    const glowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
          gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.6);
        }
      `,
    });
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.04, 64, 64),
      glowMaterial,
    );

    /* ⭐ 地球组：包含球体+大气层+标记，统一旋转 */
    const globeGroup = new THREE.Group();
    globeGroup.add(sphere);
    globeGroup.add(glow);
    scene.add(globeGroup);

    /* ── 星光背景 ── */
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPos[i] = (Math.random() - 0.5) * 200;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.6 }),
    );
    scene.add(stars);

    /* ── 灯光 ── */
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    backLight.position.set(-5, -2, -5);
    scene.add(backLight);

    /* ── 标记点 ── */
    const markerGroup = new THREE.Group();

    markers.forEach((m) => {
      const pos = latLngToVec3(m.lat, m.lng);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(DOT_SIZE * 0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      dot.position.copy(pos);
      dot.userData = { isMarker: true, placeName: m.placeName };
      markerGroup.add(dot);

      /* 光晕环 */
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(DOT_SIZE * 1.5, DOT_SIZE * 2.5, 24),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        }),
      );
      ring.position.copy(pos.clone().multiplyScalar(1.02));
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      markerGroup.add(ring);
    });

    globeGroup.add(markerGroup);

    /* ── 预览标记 ── */
    let previewGroup = null;
    if (previewMarker) {
      previewGroup = new THREE.Group();
      const pos = latLngToVec3(previewMarker.lat, previewMarker.lng);

      /* 较大的金色光点 */
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(DOT_SIZE * 1.5, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffaa44 }),
      );
      dot.position.copy(pos);
      previewGroup.add(dot);

      /* 外层脉动光环 */
      const glowRing = new THREE.Mesh(
        new THREE.RingGeometry(DOT_SIZE * 2, DOT_SIZE * 3.5, 32),
        new THREE.MeshBasicMaterial({
          color: 0xffaa44,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        }),
      );
      glowRing.position.copy(pos.clone().multiplyScalar(1.02));
      glowRing.lookAt(new THREE.Vector3(0, 0, 0));
      previewGroup.add(glowRing);

      /* 竖直线（从地面到标记点上方） */
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        pos.clone().multiplyScalar(1.01),
        pos.clone().multiplyScalar(1.35),
      ]);
      const line = new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({
          color: 0xffaa44,
          transparent: true,
          opacity: 0.3,
        }),
      );
      previewGroup.add(line);

      globeGroup.add(previewGroup);
    }

    /* ── 光线投射器（点击检测） ── */
    const raycaster = new THREE.Raycaster();

    /* ── 鼠标/触控交互 ── */
    const ds = dragState.current;

    const onPointerDown = (e) => {
      ds.isDragging = true;
      ds.hasMoved = false;
      ds.prevX = e.clientX;
      ds.prevY = e.clientY;

      /* 拖拽时暂停自动旋转 */
      ds.autoRotate = false;
      if (ds.autoRotateTimer) {
        clearTimeout(ds.autoRotateTimer);
        ds.autoRotateTimer = null;
      }

      container.style.cursor = 'grabbing';
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!ds.isDragging) return;

      const dx = e.clientX - ds.prevX;
      const dy = e.clientY - ds.prevY;

      /* 移动超过阈值才视为拖拽 */
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        ds.hasMoved = true;
      }

      /* 使用四元数旋转：水平拖拽绕 Y 轴，垂直拖拽绕 X 轴 */
      const q = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(0, dx * 0.005, 0))
        .multiply(new THREE.Quaternion()
          .setFromEuler(new THREE.Euler(dy * 0.005, 0, 0)));
      globeGroup.quaternion.multiplyQuaternions(q, globeGroup.quaternion);

      ds.prevX = e.clientX;
      ds.prevY = e.clientY;
    };

    const onPointerUp = (e) => {
      ds.isDragging = false;
      container.style.cursor = 'grab';
      renderer.domElement.style.cursor = 'grab';

      /* 没有拖动 → 视为点击标记 */
      if (!ds.hasMoved) {
        handleClick(e, scene, camera, raycaster);
      }

      /* 2 秒无操作后恢复自动旋转 */
      if (ds.autoRotateTimer) clearTimeout(ds.autoRotateTimer);
      ds.autoRotateTimer = setTimeout(() => {
        ds.autoRotate = true;
      }, 2000);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerUp);
    container.style.cursor = 'grab';
    renderer.domElement.style.cursor = 'grab';

    /* ── 渲染循环 ── */
    let animId;
    let pulsePhase = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      /* 自动旋转（仅在非拖拽且超时后恢复） */
      if (ds.autoRotate) {
        globeGroup.rotation.y += 0.0015;
      }

      /* 星光独立缓慢旋转 */
      stars.rotation.y += 0.0002;

      /* 预览标记脉动 */
      if (previewGroup) {
        pulsePhase += 0.04;
        const pulse = 0.5 + 0.5 * Math.sin(pulsePhase);
        previewGroup.children.forEach((child) => {
          if (child.isLine) {
            child.material.opacity = 0.15 + 0.25 * pulse;
          } else if (child.geometry?.type === 'RingGeometry') {
            child.material.opacity = 0.25 + 0.45 * pulse;
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    /* ── 自适应 ── */
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', resize);

    /* ── 清理 ── */
    cleanupRef.current = () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerUp);
      if (ds.autoRotateTimer) clearTimeout(ds.autoRotateTimer);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };

    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [markers, previewMarker, handleClick]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }}
    />
  );
}
