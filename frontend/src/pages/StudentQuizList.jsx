import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const StudentQuizList = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const response = await api.get('/quiz/');
                setQuizzes(response.data);
            } catch (error) {
                console.error("Failed to fetch quizzes", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading available quizzes...</div>;

    // Group quizzes by week
    const quizzesByWeek = quizzes.reduce((acc, quiz) => {
        const week = quiz.module_week || 'Other';
        if (!acc[week]) acc[week] = [];
        acc[week].push(quiz);
        return acc;
    }, {});

    const sortedWeeks = Object.keys(quizzesByWeek).sort((a, b) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return Number(a) - Number(b);
    });

    return (
        <div className="space-y-10 animate-fade-in font-sans">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-2xl">
                    <h1 className="heading-h1 mb-3">Assessment Hub</h1>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed">Validate your cross-functional expertise through standardized knowledge verification protocols. Achieve synchronization for module completion.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="px-4 py-2 bg-blue-50 border border-blue-100/50 rounded-2xl flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mr-2 pulse-glow" />
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Live Assessments</span>
                    </div>
                </div>
            </header>

            <div className="space-y-12">
                {quizzes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-100 rounded-[24px] flex items-center justify-center text-gray-300 mb-6 shadow-soft">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active protocols detected.</p>
                    </div>
                ) : (
                    sortedWeeks.map(week => (
                        <div key={week} className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-100 pb-2">
                                {week === 'Other' ? 'Additional Modules' : `Week ${week}`}
                            </h2>
                            <div className="grid gap-6">
                                {quizzesByWeek[week].map(q => (
                                    <div key={q.id} className="group bg-white border border-gray-100 p-8 rounded-[32px] shadow-soft hover:shadow-strong transition-all duration-500 flex flex-col md:flex-row justify-between items-center gap-6 active:scale-[0.99] hover:border-blue-100">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 012.828 0L20 4.586a2 2 0 010 2.828l-9.414 9.414-4 1 1-4 9.414-9.414z"></path></svg>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{q.module_title}</h3>
                                                <p className="text-sm text-gray-500">{q.title}</p>
                                                <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-1">
                                                    <span className="flex items-center"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{q.questions ? q.questions.length : 0} Queries</span>
                                                    <span className="flex items-center"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{q.passing_score}% Threshold</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link to={`/modules/${q.module}/quiz`} className="btn-primary flex items-center">
                                            Start Protocol <span className="ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StudentQuizList;
