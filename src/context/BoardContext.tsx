import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

const BOARD_STORAGE_KEY = "selectedBoard";

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
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");

  // Load initial value
  useEffect(() => {
    async function loadStoredBoard() {
      const storedId = await window.electronWindow.store.get(BOARD_STORAGE_KEY);
      console.log("storedId from electron store:", storedId);
      if (storedId) {
        setSelectedBoardId(storedId as string);
      }
    }
    loadStoredBoard();
  }, []);

  // Persist changes
  useEffect(() => {
    if (selectedBoardId) {
      window.electronWindow.store.set(BOARD_STORAGE_KEY, selectedBoardId);
    }
  }, [selectedBoardId]);

  console.log("selectedBoardId", selectedBoardId);
  return (
    <BoardContext.Provider value={{ selectedBoardId, setSelectedBoardId }}>
      {children}
    </BoardContext.Provider>
  );
}
