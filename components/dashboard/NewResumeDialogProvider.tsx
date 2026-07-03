"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { NewResumeDialog } from "./NewResumeDialog";

interface NewResumeDialogContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const NewResumeDialogContext = createContext<NewResumeDialogContextValue | null>(
  null
);

export function useNewResumeDialog(): NewResumeDialogContextValue {
  const ctx = useContext(NewResumeDialogContext);
  if (!ctx) {
    throw new Error(
      "useNewResumeDialog must be used within a NewResumeDialogProvider"
    );
  }
  return ctx;
}

export function NewResumeDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ open, close, isOpen }),
    [open, close, isOpen]
  );

  return (
    <NewResumeDialogContext.Provider value={value}>
      {children}
      <NewResumeDialog open={isOpen} onClose={close} />
    </NewResumeDialogContext.Provider>
  );
}
