'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useAuth } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

function SessionManager({ children }: { children: ReactNode }) {
  const auth = useAuth(); // Assuming useAuth is available after FirebaseProvider is rendered

  useEffect(() => {
    const sessionExpiry = localStorage.getItem('sessionExpiry');
    if (sessionExpiry && new Date().getTime() > Number(sessionExpiry)) {
      signOut(auth).then(() => {
        localStorage.removeItem('sessionExpiry');
      });
    }

    // Optional: check periodically
    const interval = setInterval(() => {
      const sessionExpiry = localStorage.getItem('sessionExpiry');
      if (sessionExpiry && new Date().getTime() > Number(sessionExpiry)) {
        if (auth.currentUser) { // Check if user is still logged in
          signOut(auth).then(() => {
            localStorage.removeItem('sessionExpiry');
          });
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [auth]);

  return <>{children}</>;
}


export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <SessionManager>
        {children}
      </SessionManager>
    </FirebaseProvider>
  );
}
