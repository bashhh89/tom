'use client';

import React, { useState, useEffect } from 'react';

export default function DebugSessionPage() {
  // State for all the data we want to display
  const [userData, setUserData] = useState({
    industry: '',
    userName: '',
    companyName: '',
    email: '',
  });
  const [scoreData, setScoreData] = useState({
    userTier: '',
    finalScore: '',
    reportId: '',
  });
  type QuestionHistoryEntry = { question?: string; answer?: string; thinking?: string; phase?: string; };
  const [questionAnswerHistory, setQuestionAnswerHistory] = useState<QuestionHistoryEntry[]>([]);
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [parsedSections, setParsedSections] = useState<Record<string, string>>({});

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  // Handle manual input changes for score data
  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setScoreData(prev => ({ ...prev, [name]: value }));
  };

  // Handle manual input changes for Q&A history
  const handleQAChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestionAnswerHistory(JSON.parse(e.target.value));
  };

  // Handle manual input changes for report markdown
  const handleReportChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReportMarkdown(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="bg-slate-800 text-white p-4 rounded-lg mb-6">
        <h1 className="text-2xl font-bold">AI Efficiency Scorecard - Debug Session</h1>
        <p className="text-sm text-gray-300">INTERNAL TESTING - NOT FOR CLIENT USE</p>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-bold mb-4">User & Session Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium text-gray-700 mb-2">User Data</h3>
            <ul className="text-sm">
              <li>Industry: {userData.industry || 'N/A'}</li>
              <li>User Name: {userData.userName || 'N/A'}</li>
              <li>Company Name: {userData.companyName || 'N/A'}</li>
              <li>Email: {userData.email || 'N/A'}</li>
            </ul>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium text-gray-700 mb-2">Score Data</h3>
            <ul className="text-sm">
              <li>AI Tier: {scoreData.userTier || 'N/A'}</li>
              <li>Final Score: {scoreData.finalScore || 'N/A'}</li>
              <li>Report ID: {scoreData.reportId || 'N/A'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-bold mb-4">Question & Answer History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phase</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">Question</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">Answer</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500">AI Thinking</th>
              </tr>
            </thead>
            <tbody>
              {questionAnswerHistory.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{item.phase || 'N/A'}</td>
                  <td className="px-3 py-2 text-sm text-gray-500">
                    <div className="max-w-md whitespace-pre-wrap">{item.question || 'N/A'}</div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500">
                    <div className="max-w-md whitespace-pre-wrap">{item.answer || 'N/A'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-bold mb-4">Report Markdown</h2>
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
          {reportMarkdown}
        </pre>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200">
        <button
          onClick={copyAllToClipboard}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Copy All Debug Data to Clipboard
        </button>
      </div>
    </div>
  );
}
