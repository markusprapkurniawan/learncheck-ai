import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService, type Question, type GenerateQuestionsRequest } from '@/lib/api';

// Custom hook untuk fetch tutorial dan generate questions
export const useAssessment = (tutorialId?: string) => {
  const [tutorialContent, setTutorialContent] = useState<string>('');
  const [tutorialTitle, setTutorialTitle] = useState<string>('');

  // Fetch tutorial content
  const tutorialQuery = useQuery({
    queryKey: ['tutorial', tutorialId],
    queryFn: () => tutorialId ? apiService.getTutorial(tutorialId) : null,
    enabled: !!tutorialId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate questions mutation
  const generateQuestionsMutation = useMutation({
    mutationFn: (request: GenerateQuestionsRequest) => 
      apiService.generateQuestions(request),
    onError: (error) => {
      console.error('Failed to generate questions:', error);
    }
  });

  // Update tutorial content when query succeeds
  useEffect(() => {
    if (tutorialQuery.data) {
      setTutorialContent(tutorialQuery.data.content);
      setTutorialTitle(tutorialQuery.data.title);
    }
  }, [tutorialQuery.data]);

  // Function to generate questions
  const generateQuestions = async (options?: Partial<GenerateQuestionsRequest>) => {
    if (!tutorialContent) {
      throw new Error('No tutorial content available');
    }

    const request: GenerateQuestionsRequest = {
      content: tutorialContent,
      difficulty: 'intermediate',
      questionCount: 3,
      language: 'id',
      tutorialTitle: tutorialTitle || 'Tutorial',
      ...options
    };

    return generateQuestionsMutation.mutateAsync(request);
  };

  return {
    // Tutorial data
    tutorial: tutorialQuery.data,
    tutorialLoading: tutorialQuery.isLoading,
    tutorialError: tutorialQuery.error,
    
    // Questions generation
    generateQuestions,
    questionsLoading: generateQuestionsMutation.isPending,
    questionsError: generateQuestionsMutation.error,
    questionsData: generateQuestionsMutation.data,
    
    // Utilities
    refetchTutorial: tutorialQuery.refetch,
    resetQuestions: generateQuestionsMutation.reset
  };
};

// Hook untuk health checks
export const useHealthCheck = () => {
  const backendHealth = useQuery({
    queryKey: ['health', 'backend'],
    queryFn: apiService.healthCheck,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Check every minute
    retry: 3
  });

  const llmHealth = useQuery({
    queryKey: ['health', 'llm'],
    queryFn: apiService.healthCheckLLM,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 3
  });

  return {
    backendHealthy: backendHealth.data?.status === 'ok',
    llmHealthy: llmHealth.data?.status === 'ok',
    backendLoading: backendHealth.isLoading,
    llmLoading: llmHealth.isLoading,
    backendError: backendHealth.error,
    llmError: llmHealth.error,
    refetchHealth: () => {
      backendHealth.refetch();
      llmHealth.refetch();
    }
  };
};

// Hook untuk URL params (tutorial_id dan user_id dari iFrame parent)
export const useIFrameParams = () => {
  const [params, setParams] = useState<{
    tutorialId?: string;
    userId?: string;
  }>({});

  useEffect(() => {
    // Get params from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tutorialId = urlParams.get('tutorial_id') || undefined;
    const userId = urlParams.get('user_id') || undefined;

    // Try to get params from parent window (iFrame integration)
    try {
      if (window.parent !== window) {
        // Send request to parent for params
        window.parent.postMessage({ type: 'REQUEST_PARAMS' }, '*');
        
        // Listen for response
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'PARAMS_RESPONSE') {
            setParams({
              tutorialId: event.data.tutorial_id || tutorialId,
              userId: event.data.user_id || userId
            });
          }
        };
        
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
      }
    } catch (error) {
      console.warn('Unable to communicate with parent window:', error);
    }

    // Fallback to URL params
    setParams({ tutorialId, userId });
  }, []);

  return params;
};