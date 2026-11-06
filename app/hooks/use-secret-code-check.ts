"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { readToken } from "@/app/lib/auth";

export function useSecretCodeCheck(currentPath: string) {
  const router = useRouter();
  const isCheckingRef = useRef(false);

  useEffect(() => {
    const checkSecretCodeStatus = async () => {
      try {
        console.log('=== Secret Code Check Started ===');
        console.log('Current path:', currentPath);
        
        // Skip check if already on secret code pages
        if (currentPath.includes('/secret-code/')) {
          console.log('Already on secret code page, skipping check');
          return;
        }

        // Check if user has verified secret code in this session
        const sessionVerified = sessionStorage.getItem('secretCodeVerified');
        console.log('Session verified flag:', sessionVerified);
        
        if (sessionVerified === 'true') {
          console.log('Secret code already verified in this session, skipping check');
          return; // Already verified in this session, don't prompt again
        }

        // Prevent concurrent checks
        if (isCheckingRef.current) {
          console.log('Check already in progress, skipping duplicate');
          return;
        }
        
        isCheckingRef.current = true;

        const token = readToken();
        const response = await fetch('http://localhost:4000/api/secret-code/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        isCheckingRef.current = false;
        
        if (response.ok) {
          const data = await response.json();
          const status = data.status;
          console.log('Secret code status from backend:', status);
          
          if (status === 'NOT_CREATED' || status === 'RESET_REQUIRED') {
            // Check if we've already redirected for this status
            const redirectKey = `secretCodeRedirected_${status}`;
            if (sessionStorage.getItem(redirectKey) === 'true') {
              console.log('Already redirected for this status, skipping');
              return;
            }
            sessionStorage.setItem(redirectKey, 'true');
            
            sessionStorage.setItem('secretCodeRedirectUrl', currentPath);
            console.log('Setting redirect URL to:', currentPath);
            console.log('Stored redirect URL:', sessionStorage.getItem('secretCodeRedirectUrl'));
            router.push('/secret-code/create-secret-code');
            return false;
          } else if (status === 'VERIFICATION_REQUIRED') {
            // Check if we've already redirected for this status
            const redirectKey = 'secretCodeRedirected_VERIFICATION_REQUIRED';
            if (sessionStorage.getItem(redirectKey) === 'true') {
              console.log('Already redirected for this status, skipping');
              return;
            }
            sessionStorage.setItem(redirectKey, 'true');
            
            sessionStorage.setItem('secretCodeRedirectUrl', currentPath);
            console.log('Setting redirect URL to:', currentPath);
            console.log('Stored redirect URL:', sessionStorage.getItem('secretCodeRedirectUrl'));
            router.push('/secret-code/verify');
            return false;
          }
          return true;
        }
      } catch (error) {
        console.error('Error checking secret code status:', error);
        isCheckingRef.current = false;
      }
      return true;
    };

    checkSecretCodeStatus();
  }, [router, currentPath]);
}
