'use client';
import { useEffect, useRef } from 'react';

export default function HeroAnimation() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;
    let animId: number;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => {
      const THREE = (window as any).THREE;
      const W = el.clientWidth || 560;
      const H = el.clientHeight || 420;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
      camera.position.set(0, 0, 26);

      scene.add(new THREE.AmbientLight(0x9966ff, 0.5));
      const dl = new THREE.DirectionalLight(0xffffff, 1.2);
      dl.position.set(5, 8, 8);
      scene.add(dl);
      const pl1 = new THREE.PointLight(0x7c3aed, 5, 28);
      pl1.position.set(-5, 4, 6);
      scene.add(pl1);
      const pl2 = new THREE.PointLight(0x06b6d4, 4, 22);
      pl2.position.set(7, -3, 5);
      scene.add(pl2);
      const pl3 = new THREE.PointLight(0xec4899, 3, 18);
      pl3.position.set(0, 6, -4);
      scene.add(pl3);

      const reelGroup = new THREE.Group();
      scene.add(reelGroup);

      reelGroup.add(new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.16, 16, 80),
        new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.9, roughness: 0.1, emissive: 0x3b1d8f, emissiveIntensity: 0.4 })
      ));
      reelGroup.add(new THREE.Mesh(
        new THREE.TorusGeometry(2.0, 0.10, 16, 60),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.15, emissive: 0x053f50, emissiveIntensity: 0.35 })
      ));
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32),
        new THREE.MeshStandardMaterial({ color: 0xa78bfa, metalness: 0.95, roughness: 0.05, emissive: 0x5b2fd4, emissiveIntensity: 0.5 })
      );
      hub.rotation.x = Math.PI / 2;
      reelGroup.add(hub);

      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const spoke = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 2.7, 8),
          new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.7, roughness: 0.3 })
        );
        spoke.rotation.z = a + Math.PI / 2;
        spoke.position.set(Math.cos(a) * 1.25, Math.sin(a) * 1.25, 0);
        reelGroup.add(spoke);
      }

      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const hole = new THREE.Mesh(
          new THREE.TorusGeometry(0.20, 0.055, 8, 16),
          new THREE.MeshStandardMaterial({ color: 0x1a0a3a })
        );
        hole.position.set(Math.cos(a) * 3.2, Math.sin(a) * 3.2, 0.08);
        reelGroup.add(hole);
      }

      const phoneConfigs = [
        { color: 0xec4899, orbit: 7.0, speed: 0.42, phase: 0,    tilt: 0.28  },
        { color: 0x06b6d4, orbit: 7.6, speed: 0.33, phase: 2.09, tilt: -0.22 },
        { color: 0xff6b35, orbit: 7.2, speed: 0.52, phase: 4.18, tilt: 0.18  },
      ];
      const phones: any[] = [];
      phoneConfigs.forEach(cfg => {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 1.32, 0.075),
          new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.8, roughness: 0.15 })
        ));
        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.60, 1.10),
          new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.color, emissiveIntensity: 0.85 })
        );
        screen.position.z = 0.045;
        g.add(screen);
        const play = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.008, 3),
          new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 })
        );
        play.rotation.x = Math.PI / 2;
        play.position.z = 0.052;
        g.add(play);
        g.userData = { ...cfg };
        scene.add(g);
        phones.push(g);
      });

      const frames: any[] = [];
      const fColors = [0x7c3aed, 0x06b6d4, 0xec4899, 0xff6b35, 0x10b981];
      const fEmissives = [0x3b1d8f, 0x053f50, 0x7a1840, 0x7a2c10, 0x065535];
      for (let i = 0; i < 12; i++) {
        const g = new THREE.Group();
        const fw = 1.1 + Math.random() * 0.7;
        const fh = fw * (9 / 16);
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(fw, fh, 0.035),
          new THREE.MeshStandardMaterial({ color: fColors[i%5], metalness: 0.6, roughness: 0.2, emissive: fEmissives[i%5], emissiveIntensity: 0.3 })
        );
        g.add(frame);
        const inner = new THREE.Mesh(
          new THREE.PlaneGeometry(fw * 0.78, fh * 0.78),
          new THREE.MeshStandardMaterial({ color: 0x0a0a1a })
        );
        inner.position.z = 0.022;
        g.add(inner);
        const r = 9.5 + Math.random() * 4.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.PI * 0.25 + Math.random() * Math.PI * 0.5;
        g.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.65,
          r * Math.cos(phi) - 7
        );
        g.rotation.set(
          Math.random() * 0.35 - 0.175,
          Math.random() * 0.35 - 0.175,
          Math.random() * 0.28 - 0.14
        );
        g.userData = { baseY: g.position.y, speed: 0.28 + Math.random() * 0.45, phase: Math.random() * Math.PI * 2 };
        scene.add(g);
        frames.push(g);
      }

      const pCount = 280;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        pPos[i*3]   = (Math.random() - 0.5) * 38;
        pPos[i*3+1] = (Math.random() - 0.5) * 28;
        pPos[i*3+2] = (Math.random() - 0.5) * 22 - 4;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
        color: 0xa78bfa, size: 0.11, transparent: true, opacity: 0.5, sizeAttenuation: true
      })));

      const beams: any[] = [];
      [0x7c3aed, 0x06b6d4, 0xec4899].forEach((color, i) => {
        const pts = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 }));
        scene.add(line);
        beams.push({ line, geo, pts });
      });

      let mx = 0, my = 0;
      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        my = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      };
      el.addEventListener('mousemove', onMove);

      let t = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.011;
        reelGroup.rotation.z = t * 0.17;
        reelGroup.rotation.x += (my * 0.14 - reelGroup.rotation.x) * 0.04;
        reelGroup.rotation.y += (mx * 0.18 - reelGroup.rotation.y) * 0.04;
        pl1.intensity = 4 + Math.sin(t * 1.2) * 1.3;
        pl2.intensity = 3.5 + Math.cos(t * 0.85) * 1.0;
        pl3.intensity = 2.5 + Math.sin(t * 1.6) * 0.8;
        phones.forEach((ph, i) => {
          const pd = ph.userData;
          const a = t * pd.speed + pd.phase;
          ph.position.set(Math.cos(a)*pd.orbit, Math.sin(a*0.55)*2.4+Math.sin(t*0.38)*0.9, Math.sin(a)*pd.orbit*0.48);
          ph.rotation.y = -a + Math.PI / 2;
          ph.rotation.z = pd.tilt + Math.sin(t * 0.65 + i) * 0.07;
          const b = beams[i];
          b.pts[0].set(0,0,0);
          b.pts[1].copy(ph.position).multiplyScalar(0.88);
          b.geo.setFromPoints(b.pts);
          b.line.material.opacity = 0.12 + Math.abs(Math.sin(t*0.75+i))*0.28;
        });
        frames.forEach(f => {
          f.position.y = f.userData.baseY + Math.sin(t*f.userData.speed+f.userData.phase)*0.55;
          f.rotation.z += 0.0018;
          f.rotation.y += 0.0025;
        });
        camera.position.x += (mx*1.4 - camera.position.x)*0.02;
        camera.position.y += (my*0.9 - camera.position.y)*0.02;
        camera.position.z = 26 + Math.sin(t*0.22)*1.4;
        camera.lookAt(0,0,0);
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);
      (el as any)._cleanup = () => {
        cancelAnimationFrame(animId);
        el.removeEventListener('mousemove', onMove);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
      };
    };
    document.head.appendChild(script);

    return () => {
      if ((el as any)._cleanup) (el as any)._cleanup();
      if (document.head.contains(script)) document.head.removeChild(script);
      while (el.firstChild) el.removeChild(el.firstChild);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '420px',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'crosshair',
      }}
    />
  );
}
