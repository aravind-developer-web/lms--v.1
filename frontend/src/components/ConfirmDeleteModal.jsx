import React from 'react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-scale-up border border-gray-100">
                <div className="flex flex-col items-center text-center gap-6">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900">{title || "Confirm Removal"}</h3>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                            {message || "Are you sure you want to remove this video? Progress data will be preserved but it will be hidden from learners."}
                        </p>
                    </div>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-100 hover:bg-gray-100 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
