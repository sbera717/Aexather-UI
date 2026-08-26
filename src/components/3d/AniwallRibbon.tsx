'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AniwallRibbon() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.z = 40;
    camera.position.y = 5;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(10, 20, 15);
    scene.add(directionalLight);

    const blueLight = new THREE.PointLight(0x4F46E5, 4, 50);
    blueLight.position.set(-10, -5, 10);
    scene.add(blueLight);

    const purpleLight = new THREE.PointLight(0x7C3AED, 4, 50);
    purpleLight.position.set(10, 5, 10);
    scene.add(purpleLight);

    // Create a group for the ribbon structure
    const ribbonGroup = new THREE.Group();
    scene.add(ribbonGroup);

    // Glass Material
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9, // glass-like
      thickness: 1.5,
      transparent: true,
      opacity: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const boxCount = 35;
    const boxes: THREE.Mesh[] = [];

    // Create the diagonal twisting boxes
    const geometry = new THREE.BoxGeometry(10, 0.4, 3);

    for (let i = 0; i < boxCount; i++) {
      const box = new THREE.Mesh(geometry, glassMaterial);
      
      // Position along a diagonal line
      const t = (i / (boxCount - 1)) - 0.5; // -0.5 to 0.5
      box.position.x = t * 60;
      box.position.y = t * -30;
      box.position.z = Math.sin(t * Math.PI * 4) * 5;

      // Rotation to create a twist
      box.rotation.x = t * Math.PI * 2;
      box.rotation.z = Math.PI / 8; // base diagonal tilt
      box.rotation.y = t * Math.PI;

      ribbonGroup.add(box);
      boxes.push(box);
    }

    // Smooth Cursor follow
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / width) * 2 - 1;
      mouseY = -(((event.clientY - rect.top) / height) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.01;

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Gentle floating animation
      ribbonGroup.position.y = Math.sin(time) * 1.5 + (targetY * 2);
      ribbonGroup.position.x = targetX * 2;
      
      // Gentle twist wave
      boxes.forEach((box, i) => {
        const t = (i / (boxCount - 1)) - 0.5;
        box.rotation.x = t * Math.PI * 2 + Math.sin(time + t * 5) * 0.2;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      glassMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 mix-blend-hard-light" 
    />
  );
}
