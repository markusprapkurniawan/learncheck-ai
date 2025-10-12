// ============================================================================
// IntroScreen Component - Quiz Introduction with Generation Status
// ============================================================================
// Shows quiz rules and start button, with AI generation progress indicator
// Includes attempt history similar to Dicoding's layout
// ============================================================================

import { Button } from "@/components/ui/button";
import LoadingSpinner from "./LoadingSpinner";

interface AttemptHistory {
  attemptNumber: number;
  score: number;
  totalQuestions: number;
  difficulty: string;
  timestamp: string;
}

interface IntroScreenProps {
  onStart: () => void;
  totalQuestions: number;
  duration: number;
  courseName: string;
  isGenerating?: boolean;
  estimatedGenerationTime?: number;
  attemptHistory?: AttemptHistory[];
  onViewDetail?: (index: number) => void; // Callback to view history detail
}

const IntroScreen = ({ 
  onStart, 
  totalQuestions, 
  duration, 
  courseName,
  isGenerating = false,
  estimatedGenerationTime = 15,
  attemptHistory = [],
  onViewDetail
}: IntroScreenProps) => {
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground mb-6">
            {isGenerating ? "Membuat Soal AI..." : "Aturan"}
          </h1>
          
          {isGenerating ? (
            <div className="py-4">
              <LoadingSpinner 
                message="AI sedang menganalisis materi dan membuat soal berkualitas untuk Anda..."
                showCountdown={true}
                estimatedSeconds={estimatedGenerationTime}
              />
              <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm text-center text-muted-foreground">
                  Soal akan disesuaikan dengan tingkat kesulitan berdasarkan performa Anda sebelumnya
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-5 mb-8">
                <p className="text-foreground leading-relaxed">
                  Kuis ini bertujuan untuk menguji pengetahuan Anda tentang materi <strong>{courseName}</strong>.
                </p>

                <div>
                  <p className="text-foreground mb-4">
                    Terdapat <strong>{totalQuestions} pertanyaan</strong> yang harus dikerjakan dalam kuis ini. 
                    Beberapa ketentuannya sebagai berikut:
                  </p>

                  <ul className="space-y-2 ml-6 list-disc text-foreground">
                    <li>Durasi ujian: <strong>{duration} menit</strong></li>
                    <li>Soal dibuat oleh <strong>AI</strong> berdasarkan materi pembelajaran</li>
                    <li>Tingkat kesulitan <strong>adaptif</strong> sesuai kemampuan Anda</li>
                    <li>Syarat kelulusan: <strong>80%</strong></li>
                  </ul>
                </div>

                <p className="text-lg font-semibold text-foreground">
                  Selamat Mengerjakan!
                </p>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={onStart} 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90"
                  disabled={totalQuestions === 0}
                >
                  {totalQuestions === 0 ? "Soal Belum Siap..." : "Mulai"}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Riwayat Section - Dicoding Style */}
        {!isGenerating && (
          <div className="mt-6 bg-card rounded-lg border border-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">Riwayat</h2>
            
            {attemptHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Belum ada riwayat pengerjaan untuk kuis ini.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Tanggal</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-foreground">Persentase</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-foreground">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attemptHistory.map((attempt, index) => {
                      const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                      const isPassed = percentage >= 80;
                      
                      return (
                        <tr key={index} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm text-foreground">
                            {formatDate(attempt.timestamp)}
                          </td>
                          <td className="py-3 px-4 text-center text-sm font-semibold text-foreground">
                            {percentage}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isPassed ? (
                              <span className="inline-block px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full border border-success/20">
                                Lulus
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 bg-error/10 text-error text-xs font-medium rounded-full border border-error/20">
                                Belum Lulus
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => onViewDetail?.(index)}
                            >
                              Lihat Detail
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntroScreen;
