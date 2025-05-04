import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import './App.css';

interface LearningPlan {
  isLearningRelated: boolean;
  responseLanguage: string;
  subject?: string;
  overview?: string;
  duration?: {
    estimatedWeeks: number;
    hoursPerWeek: number;
  };
  topics?: Array<{
    name: string;
    description: string;
    estimatedTimeToMaster: string;
    resources: Array<{
      type: string;
      name: string;
      link: string;
      description: string;
    }>;
  }>;
  weeklySchedule?: Array<{
    week: number;
    focus: string;
    goals: string[];
    dailyBreakdown: {
      [key: string]: string[];
    };
    milestones: string[];
  }>;
  message?: string;
  suggestion?: string;
  assessmentMethods?: string[];
  additionalTips?: string[];
}

const resourceIcon = (type: string) => {
  switch (type) {
    case 'book': return '📖';
    case 'course': return '🎓';
    case 'website': return '🌐';
    default: return '🔗';
  }
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState<LearningPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [theme, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}?text=${encodeURIComponent(userInput)}`);
      setResponse(response.data);
    } catch (error) {
      setError(language === 'ar' ? 'حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.' : 'An error occurred while connecting to the server. Please try again.');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!response) return;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    let y = 40;
    const lineHeight = 18;
    const margin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(20);
    pdf.text(response.subject || '', margin, y);
    y += 30;
    pdf.setFontSize(12);
    pdf.text('Overview:', margin, y);
    y += lineHeight;
    pdf.setFont('helvetica', 'normal');
    pdf.text(pdf.splitTextToSize(response.overview || '', pageWidth - 2 * margin), margin, y);
    y += lineHeight * 2;
    if (response.duration) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Estimated Duration:', margin, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `${response.duration.estimatedWeeks} weeks • ${response.duration.hoursPerWeek} hours per week`,
        margin + 130,
        y
      );
      y += lineHeight * 2;
    }
    if (response.topics) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Topics:', margin, y);
      y += lineHeight;
      response.topics.forEach((topic) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`- ${topic.name}`, margin + 10, y);
        y += lineHeight;
        pdf.setFont('helvetica', 'normal');
        pdf.text(pdf.splitTextToSize(topic.description, pageWidth - 2 * margin - 20), margin + 20, y);
        y += lineHeight;
        pdf.text(`Estimated time: ${topic.estimatedTimeToMaster}`, margin + 20, y);
        y += lineHeight;
        if (topic.resources && topic.resources.length > 0) {
          pdf.text('Resources:', margin + 20, y);
          y += lineHeight;
          topic.resources.forEach((res) => {
            pdf.text(
              `• [${res.type}] ${res.name}: ${res.description} (${res.link})`,
              margin + 30,
              y
            );
            y += lineHeight;
          });
        }
        y += lineHeight / 2;
      });
      y += lineHeight;
    }
    if (response.weeklySchedule) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Weekly Schedule:', margin, y);
      y += lineHeight;
      response.weeklySchedule.forEach((week) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Week ${week.week}: ${week.focus}`, margin + 10, y);
        y += lineHeight;
        pdf.setFont('helvetica', 'normal');
        pdf.text('Goals:', margin + 20, y);
        y += lineHeight;
        week.goals.forEach((goal) => {
          pdf.text(`• ${goal}`, margin + 30, y);
          y += lineHeight;
        });
        pdf.text('Daily Breakdown:', margin + 20, y);
        y += lineHeight;
        Object.entries(week.dailyBreakdown).forEach(([day, tasks]) => {
          pdf.text(`${day}:`, margin + 30, y);
          y += lineHeight;
          tasks.forEach((task) => {
            pdf.text(`- ${task}`, margin + 40, y);
            y += lineHeight;
          });
        });
        pdf.text('Milestones:', margin + 20, y);
        y += lineHeight;
        week.milestones.forEach((ms) => {
          pdf.text(`• ${ms}`, margin + 30, y);
          y += lineHeight;
        });
        y += lineHeight;
        if (y > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
      });
      y += lineHeight;
    }
    if (response.assessmentMethods && response.assessmentMethods.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Assessment Methods:', margin, y);
      y += lineHeight;
      pdf.setFont('helvetica', 'normal');
      response.assessmentMethods.forEach((method) => {
        pdf.text(`• ${method}`, margin + 10, y);
        y += lineHeight;
      });
      y += lineHeight;
    }
    if (response.additionalTips && response.additionalTips.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Additional Tips:', margin, y);
      y += lineHeight;
      pdf.setFont('helvetica', 'normal');
      response.additionalTips.forEach((tip) => {
        pdf.text(`• ${tip}`, margin + 10, y);
        y += lineHeight;
      });
    }
    pdf.save('learning-plan.pdf');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="bg-white/80 dark:bg-gray-900/80 shadow-lg rounded-b-2xl px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧑‍🎓</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300">
            {language === 'ar' ? 'مخطط التعلم' : 'Learning Planner'}
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`transition p-2 rounded-full border-2 ${theme === 'dark' ? 'bg-gray-800 border-blue-400 text-yellow-300' : 'bg-gray-200 border-blue-600 text-blue-600'} hover:scale-110`}
            title={theme === 'dark' ? (language === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (language === 'ar' ? 'الوضع الداكن' : 'Dark mode')}
          >
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="transition p-2 rounded-full border-2 border-blue-400 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:scale-110"
            title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            {language === 'ar' ? 'EN' : 'ع'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-4">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-4">
            <textarea
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                setError(null);
              }}
              placeholder={language === 'ar' ? 'أدخل هدفك التعليمي هنا...' : 'Enter your learning goal here...'}
              className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-lg resize-none focus:ring-2 focus:ring-blue-400 transition"
              rows={4}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-2 px-6 rounded-xl shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading
                ? language === 'ar'
                  ? 'جاري التحميل...'
                  : 'Loading...'
                : language === 'ar'
                ? 'إنشاء خطة'
                : 'Generate Plan'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:text-red-200 dark:border-red-700 px-6 py-4 rounded-xl shadow flex items-center gap-3 animate-pulse">
              <span className="text-2xl">❌</span>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleDownloadPDF}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition"
              >
                {language === 'ar' ? 'تحميل كملف PDF' : 'Download as PDF'}
              </button>
            </div>
            <div ref={planRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 transition-colors duration-300">
              {response.isLearningRelated ? (
                <div className="space-y-8">
                  {/* Subject & Overview */}
                  <div>
                    <h2 className="text-3xl font-extrabold mb-2 text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <span>📘</span> {response.subject}
                    </h2>
                    <p className="text-lg mb-4 text-gray-700 dark:text-gray-200">{response.overview}</p>
                    {response.duration && (
                      <div className="flex flex-wrap gap-4 mb-6">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full font-semibold">
                          {response.duration.estimatedWeeks} {language === 'ar' ? 'أسبوع' : 'weeks'}
                        </span>
                        <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-3 py-1 rounded-full font-semibold">
                          {response.duration.hoursPerWeek} {language === 'ar' ? 'ساعة/أسبوع' : 'hours/week'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Topics */}
                  {response.topics && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <span>🗂️</span> {language === 'ar' ? 'المواضيع' : 'Topics'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {response.topics.map((topic, index) => (
                          <div key={index} className="bg-blue-50 dark:bg-blue-900/40 p-5 rounded-xl shadow flex flex-col gap-2 border-l-4 border-blue-400 dark:border-blue-600">
                            <h4 className="font-bold text-lg flex items-center gap-2">{topic.name}</h4>
                            <p className="text-gray-700 dark:text-gray-200 text-sm">{topic.description}</p>
                            <span className="inline-block bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-semibold w-fit">{language === 'ar' ? 'الوقت المقدر:' : 'Estimated time:'} {topic.estimatedTimeToMaster}</span>
                            {topic.resources && topic.resources.length > 0 && (
                              <div className="mt-2">
                                <h5 className="font-semibold mb-1 text-blue-600 dark:text-blue-300">{language === 'ar' ? 'المصادر' : 'Resources'}:</h5>
                                <ul className="list-none space-y-1">
                                  {topic.resources.map((res, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                      <span>{resourceIcon(res.type)}</span>
                                      <a href={res.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline font-medium">{res.name}</a>
                                      <span className="text-gray-500 text-xs">{res.description}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weekly Schedule Timeline */}
                  {response.weeklySchedule && (
                    <div className="mt-8">
                      <h3 className="text-2xl font-bold mb-4 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <span>📅</span> {language === 'ar' ? 'الجدول الأسبوعي' : 'Weekly Schedule'}
                      </h3>
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-300 via-blue-400 to-blue-600 dark:from-blue-700 dark:via-blue-800 dark:to-blue-900 rounded-full"></div>
                        <div className="space-y-10 pl-16">
                          {response.weeklySchedule.map((week, idx) => (
                            <div key={idx} className="relative group">
                              <div className="absolute -left-8 top-2 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg border-4 border-white dark:border-gray-800 text-xl group-hover:scale-110 transition">
                                {week.week}
                              </div>
                              <div className="bg-blue-50 dark:bg-blue-900/40 p-6 rounded-xl shadow border-l-4 border-blue-400 dark:border-blue-600">
                                <h4 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                                  <span>🗓️</span> {week.focus}
                                </h4>
                                <div className="mb-2 flex flex-wrap gap-2">
                                  {week.goals.map((goal, i) => (
                                    <span key={i} className="bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-200 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                                      ✅ {goal}
                                    </span>
                                  ))}
                                </div>
                                <div className="mb-2">
                                  <span className="font-semibold text-blue-600 dark:text-blue-300">{language === 'ar' ? 'جدول الأيام:' : 'Daily Breakdown:'}</span>
                                  <ul className="list-none pl-0 text-sm mt-1">
                                    {Object.entries(week.dailyBreakdown).map(([day, tasks], i) => (
                                      <li key={i} className="capitalize mb-1">
                                        <span className="font-medium text-blue-500 dark:text-blue-200">📆 {day}:</span>
                                        <ul className="list-disc pl-5">
                                          {tasks.map((task, j) => <li key={j}>{task}</li>)}
                                        </ul>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {week.milestones.map((ms, i) => (
                                    <span key={i} className="bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                                      🏆 {ms}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assessment Methods */}
                  {response.assessmentMethods && response.assessmentMethods.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <span>📝</span> {language === 'ar' ? 'طرق التقييم' : 'Assessment Methods'}
                      </h3>
                      <ul className="list-disc pl-5 text-lg">
                        {response.assessmentMethods.map((method, i) => <li key={i}>{method}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Additional Tips */}
                  {response.additionalTips && response.additionalTips.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-2xl font-bold mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <span>💡</span> {language === 'ar' ? 'نصائح إضافية' : 'Additional Tips'}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {response.additionalTips.map((tip, i) => <span key={i} className="bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 px-3 py-1 rounded-full text-sm font-semibold">{tip}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xl mb-4">{response.message}</p>
                  <p className="text-gray-600 dark:text-gray-300">{response.suggestion}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App; 