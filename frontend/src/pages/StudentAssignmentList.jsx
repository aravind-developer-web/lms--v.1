import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const StudentAssignmentList = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const response = await api.get('/assignments/');
            setAssignments(response.data);
        } catch (err) {
            console.error("Failed to fetch assignments", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading your assignments...</div>;

    // Group assignments by week
    const assignmentsByWeek = assignments.reduce((acc, assignment) => {
        const week = assignment.module_week || 'Other';
        if (!acc[week]) acc[week] = [];
        acc[week].push(assignment);
        return acc;
    }, {});

    const sortedWeeks = Object.keys(assignmentsByWeek).sort((a, b) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return Number(a) - Number(b);
    });

    return (
        <div className="space-y-10 animate-fade-in font-sans">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-2xl">
                    <h1 className="heading-h1 mb-3">Task Operations</h1>
                    <p className="text-gray-500 font-medium text-sm leading-relaxed">Cross-module operational assignments requiring tactical synchronization. Maintain your synchronization levels for organizational compliance.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="px-4 py-2 bg-gray-900 text-white rounded-2xl flex items-center shadow-soft">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Active Backlog: {assignments.length}</span>
                    </div>
                </div>
            </header>

            <div className="space-y-12">
                {assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-100 rounded-[24px] flex items-center justify-center text-gray-300 mb-6 shadow-soft">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01"></path></svg>
                        </div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Operational backlog clear.</p>
                    </div>
                ) : (
                    sortedWeeks.map(week => (
                        <div key={week} className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-100 pb-2">
                                {week === 'Other' ? 'Additional Tasks' : `Week ${week}`}
                            </h2>
                            <div className="grid gap-6">
                                {assignmentsByWeek[week].map(a => (
                                    <div key={a.id || a.module} className="group bg-white border border-gray-100 p-8 rounded-[32px] shadow-soft hover:shadow-strong transition-all duration-500 flex flex-col md:flex-row justify-between items-center gap-8 active:scale-[0.99] hover:border-blue-100 overflow-hidden relative">
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${a.status === 'completed' ? 'bg-green-500' : 'bg-blue-600'}`} />
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-subtle ${a.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                                    }`}>
                                                    {a.status}
                                                </span>
                                                {a.due_date && (
                                                    <span className="flex items-center text-[10px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100">
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                        Deadline: {new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{a.module_title}</h3>
                                                <p className="text-xs text-gray-500 line-clamp-1 max-w-xl leading-relaxed">{a.module_description}</p>
                                            </div>
                                        </div>
                                        <Link to={`/modules/${a.module}/assignment`} className={`btn-premium px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-soft transition-all duration-300 active:scale-95 focus:ring-4 focus:ring-blue-500/20 focus:outline-none ${a.status === 'completed'
                                            ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                            : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-200'
                                            }`}>
                                            {a.status === 'completed' ? 'View Work' : 'Initialize Submission'}
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

export default StudentAssignmentList;
