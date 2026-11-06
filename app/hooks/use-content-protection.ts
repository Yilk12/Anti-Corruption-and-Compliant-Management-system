"use client";

import { useEffect } from "react";

export function useContentProtection() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable keyboard shortcuts for copy, cut, print, save
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Ctrl+C, Ctrl+X, Ctrl+P, Ctrl+S, Ctrl+U, Ctrl+A
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" ||
          e.key === "x" ||
          e.key === "p" ||
          e.key === "s" ||
          e.key === "u" ||
          e.key === "a")
      ) {
        e.preventDefault();
        return false;
      }
      
      // Disable Print Screen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        alert("Screenshots are not allowed on this page for security reasons.");
        return false;
      }
      
      // Disable F12 (developer tools)
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
    };

    // Disable drag events
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // Disable select events
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);

    // Add CSS to disable selection
    const style = document.createElement("style");
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      ::selection {
        background: transparent !important;
      }
      
      ::-moz-selection {
        background: transparent !important;
      }
      
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      @media print {
        body {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Add watermark overlay
    const watermark = document.createElement("div");
    watermark.id = "security-watermark";
    watermark.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999999;
      opacity: 0.15;
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(0, 0, 0, 0.03) 10px,
        rgba(0, 0, 0, 0.03) 20px
      );
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
      justify-content: center;
      overflow: hidden;
    `;
    
    // Add watermark text
    const watermarkText = document.createElement("div");
    watermarkText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 48px;
      font-weight: bold;
      color: rgba(0, 0, 0, 0.1);
      white-space: nowrap;
      letter-spacing: 10px;
    `;
    watermarkText.textContent = "CONFIDENTIAL - DO NOT COPY";
    watermark.appendChild(watermarkText);
    document.body.appendChild(watermark);

    // Blur content when window loses focus (to prevent screenshots from other apps)
    const handleBlur = () => {
      document.body.style.filter = "blur(10px)";
      document.body.style.pointerEvents = "none";
    };

    const handleFocus = () => {
      document.body.style.filter = "none";
      document.body.style.pointerEvents = "auto";
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    // Detect visibility change (user switched tabs)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.style.filter = "blur(10px)";
      } else {
        document.body.style.filter = "none";
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      document.head.removeChild(style);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.body.style.filter = "none";
      document.body.style.pointerEvents = "auto";
      
      const existingWatermark = document.getElementById("security-watermark");
      if (existingWatermark) {
        document.body.removeChild(existingWatermark);
      }
    };
  }, []);
}
