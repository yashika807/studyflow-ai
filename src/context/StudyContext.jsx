import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearUserData, loadApiKey, loadEvents, loadMaterials, saveApiKey, saveEvents, saveMaterials } from '../services/storage.js';
import { useAuth } from './AuthContext.jsx';

const StudyContext = createContext(null);

const eventKey = (e) => `${e.title.trim().toLowerCase()}|${e.date}|${e.time || ''}`;

// Global app state for the logged-in user: study materials (with summary, flashcards,
// quiz and attempts), calendar events and the Gemini API key. Mirrored to localStorage.
export function StudyProvider({ children }) {
  const { user } = useAuth();
  const userId = user.id;

  const [materials, setMaterials] = useState(() => loadMaterials(userId));
  const [events, setEvents] = useState(() => loadEvents(userId));
  const [apiKey, setApiKeyState] = useState(loadApiKey);

  useEffect(() => {
    saveMaterials(userId, materials);
  }, [userId, materials]);

  useEffect(() => {
    saveEvents(userId, events);
  }, [userId, events]);

  // ----- materials -----
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

  // ----- calendar events -----
  // Adds events that are not already on the calendar and returns how many were new.
  const addEvents = useCallback(
    (incoming) => {
      const seen = new Set(events.map(eventKey));
      const fresh = [];
      incoming.forEach((e) => {
        const key = eventKey(e);
        if (seen.has(key)) return;
        seen.add(key);
        fresh.push({ id: crypto.randomUUID(), title: e.title.trim(), date: e.date, time: e.time || '', source: e.source || 'manual' });
      });
      if (fresh.length) setEvents((prev) => [...prev, ...fresh]);
      return fresh.length;
    },
    [events],
  );

  const deleteEvent = useCallback((id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ----- settings -----
  const setApiKey = useCallback((key) => {
    saveApiKey(key);
    setApiKeyState(key);
  }, []);

  const resetAll = useCallback(() => {
    clearUserData(userId);
    setMaterials([]);
    setEvents([]);
  }, [userId]);

  const value = useMemo(
    () => ({
      materials,
      events,
      apiKey,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      addAttempt,
      setCardKnown,
      addEvents,
      deleteEvent,
      setApiKey,
      resetAll,
    }),
    [materials, events, apiKey, addMaterial, updateMaterial, deleteMaterial, addAttempt, setCardKnown, addEvents, deleteEvent, setApiKey, resetAll],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used inside <StudyProvider>');
  return ctx;
}
