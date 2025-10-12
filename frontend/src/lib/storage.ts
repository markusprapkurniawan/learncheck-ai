/**
 * LocalStorage Utilities for LearnCheck
 * Handles state persistence dengan user_id dan tutorial_id sebagai key
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StoredAnswers {
  [questionIndex: number]: string; // "0": "A", "1": "B", etc.
}

export interface AssessmentState {
  answers: StoredAnswers;
  currentQuestionIndex: number;
  isSubmitted: boolean;
  lastUpdated: string;
  tutorialId: string;
  userId: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  fontSize?: 'small' | 'default' | 'large';
  layoutWidth?: 'default' | 'fullWidth';
  language?: 'id' | 'en';
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_PREFIX = 'learncheck_';

const getAssessmentKey = (userId: string, tutorialId: string): string => {
  return `${STORAGE_PREFIX}${userId}_${tutorialId}_answers`;
};

const getPreferencesKey = (userId: string): string => {
  return `${STORAGE_PREFIX}${userId}_preferences`;
};

const getProgressKey = (userId: string, tutorialId: string): string => {
  return `${STORAGE_PREFIX}${userId}_${tutorialId}_progress`;
};

// ============================================================================
// ASSESSMENT STATE MANAGEMENT
// ============================================================================

/**
 * Save user answers untuk specific tutorial
 */
export const saveAssessmentState = (
  userId: string,
  tutorialId: string,
  answers: StoredAnswers,
  currentQuestionIndex: number,
  isSubmitted: boolean
): void => {
  try {
    const state: AssessmentState = {
      answers,
      currentQuestionIndex,
      isSubmitted,
      lastUpdated: new Date().toISOString(),
      tutorialId,
      userId
    };

    const key = getAssessmentKey(userId, tutorialId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save assessment state:', error);
  }
};

/**
 * Load user answers untuk specific tutorial
 */
export const loadAssessmentState = (
  userId: string,
  tutorialId: string
): AssessmentState | null => {
  try {
    const key = getAssessmentKey(userId, tutorialId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    const state: AssessmentState = JSON.parse(stored);
    
    // Validate structure
    if (!state.answers || !state.lastUpdated) {
      console.warn('Invalid assessment state structure, clearing...');
      localStorage.removeItem(key);
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to load assessment state:', error);
    return null;
  }
};

/**
 * Clear assessment state (e.g., after submission or reset)
 */
export const clearAssessmentState = (userId: string, tutorialId: string): void => {
  try {
    const key = getAssessmentKey(userId, tutorialId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear assessment state:', error);
  }
};

// ============================================================================
// USER PREFERENCES MANAGEMENT
// ============================================================================

/**
 * Save user UI preferences
 */
export const saveUserPreferences = (userId: string, preferences: UserPreferences): void => {
  try {
    const key = getPreferencesKey(userId);
    localStorage.setItem(key, JSON.stringify({
      ...preferences,
      lastUpdated: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
};

/**
 * Load user UI preferences
 */
export const loadUserPreferences = (userId: string): UserPreferences | null => {
  try {
    const key = getPreferencesKey(userId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    const preferences = JSON.parse(stored);
    return preferences;
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return null;
  }
};

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export interface ProgressData {
  completedQuestions: number;
  totalQuestions: number;
  lastActiveTimestamp: string;
  timeSpent: number; // in seconds
}

/**
 * Save progress tracking data
 */
export const saveProgress = (
  userId: string,
  tutorialId: string,
  progress: ProgressData
): void => {
  try {
    const key = getProgressKey(userId, tutorialId);
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};

/**
 * Load progress tracking data
 */
export const loadProgress = (
  userId: string,
  tutorialId: string
): ProgressData | null => {
  try {
    const key = getProgressKey(userId, tutorialId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load progress:', error);
    return null;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all stored assessment keys untuk specific user
 */
export const getAllUserAssessments = (userId: string): string[] => {
  try {
    const keys: string[] = [];
    const prefix = `${STORAGE_PREFIX}${userId}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key.endsWith('_answers')) {
        keys.push(key);
      }
    }
    
    return keys;
  } catch (error) {
    console.error('Failed to get user assessments:', error);
    return [];
  }
};

/**
 * Clear all data untuk specific user (useful for logout/reset)
 */
export const clearAllUserData = (userId: string): void => {
  try {
    const prefix = `${STORAGE_PREFIX}${userId}_`;
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear user data:', error);
  }
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    console.warn('localStorage not available:', error);
    return false;
  }
};
