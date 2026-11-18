import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearAllData, loadApiKey, loadMaterials, saveApiKey, saveMaterials } from '../services/storage.js';

const StudyContext = createContext(null);

// Global app state: the list of study materials (with their summary, flashcards,
// quiz and attempts) plus the Gemini API key. Everything is mirrored to localStorage.
export function StudyProvider({ children }) {
  const [materials, setMaterials] = useState(loadMaterials);
  const [apiKey, setApiKeyState] = useState(loadApiKey);

  useEffect(() => {
    saveMaterials(materials);
  }, [materials]);

  const addMaterial = useCallback((data) => {
    const material = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      summary: null,
      flashcards: null,
      quiz: null,
      attempts: [],
      ...data,
    };
    setMaterials((prev) => [material, ...prev]);
    return material.id;
  }, []);

  const updateMaterial = useCallback((id, patch) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const deleteMaterial = useCallback((id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addAttempt = useCallback((id, attempt) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, attempts: [...m.attempts, attempt] } : m)));
  }, []);

  const setCardKnown = useCallback((id, cardIndex, known) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id !== id || !m.flashcards) return m;
        const flashcards = m.flashcards.map((c, i) => (i === cardIndex ? { ...c, known } : c));
        return { ...m, flashcards };
      }),
    );
  }, []);

  const setApiKey = useCallback((key) => {
    saveApiKey(key);
    setApiKeyState(key);
  }, []);

  const resetAll = useCallback(() => {
    clearAllData();
    setMaterials([]);
  }, []);

  const value = useMemo(
    () => ({ materials, apiKey, addMaterial, updateMaterial, deleteMaterial, addAttempt, setCardKnown, setApiKey, resetAll }),
    [materials, apiKey, addMaterial, updateMaterial, deleteMaterial, addAttempt, setCardKnown, setApiKey, resetAll],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used inside <StudyProvider>');
  return ctx;
}
