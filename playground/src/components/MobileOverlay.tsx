"use client";

import React, { useState, useEffect } from 'react';
import { DesktopIcon, DownloadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

const MobileOverlay = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    const handleResize = () => {
      checkMobile();
    };

    checkMobile();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobile]);

  const handleDismiss = () => {
    setIsMobile(false);
    localStorage.setItem('mobileOverlayDismissed', 'true');
  };

  const handleClick = () => {
    window.location.href = "https://glam.systems/";
  };

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center gap-4 w-2/3 text-sm">
      <DesktopIcon className="w-24 h-24 text-muted-foreground" />
        <p className="text-lg font-medium">Not Accessible on Mobile</p>
        <p className="text-muted-foreground leading-5 text-center">
          GLAM is currently not available on mobile devices. Please use a desktop for the best experience.
        </p>
        <Button variant="outline" className="w-full text-muted-foreground" onClick={handleClick}>Homepage</Button>
      </div>
    </div>
  );
};

export default MobileOverlay;
