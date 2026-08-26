'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function NeuralParticleSphere() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 160;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const graphGroup = new THREE.Group();
    scene.add(graphGroup);

    // Create a 3D Neural Network / Agent Decision DAG Graph
    const nodeCount = 150;
    const radius = 45;
    const nodePositions: THREE.Vector3[] = [];
    
    const pGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);

    const color1 = new THREE.Color(0x3B82F6); // Blue
    const color2 = new THREE.Color(0x8B5CF6); // Violet
    const color3 = new THREE.Color(0x10B981); // Emerald

    // Generate random nodes on a sphere surface
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;

      // Add some noise to make it look organic
      const noise = (Math.random() - 0.5) * 10;
      
      const x = (radius + noise) * Math.cos(theta) * Math.sin(phi);
      const y = (radius + noise) * Math.sin(theta) * Math.sin(phi);
      const z = (radius + noise) * Math.cos(phi);

      const vec = new THREE.Vector3(x, y, z);
      nodePositions.push(vec);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixedColor = i % 3 === 0 ? color1 : i % 3 === 1 ? color2 : color3;
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    pGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Draw the nodes
    const pMaterial = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    const nodes = new THREE.Points(pGeometry, pMaterial);
    graphGroup.add(nodes);

    // Draw connecting lines between close nodes (The DAG / Reasoning Graph)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x6366F1, // Indigo
      transparent: true,
      opacity: 0.15,
    });
    
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions: number[] = [];
    
    // Connect nodes if they are within a certain distance
    const connectDistance = 22;
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < connectDistance) {
          linePositions.push(
            nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
            nodePositions[j].x, nodePositions[j].y, nodePositions[j].z
          );
        }
      }
    }
    
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    graphGroup.add(lines);

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
      time += 0.005;

      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      // Rotate the entire graph slowly
      graphGroup.rotation.y += 0.002;
      graphGroup.rotation.x += 0.001;
      
      // Mouse interaction
      graphGroup.rotation.z = targetY * 0.1;
      graphGroup.position.x = targetX * 15;
      graphGroup.position.y = targetY * 15;

      // Pulse the lines opacity slightly
      lineMaterial.opacity = 0.1 + Math.sin(time * 2) * 0.05;

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
      pGeometry.dispose();
      pMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[220px] flex items-center justify-center pointer-events-none relative" 
    />
  );
}
