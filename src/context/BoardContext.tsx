import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

const BOARD_STORAGE_KEY = "itracksy:selectedBoard";

interface BoardContextType {
  selectedBoardId: string;
  setSelectedBoardId: (id: string) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function useBoardContext() {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error("useBoardContext must be used within a BoardProvider");
  }
  return context;
}

interface BoardProviderProps {
  children: ReactNode;
}

export function BoardProvider({ children }: BoardProviderProps) {
  // Initialize state from localStorage, fallback to empty string if not found
  const [selectedBoardId, setSelectedBoardId] = useState<string>(() => {
    const storedId = localStorage.getItem(BOARD_STORAGE_KEY);
    return storedId || "";
  });

  // Update localStorage when selectedBoardId changes
  useEffect(() => {
    if (selectedBoardId) {
      localStorage.setItem(BOARD_STORAGE_KEY, selectedBoardId);
    } else {
      localStorage.removeItem(BOARD_STORAGE_KEY);
    }
  }, [selectedBoardId]);

  console.log("selectedBoardId", selectedBoardId);
  return (
    <BoardContext.Provider value={{ selectedBoardId, setSelectedBoardId }}>
      {children}
    </BoardContext.Provider>
  );
}
