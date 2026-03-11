import React, { createContext, useCallback, useContext, useRef } from 'react';

export type RoutineType = 'morning' | 'evening';

type OnRoutineComplete = (type: RoutineType) => void;

/** Persist handler is always called when a routine is completed (for DB write). Set by an always-mounted component. */
type PersistRoutineCompletion = (type: RoutineType) => Promise<void>;

type RoutineCompletionContextValue = {
  reportRoutineComplete: (type: RoutineType) => void;
  setOnComplete: (handler: OnRoutineComplete | null) => void;
  setPersistHandler: (handler: PersistRoutineCompletion | null) => void;
};

const RoutineCompletionContext = createContext<RoutineCompletionContextValue | null>(null);

export function RoutineCompletionProvider({ children }: { children: React.ReactNode }) {
  const handlerRef = useRef<OnRoutineComplete | null>(null);
  const persistHandlerRef = useRef<PersistRoutineCompletion | null>(null);

  const setOnComplete = useCallback((handler: OnRoutineComplete | null) => {
    handlerRef.current = handler;
  }, []);

  const setPersistHandler = useCallback((handler: PersistRoutineCompletion | null) => {
    persistHandlerRef.current = handler;
  }, []);

  const reportRoutineComplete = useCallback((type: RoutineType) => {
    // Always run persist first so completion is saved even when Home is unmounted (e.g. completing from routine-execution screen).
    void persistHandlerRef.current?.(type);
    handlerRef.current?.(type);
  }, []);

  const value: RoutineCompletionContextValue = {
    reportRoutineComplete,
    setOnComplete,
    setPersistHandler,
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
