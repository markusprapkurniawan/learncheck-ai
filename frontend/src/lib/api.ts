// ============================================================================
// API Service for LearnCheck - Adaptive Formative Assessment
// ============================================================================
// Handles communication with backend API for tutorials, questions, and user data
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================================
// TYPE DEFINITIONS - Frontend Data Models
// ============================================================================

export interface Question {
  id: number;
  question: string;
  options: Array<{
    id: string;  // "A", "B", "C", "D"
    text: string;
  }>;
  correctAnswer: string;  // "A", "B", "C", "D"
  explanation: string;
}

export interface Tutorial {
  id: string;
  title: string;
  content: string;
  description?: string;
  category?: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  fontSize?: 'small' | 'default' | 'large';
  layoutWidth?: 'default' | 'fullWidth';
  language?: 'id' | 'en';
}

export interface GenerateQuestionsRequest {
  content: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
  language?: 'id' | 'en';
  tutorialTitle?: string;
  attemptNumber?: number; // For cache busting and variation
  previousScore?: number; // For adaptive difficulty (0-100)
  userId?: string; // For personalized questions
}

// Backend response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  fallback?: boolean;
  cached?: boolean;
  difficulty?: string; // Adjusted difficulty from backend
  attemptNumber?: number;
  generatedAt?: string;
  metadata?: any;
}

// ============================================================================
// API SERVICE - Main Functions
// ============================================================================

export const apiService = {
  // ========================================================================
  // TUTORIAL ENDPOINTS
  // ========================================================================
  
  /**
   * Fetch single tutorial content dari Backend API
   * @param tutorialId - Tutorial ID dari Dicoding
   */
  async getTutorial(tutorialId: string): Promise<Tutorial> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutorials/${tutorialId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<Tutorial> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch tutorial');
      }
      
      return result.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Fetch all tutorials dengan optional filtering
   */
  async getTutorials(filters?: { 
    category?: string; 
    difficulty?: string; 
    search?: string 
  }): Promise<Tutorial[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.search) params.append('search', filters.search);
      
      const url = `${API_BASE_URL}/api/tutorials${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<Tutorial[]> = await response.json();
      return result.data || [];
    } catch (error) {
      throw error;
    }
  },

  // ========================================================================
  // USER PREFERENCES ENDPOINTS
  // ========================================================================

  /**
   * Get user preferences untuk theme, font, layout
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/preferences`);
      
      if (!response.ok) {
        // Return default preferences if endpoint fails
        return {
          theme: 'light',
          fontSize: 'default',
          layoutWidth: 'default',
          language: 'id'
        };
      }
      
      const result: ApiResponse<{ preference: UserPreferences }> = await response.json();
      return result.data?.preference || {};
    } catch (error) {
      // Return defaults on error
      return {
        theme: 'light',
        fontSize: 'default',
        layoutWidth: 'default',
        language: 'id'
      };
    }
  },

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<UserPreferences> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<{ preference: UserPreferences }> = await response.json();
      return result.data?.preference || preferences;
    } catch (error) {
      console.error('updateUserPreferences error:', error);
      throw error;
    }
  },

  // ========================================================================
  // LLM / QUESTION GENERATION ENDPOINTS
  // ========================================================================

  /**
   * Generate questions via Backend API (MAIN METHOD)
   * Backend akan handle LLM service communication
   */
  async generateQuestions(request: GenerateQuestionsRequest): Promise<ApiResponse<{ questions: Question[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/llm/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: request.content,
          difficulty: request.difficulty || 'medium',
          questionCount: request.questionCount || 3,
          language: request.language || 'id'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<{ questions: Question[] }> = await response.json();
      return result;
    } catch (error) {
      console.error('❌ [API] generateQuestions error:', error);
      throw error;
    }
  },

  // ========================================================================
  // HEALTH CHECK ENDPOINTS
  // ========================================================================

  /**
   * Health check backend API
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`Backend not available: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('healthCheck error:', error);
      throw error;
    }
  }
};