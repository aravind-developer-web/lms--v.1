import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const QuizPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await api.get(`/quiz/${id}/`);
                setQuiz(response.data);
            } catch (error) {
                console.error("Failed to load quiz", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    const handleOptionSelect = (questionId, answerId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answerId
        }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < quiz.questions.length) {
            alert("Please answer all questions before submitting.");
            return;
        }

        try {
            setSubmitting(true);
            const response = await api.post(`/quiz/${id}/submit/`, { answers });
            setResult(response.data);

            // Push Progress Update
            if (response.data) {
                await api.post('/learner-progress/quiz/', {
                    module_id: id,
                    score_percent: response.data.score,
                    passed: response.data.passed
                }).catch(err => console.error("Progress push failed", err));
            }
        } catch (error) {
            console.error("Failed to submit quiz", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading quiz content...</div>;
    if (!quiz) return <div className="p-8 text-center text-red-500">Quiz not found.</div>;

    if (result) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="bg-white border border-slate-200 rounded-lg p-10 text-center shadow-lg">
                    <div className={`text-4xl font-bold mb-4 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {result.passed ? "Quiz Completed!" : "Quiz Failed"}
                    </div>
                    <p className="text-xl text-slate-600 mb-8">
                        Your score: <span className="font-bold">{Math.round(result.score)}%</span>
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={() => navigate(`/modules/${id}`)} className="px-6 py-2 border border-slate-300 rounded font-semibold hover:bg-slate-50">
                            Back to Module
                        </button>
                        {!result.passed && (
                            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700">
                                Try Again
                            </button>
                        )}
                        {result.passed && (
                            <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700">
                                Go to Dashboard
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-4 pb-32">
            <header className="mb-10">
                <button onClick={() => navigate(`/modules/${id}`)} className="text-sm text-slate-500 hover:text-slate-900 mb-4">
                    &larr; Exit Quiz
                </button>
                <h1 className="text-3xl font-bold text-slate-900">{quiz.title}</h1>
                <p className="text-slate-600 mt-1 uppercase tracking-widest text-xs font-bold">Passing Score: {quiz.passing_score}%</p>
            </header>

            <div className="space-y-10">
                {quiz.questions.map((q, index) => (
                    <div key={q.id} className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex gap-4">
                            <span className="text-slate-300">Q{index + 1}.</span> {q.text}
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {q.answers.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => handleOptionSelect(q.id, option.id)}
                                    className={`flex items-center p-4 rounded border transition-all text-left ${answers[q.id] === option.id
                                        ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600'
                                        : 'bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border mr-4 flex items-center justify-center ${answers[q.id] === option.id ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                        }`}>
                                        {answers[q.id] === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <span className={`text-sm ${answers[q.id] === option.id ? 'text-blue-900 font-semibold' : 'text-slate-700'}`}>
                                        {option.text}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || Object.keys(answers).length < quiz.questions.length}
                    className="bg-blue-600 text-white px-10 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                    {submitting ? 'Submitting...' : 'Submit Answers'}
                </button>
            </div>
        </div>
    );
};

export default QuizPage;
