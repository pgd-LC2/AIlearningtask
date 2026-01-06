import { useEffect, useRef, useCallback } from 'react';
import { LessonComponent } from '../types';

interface DraftData {
  title: string;
  components: LessonComponent[];
  timestamp: number;
  version: number;
}

const DRAFT_PREFIX = 'draft_lesson_';
const DRAFT_RETENTION_DAYS = 7;
const DEBOUNCE_DELAY = 2000;

export function useDraft(taskId: string | undefined) {
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const getDraftKey = useCallback((id: string) => {
    return `${DRAFT_PREFIX}${id}`;
  }, []);

  const saveDraft = useCallback((
    title: string,
    components: LessonComponent[]
  ) => {
    if (!taskId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const draftData: DraftData = {
          title,
          components,
          timestamp: Date.now(),
          version: 1,
        };
        localStorage.setItem(getDraftKey(taskId), JSON.stringify(draftData));
      } catch (error) {
        console.error('保存草稿失败:', error);
      }
    }, DEBOUNCE_DELAY);
  }, [taskId, getDraftKey]);

  const saveDraftImmediately = useCallback((
    title: string,
    components: LessonComponent[]
  ) => {
    if (!taskId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    try {
      const draftData: DraftData = {
        title,
        components,
        timestamp: Date.now(),
        version: 1,
      };
      localStorage.setItem(getDraftKey(taskId), JSON.stringify(draftData));
    } catch (error) {
      console.error('保存草稿失败:', error);
    }
  }, [taskId, getDraftKey]);

  const loadDraft = useCallback((): DraftData | null => {
    if (!taskId) return null;

    try {
      const draftStr = localStorage.getItem(getDraftKey(taskId));
      if (!draftStr) return null;

      const draft: DraftData = JSON.parse(draftStr);
      return draft;
    } catch (error) {
      console.error('加载草稿失败:', error);
      return null;
    }
  }, [taskId, getDraftKey]);

  const clearDraft = useCallback(() => {
    if (!taskId) return;

    try {
      localStorage.removeItem(getDraftKey(taskId));
    } catch (error) {
      console.error('清除草稿失败:', error);
    }
  }, [taskId, getDraftKey]);

  const hasDraft = useCallback((): boolean => {
    if (!taskId) return false;
    return localStorage.getItem(getDraftKey(taskId)) !== null;
  }, [taskId, getDraftKey]);

  const cleanExpiredDrafts = useCallback(() => {
    try {
      const now = Date.now();
      const retentionMs = DRAFT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(DRAFT_PREFIX)) {
          try {
            const draftStr = localStorage.getItem(key);
            if (draftStr) {
              const draft: DraftData = JSON.parse(draftStr);
              if (now - draft.timestamp > retentionMs) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('清理过期草稿失败:', error);
    }
  }, []);

  useEffect(() => {
    cleanExpiredDrafts();
  }, [cleanExpiredDrafts]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    saveDraft,
    saveDraftImmediately,
    loadDraft,
    clearDraft,
    hasDraft,
  };
}
