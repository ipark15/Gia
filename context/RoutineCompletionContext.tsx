import React, { createContext, useCallback, useContext, useRef } from 'react';

export type RoutineType = 'morning' | 'evening';

type OnRoutineComplete = (type: RoutineType) => void;

type RoutineCompletionContextValue = {
  reportRoutineComplete: (type: RoutineType) => void;
  setOnComplete: (handler: OnRoutineComplete | null) => void;
};

const RoutineCompletionContext = createContext<RoutineCompletionContextValue | null>(null);

export function RoutineCompletionProvider({ children }: { children: React.ReactNode }) {
  const handlerRef = useRef<OnRoutineComplete | null>(null);

  const setOnComplete = useCallback((handler: OnRoutineComplete | null) => {
    handlerRef.current = handler;
  }, []);

  const reportRoutineComplete = useCallback((type: RoutineType) => {
    handlerRef.current?.(type);
  }, []);

  const value: RoutineCompletionContextValue = {
    reportRoutineComplete,
    setOnComplete,
  };

  return (
    <RoutineCompletionContext.Provider value={value}>
      {children}
    </RoutineCompletionContext.Provider>
  );
}

export function useRoutineCompletion() {
  const ctx = useContext(RoutineCompletionContext);
  if (!ctx) throw new Error('useRoutineCompletion must be used within RoutineCompletionProvider');
  return ctx;
}
