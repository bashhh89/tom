'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ScorecardQuestionDisplay from '@/components/ScorecardQuestionDisplay';
import ScorecardResultsDisplay from '@/components/ScorecardResultsDisplay';
import LeadCaptureForm from '@/components/scorecard/LeadCaptureForm';
import NoSidebarLayout from '@/components/NoSidebarLayout';
import { Button } from '@/components/ui/Button';
import NewAssessmentLanding from '@/components/NewAssessmentLanding';
import { db } from '@/lib/firebase'; // Fixed path to firebase.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation'; // For navigating to results page with reportId
import ReportLoadingIndicator from '@/components/scorecard/ReportLoadingIndicator'; // Add import for loading indicator

// Temporary function until we implement proper utils
const isAutoCompleteEnabled = () => true;

// Professional Header Component
const AssessmentHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-sg-dark-teal/95 backdrop-blur-sm border-b border-sg-bright-green/20 shadow-lg sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <div className="w-36 sm:w-40 flex-shrink-0">
              <img 
                src="/footer-logo.svg" 
                alt="Social Garden Logo" 
                className="h-9 sm:h-10 w-auto"
              />
            </div>
          </div>
          
          {/* Desktop Navigation & CTA */}
          <div className="flex items-center space-x-3 sm:space-x-6 flex-shrink-0">
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <a href="https://socialgarden.com.au/" className="text-white/80 hover:text-sg-bright-green transition-all duration-200 font-medium font-plus-jakarta text-sm">
                Home
              </a>
              <div className="relative">
                <div className="text-sg-bright-green font-bold font-plus-jakarta text-sm">
                  Assessment
                </div>
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-sg-bright-green to-sg-light-blue rounded-full"></div>
              </div>
              <a href="https://socialgarden.com.au/contact/" className="text-white/80 hover:text-sg-bright-green transition-all duration-200 font-medium font-plus-jakarta text-sm">
                Contact
              </a>
            </div>
            
            {/* Enhanced Trust Badge - Hide on small mobile */}
            <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-sg-bright-green/10 to-sg-light-blue/10 px-3 py-2 rounded-full border border-sg-bright-green/30 shadow-sm">
              <svg className="w-4 h-4 text-sg-bright-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs sm:text-sm font-bold text-white font-plus-jakarta whitespace-nowrap">100% Free Assessment</span>
            </div>

            {/* Mobile menu button - Always visible on mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <div className="w-6 h-6 relative flex flex-col justify-center">
                <span className={`absolute block w-6 h-0.5 bg-white transform transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`}></span>
                <span className={`absolute block w-6 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`absolute block w-6 h-0.5 bg-white transform transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 pt-4 pb-6 space-y-3 bg-sg-dark-teal border-t border-sg-bright-green/20">
            {/* Mobile Trust Badge */}
            <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-sg-bright-green/10 to-sg-light-blue/10 px-4 py-3 rounded-lg border border-sg-bright-green/30 shadow-sm mb-4">
              <svg className="w-4 h-4 text-sg-bright-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold text-white font-plus-jakarta">100% Free Assessment</span>
            </div>
            
            {/* Navigation Links */}
            <a 
              href="https://socialgarden.com.au/" 
              className="block px-4 py-3 text-white/80 hover:text-sg-bright-green hover:bg-white/5 transition-colors font-medium font-plus-jakarta text-lg rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </a>
            <div className="block px-4 py-3 rounded-lg bg-sg-bright-green/10">
              <div className="text-sg-bright-green font-bold font-plus-jakarta text-lg">
                Assessment
              </div>
            </div>
            <a 
              href="https://socialgarden.com.au/contact/" 
              className="block px-4 py-3 text-white/80 hover:text-sg-bright-green hover:bg-white/5 transition-colors font-medium font-plus-jakarta text-lg rounded-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

// Professional Footer Component
const AssessmentFooter = () => {
  return (
    <footer className="bg-gradient-to-r from-sg-dark-teal to-[#135e69] text-white mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6">
          <div className="w-32 sm:w-36 flex-shrink-0">
            <img 
              src="/footer-logo.svg" 
              alt="Social Garden Logo" 
              className="h-8 sm:h-9 w-auto"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a href="https://socialgarden.com.au/" className="text-white hover:text-sg-bright-green transition-colors font-plus-jakarta text-sm sm:text-base">Home</a>
            <a href="/" className="text-white hover:text-sg-bright-green transition-colors font-plus-jakarta text-sm sm:text-base">AI Scorecard</a>
            <a href="https://socialgarden.com.au/contact/" className="text-white hover:text-sg-bright-green transition-colors font-plus-jakarta text-sm sm:text-base">Contact</a>
          </div>
        </div>

        {/* Address Section - Compact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300 border-t border-white/20 pt-6 mb-6">
          <div>
            <p className="text-white font-semibold mb-1 font-plus-jakarta">Melbourne</p>
            <p>1800 771 396</p>
            <p>Level 8, The Hive</p>
            <p>Abbotsford</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-1 font-plus-jakarta">Auckland</p>
            <p>268 Karangahape Rd</p>
            <p>Auckland CBD</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-1 font-plus-jakarta">Sydney</p>
            <p>Level 3, 100 Harris St</p>
            <p>Pyrmont, NSW</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-1 font-plus-jakarta">Brisbane</p>
            <p>310 Edward St</p>
            <p>Brisbane City, QLD</p>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="text-sm text-gray-400 border-t border-white/20 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="font-plus-jakarta">© 2024 Social Garden. All rights reserved.</p>
            <p className="font-plus-jakarta mt-2 sm:mt-0">Your trusted partner for AI-powered marketing solutions.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Define the ScorecardState interface
type AnswerSourceType = 'Groq Llama 3 8B' | 'Pollinations Fallback' | 'Groq API Failed' | 'Fallback Failed' | 'Manual';
interface ScorecardHistoryEntry {
  question: string;
  answer: any;
  phaseName?: string;
  answerType?: string;
  options?: string[] | null;
  reasoningText?: string | null;
  answerSource?: AnswerSourceType;
}
interface ScorecardState {
  currentPhaseName: string;
  currentQuestion: string | null;
  answerType: string | null;
  options: string[] | null;
  history: ScorecardHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  overall_status: string; // 'assessment-in-progress' | 'assessment-completed' | 'results-generated' etc.
  reportMarkdown: string | null;
  reasoningText: string | null; // Added for AI thinking display
  industry: string;
  currentQuestionNumber: number;
  maxQuestions: number;
  assessmentPhases: string[];
}

// Define the industry selection UI component with clean, horizontal design
const IndustrySelection = ({
  industries,
  selectedIndustry,
  handleIndustryChange,
  startAssessment,
  leadCaptured,
  scorecardState
}: {
  industries: string[],
  selectedIndustry: string,
  handleIndustryChange: (industry: string) => void,
  startAssessment: () => void,
  leadCaptured: boolean,
  scorecardState: ScorecardState
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sg-light-mint via-white to-sg-cream-1">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        
        {/* Simple Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-sg-dark-teal font-plus-jakarta mb-6">
            AI Efficiency Assessment
          </h1>
          <p className="text-xl text-sg-dark-teal/70 font-plus-jakarta max-w-2xl mx-auto">
            {scorecardState.isLoading ? 'Preparing your personalized assessment...' : 'Select your industry to begin'}
          </p>
        </div>
        
        {/* Loading Overlay */}
        {scorecardState.isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-sg-bright-green to-sg-dark-teal rounded-full mb-4">
                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-sg-dark-teal font-plus-jakarta mb-2">
                  Preparing Your Assessment
                </h3>
                <p className="text-sg-dark-teal/70 font-plus-jakarta">
                  We're generating personalized questions for the {selectedIndustry} industry...
                </p>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-sg-bright-green rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-sg-bright-green rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-sg-bright-green rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Industry Selection Grid - Horizontal Layout */}
        <div className={`bg-white rounded-2xl shadow-xl border border-sg-bright-green/10 p-8 sm:p-12 transition-opacity duration-300 ${scorecardState.isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          
          {/* Industry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {industries.map((industry) => {
              const isSelected = selectedIndustry === industry;
              
              return (
                <button
                  key={industry}
                  onClick={() => handleIndustryChange(industry)}
                  disabled={scorecardState.isLoading}
                  className={`
                    text-left px-6 py-5 rounded-xl border-2 transition-all duration-300 
                    focus:outline-none focus:ring-3 focus:ring-sg-dark-teal/20 group
                    ${scorecardState.isLoading ? 'cursor-not-allowed opacity-50' : ''}
                    ${isSelected 
                      ? 'border-sg-dark-teal bg-sg-dark-teal text-white shadow-lg scale-[1.02]' 
                      : 'border-gray-200 bg-white hover:border-sg-dark-teal/50 hover:bg-sg-dark-teal/10 hover:scale-[1.01] shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center flex-shrink-0
                      ${isSelected 
                        ? 'border-white bg-white shadow-md' 
                        : 'border-gray-300 group-hover:border-sg-dark-teal/60'
                      }
                    `}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-sg-dark-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`
                      font-plus-jakarta text-lg transition-all duration-300
                      ${isSelected ? 'text-white font-bold' : 'text-sg-dark-teal/90 group-hover:text-sg-dark-teal'}
                    `}>
                      {industry}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Button
              id="begin-assessment-button"
              onClick={startAssessment}
              disabled={!selectedIndustry || scorecardState.isLoading}
              variant="default"
              size="lg"
              className={`
                px-12 py-6 rounded-xl font-bold font-plus-jakarta text-xl shadow-xl 
                transition-all duration-300 transform
                ${selectedIndustry && !scorecardState.isLoading
                  ? 'bg-sg-dark-teal hover:bg-sg-dark-teal/90 hover:scale-[1.02] hover:shadow-2xl text-white' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center justify-center gap-3">
                {scorecardState.isLoading ? (
                  <>
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Starting Assessment...</span>
                  </>
                ) : (
                  <>
                    <span>Begin Assessment</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </div>
            </Button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

// Create an enhanced Question Card component
interface AssessmentQuestionProps {
  scorecardState: ScorecardState;
  memoizedOptions: string[] | null;
  memoizedReasoningText: string | null;
  handleAnswerSubmit: (answer: any, answerSource?: AnswerSourceType) => void;
  isAutoCompleting: boolean;
  memoizedSetIsAutoCompleting: (val: boolean) => void;
  memoizedSetAutoCompleteError: (msg: string | null) => void; // Corrected prop name
  handleStartAutoComplete: () => void;
  autoCompleteCount: number;
  memoizedHistory: ScorecardHistoryEntry[];
  selectedIndustry: string;
  autoCompleteError: string | null; // Add autoCompleteError to props
}

const AssessmentQuestion: React.FC<AssessmentQuestionProps> = ({
  scorecardState,
  memoizedOptions,
  memoizedReasoningText,
  handleAnswerSubmit,
  isAutoCompleting,
  memoizedSetIsAutoCompleting,
  memoizedSetAutoCompleteError,
  handleStartAutoComplete,
  autoCompleteCount,
  memoizedHistory,
  selectedIndustry,
  autoCompleteError, // Destructure autoCompleteError from props
}) => {
  // Add notification when approaching lead form threshold
  const LEAD_FORM_THRESHOLD = 20; // Show lead form after 20 questions (with 0 remaining)
  const isApproachingLeadForm = scorecardState.currentQuestionNumber >= LEAD_FORM_THRESHOLD - 2 &&
                                scorecardState.currentQuestionNumber < LEAD_FORM_THRESHOLD && 
                                !isAutoCompleting;

  return (
    <div className="px-2 sm:px-4 lg:px-8">
      {/* Notification about upcoming lead form - Mobile optimized */}
      {isApproachingLeadForm && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-sg-light-mint border-l-4 border-sg-bright-green rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-sg-bright-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm text-sg-dark-teal font-medium font-plus-jakarta">
                You're almost done with the assessment!
              </p>
              <p className="text-xs sm:text-sm text-sg-dark-teal/80 mt-1 font-plus-jakarta">
                After a few more questions, we'll ask for your details to complete your personalized AI efficiency report.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-complete error message - Mobile optimized */}
      {autoCompleteError && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-medium font-plus-jakarta text-sm">Auto-Complete Error</p>
          <p className="font-plus-jakarta text-sm">{autoCompleteError}</p>
        </div>
      )}

      {/* Assessment Question */}
      {scorecardState.currentQuestion ? (
        <ScorecardQuestionDisplay
          question={scorecardState.currentQuestion}
          answerType={scorecardState.answerType || 'text'}
          options={memoizedOptions}
          onSubmitAnswer={handleAnswerSubmit}
          isLoading={scorecardState.isLoading}
          currentPhaseName={scorecardState.currentPhaseName}
          currentQuestionNumber={scorecardState.currentQuestionNumber}
          maxQuestions={scorecardState.maxQuestions}
          assessmentPhases={scorecardState.assessmentPhases}
          reasoningText={memoizedReasoningText || undefined}
          isAutoCompleting={isAutoCompleting}
          setIsAutoCompleting={memoizedSetIsAutoCompleting}
          setAutoCompleteError={memoizedSetAutoCompleteError}
          handleStartAutoComplete={handleStartAutoComplete}
          overallStatus={scorecardState.overall_status}
          questionAnswerHistory={memoizedHistory}
          industry={selectedIndustry}
        />
      ) : (
        <div className="text-center p-6 sm:p-12 border border-gray-200 rounded-lg mb-6 sm:mb-8">
          <p className="text-base sm:text-lg text-gray-600 font-plus-jakarta">Loading your assessment questions...</p>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  // Router for navigation
  const router = useRouter();

  // --- TEMPORARY FOR TESTING RESULTS PAGE ---
  // Initialize currentStep based on URL to prevent state resets on results page
  const [currentStep, setCurrentStep] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/scorecard/results')) {
      console.log('MAIN PAGE: Initializing currentStep to "results" based on URL');
      return 'results';
    }
    console.log('MAIN PAGE: Initializing currentStep to "industrySelection"');
    return 'industrySelection'; // Default start at industry selection
  });
  // --- END TEMPORARY CHANGES ---

  // Define state for selected industry
  const [selectedIndustry, setSelectedIndustry] = useState<string>("Property/Real Estate");

  // Define the initial state for the scorecard
  const initialScorecardState: ScorecardState = {
    currentPhaseName: "Strategy", // Default to first phase
    currentQuestion: null,
    answerType: null,
    options: null,
    history: [],
    isLoading: false,
    error: null,
    reportMarkdown: null, // No pre-populated report
    overall_status: 'assessment-in-progress', // Start in progress
    reasoningText: null, // Initialize as null
    industry: "Property/Real Estate",
    currentQuestionNumber: 1,
    maxQuestions: 20,
    assessmentPhases: ["Strategy", "Data", "Tech", "Team/Process", "Governance"],
  };

  // Define state for scorecard
  const [scorecardState, setScorecardState] = useState<ScorecardState>(initialScorecardState);

  // Define state for lead capture
  const [leadCaptured, setLeadCaptured] = useState<boolean>(false);
  // Add state for storing lead name for personalization
  const [leadName, setLeadName] = useState<string>('');

  // Define the list of industries
  const industries = [
    "Property/Real Estate", "Higher Education", "B2B Tech/SaaS",
    "Financial Services", "Automotive", "E-commerce", "B2B",
    "Not for Profit", "Aged Care", "Retired Living", "Other"
  ];

  // Define constants
  const MAX_QUESTIONS = 20; // Match the value in the API route
  const ASSESSMENT_PHASES = ["Strategy", "Data", "Tech", "Team/Process", "Governance"]; // Match API phases
  // Define when to show the lead form - after completing this many questions
  const LEAD_FORM_THRESHOLD = 20; // Show lead form after 20 questions (with 0 remaining)

  // Define isAutoCompleting state
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  // Add autoCompleteError state
  const [autoCompleteError, setAutoCompleteError] = useState<string | null>(null);

  // Memoize reasoningText to prevent unnecessary re-renders of ScorecardQuestionDisplay
  const memoizedReasoningText = useMemo(() => scorecardState.reasoningText, [scorecardState.reasoningText]);

  // Memoize options array
  const memoizedOptions = useMemo(
    () => scorecardState.options ? [...scorecardState.options] : [],
    [scorecardState.options]
  );

  // Memoize history array
  const memoizedHistory = useMemo(
    () => scorecardState.history ? [...scorecardState.history] : [],
    [scorecardState.history]
  );

  // Memoize question object (if you want to pass as a single object)
  const memoizedQuestion = useMemo(
    () => scorecardState.currentQuestion
      ? {
          questionText: scorecardState.currentQuestion,
          answerType: scorecardState.answerType,
          options: scorecardState.options,
        }
      : null,
    [scorecardState.currentQuestion, scorecardState.answerType, scorecardState.options]
  );

  // Memoize setIsAutoCompleting
  const memoizedSetIsAutoCompleting = useCallback(setIsAutoCompleting, []);
  // Memoize setAutoCompleteError
  const memoizedSetAutoCompleteError = useCallback(setAutoCompleteError, []);

  // Add new state for final report generation loading indicator
  const [isGeneratingFinalReport, setIsGeneratingFinalReport] = useState(false);
  const [autoCompleteCount, setAutoCompleteCount] = useState(0);

  // In the Home function, add this variable to track feature availability
  const autoCompleteFeatureEnabled = isAutoCompleteEnabled();

  // Moved function definitions earlier to avoid linter errors
  const startActualAssessment = useCallback(async () => {
    // Prevent multiple clicks by checking if already loading
    if (scorecardState.isLoading) {
      console.log('Frontend: Already loading, ignoring duplicate click');
      return;
    }

    console.log('Frontend: Starting assessment with industry:', selectedIndustry);

    // Add a timestamp for debugging
    const startTime = new Date().getTime();

    // Set loading state FIRST to prevent multiple clicks
    setScorecardState(prev => ({
      ...initialScorecardState,
      industry: selectedIndustry,
      isLoading: true,
      error: null,
      currentQuestion: null // Keep null until we have the actual question
    }));

    // Force UI update to reflect loading state immediately before making the API call
    // This will guarantee the loading state is visibly set before API call begins
    await new Promise(resolve => setTimeout(resolve, 10));

    // DON'T change step yet - keep showing the loading overlay until question is ready

    // Immediately disable auto-complete and clear errors
    setIsAutoCompleting(false);
    setAutoCompleteError(null);

    // Add references to track UI button state
    const button = document.getElementById('begin-assessment-button');
    if (button) {
      button.setAttribute('disabled', 'true');
      button.classList.add('opacity-50', 'cursor-not-allowed');
    }

    try {
      console.log('Frontend: Initiating API call for first question at', new Date().toISOString());
      const response = await fetch('/api/scorecard-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          currentPhaseName: initialScorecardState.currentPhaseName,
          history: initialScorecardState.history,
          industry: selectedIndustry,
          // Add timestamp to prevent caching
          timestamp: startTime
        }),
        // Add cache: 'no-store' to prevent caching issues
        cache: 'no-store',
      });
      console.log('Frontend: Initial API call sent for industry:', selectedIndustry);
      console.log('Frontend: API response received in', new Date().getTime() - startTime, 'ms');

      // Check response content type before trying to parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse.substring(0, 200));
        setScorecardState(prev => ({
          ...prev,
          isLoading: false,
          error: `Server returned non-JSON response: ${contentType || 'unknown'}`
        }));
        return;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        const detailedErrorMessage = `Failed to start assessment. Status: ${response.status}. Body: ${errorBody}`;
        console.error('API error:', detailedErrorMessage);
        setScorecardState(prev => ({ ...prev, isLoading: false, error: detailedErrorMessage }));
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError: any) {
        console.error('JSON parse error:', jsonError);
        setScorecardState(prev => ({
          ...prev,
          isLoading: false,
          error: `Failed to parse server response as JSON. Error: ${jsonError.message}`
        }));
        return;
      }

      console.log('Frontend: Received first question data, updating state:', data);
      
      // Only update state and change step when we have a valid question
      if (data.questionText && data.questionText.trim() !== '') {
        setScorecardState(prev => ({
          ...prev,
          isLoading: false,
          currentQuestion: data.questionText,
          answerType: data.answerType,
          options: data.options,
          currentPhaseName: data.currentPhaseName,
          overall_status: data.overall_status,
          reasoningText: data.reasoning_text,
          currentQuestionNumber: 1
        }));
        
        // NOW change the step to assessment since we have a valid question
        setCurrentStep('assessment');
      } else {
        // If no valid question, show error
        setScorecardState(prev => ({
          ...prev,
          isLoading: false,
          error: 'No question received from the server. Please try again.'
        }));
      }
    } catch (error: any) {
      console.error('Frontend: Error in startActualAssessment:', error);
      setScorecardState(prev => ({
        ...prev,
        isLoading: false,
        error: `An unexpected error occurred in startAssessment: ${error.message || 'Unknown error'}`
      }));

      // Re-enable the button in case of error
      if (button) {
        button.removeAttribute('disabled');
        button.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }
  }, [
    selectedIndustry,
    initialScorecardState,
    setIsAutoCompleting,
    setAutoCompleteError,
    setCurrentStep,
    scorecardState.isLoading
  ]);

  // --- Stabilize generateReport (Dependency: selectedIndustry) ---
  const generateReport = useCallback(async (finalHistory: ScorecardHistoryEntry[], capturedName?: string) => {
    console.log(`FRONTEND: generateReport started at: ${new Date().toISOString()}`);
    const startTime = Date.now(); // For overall duration

    console.log('>>> FRONTEND: Generating report for industry:', selectedIndustry);
    console.log('>>> FRONTEND: History length:', finalHistory.length);

    // Set loading state
    setIsGeneratingFinalReport(true);

    // Safety timeout to prevent infinite loading - SET TO 90 SECONDS for better UX
    const safetyTimeout = setTimeout(() => {
      console.error(`FRONTEND: Report generation timed out at: ${new Date().toISOString()}. Started at: ${new Date(startTime).toISOString()}`);
      setIsGeneratingFinalReport(false);
      // Show a user-friendly error message when this happens
      alert('We apologize, but generating your report is taking longer than expected. Our AI is working hard - please try again in a moment.');
    }, 90000); // 90 second timeout for better balance between success and user experience

    try {
      // Generate report data
      console.log(`FRONTEND: Calling /api/scorecard-ai for full report at: ${new Date().toISOString()}`);
      const apiCallStartTime = Date.now();

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('FRONTEND: Report generation timed out after 80 seconds, aborting...');
      }, 80000); // 80 second timeout (backend has 90 second timeout, frontend waits a bit less)

      const response = await fetch('/api/scorecard-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateReport',
          history: finalHistory.slice(0, MAX_QUESTIONS),
          industry: selectedIndustry,
          userName: capturedName
        }),
        signal: controller.signal, // Add abort signal
      });

      clearTimeout(timeoutId); // Clear the timeout if request succeeded

      console.log(`FRONTEND: Received response from /api/scorecard-ai at: ${new Date().toISOString()}. Duration: ${(Date.now() - apiCallStartTime) / 1000}s`);

      if (!response.ok) {
        throw new Error(`Failed to generate report. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`FRONTEND: Parsed response JSON at: ${new Date().toISOString()}`);
      console.log(`FRONTEND: Response has reportMarkdown: ${!!data.reportMarkdown}, length: ${data.reportMarkdown?.length || 0}`);

      // CRITICAL DEBUG - Log the entire report content
      console.log('>>> FRONTEND: Report data received from API:');
      console.log('userAITier:', data.userAITier);
      console.log('reportMarkdown length:', data.reportMarkdown?.length);
      console.log('reportMarkdown snippet:', data.reportMarkdown?.substring(0, 200) + '...');

      // Check if the reportMarkdown is empty or missing
      if (!data.reportMarkdown || data.reportMarkdown.trim() === '') {
        console.error('>>> FRONTEND: CRITICAL ERROR - Empty reportMarkdown received from API');
        throw new Error('Empty report content received from API');
      }

      // Verify tier is present
      if (!data.userAITier || data.userAITier === 'Unknown') {
        console.warn('>>> FRONTEND: WARNING - User tier is missing or Unknown in API response');
        // Extract tier from markdown if possible
        const tierMatch = data.reportMarkdown.match(/## Overall Tier:?\s*(.+?)($|\n)/i);
        if (tierMatch && tierMatch[1]) {
          data.userAITier = tierMatch[1].trim();
          console.log('>>> FRONTEND: Extracted tier from markdown:', data.userAITier);
        }
      }

      // Prepare report data for Firestore
      const reportData = {
        leadName: capturedName || null,
        leadEmail: sessionStorage.getItem('scorecardLeadEmail') || null,
        leadCompany: sessionStorage.getItem('scorecardLeadCompany') || null,
        leadPhone: sessionStorage.getItem('scorecardLeadPhone') || null,
        industry: selectedIndustry || null,
        userAITier: data.userAITier || 'Unknown',
        aiTier: data.userAITier || 'Unknown',
        tier: data.userAITier || 'Unknown', // Add explicit tier field
        reportMarkdown: data.reportMarkdown || null,
        questionAnswerHistory: finalHistory.slice(0, MAX_QUESTIONS) || [],
        systemPromptUsed: data.systemPromptUsed || 'Unknown',
        createdAt: serverTimestamp(),
        overallStatus: 'completed'
      };

      // Filter out any undefined values to prevent Firestore errors
      // IMPORTANT: Don't filter out serverTimestamp() objects - they're special Firestore objects
      const cleanReportDataRecursively = (obj: any): any => {
        if (obj === null || obj === undefined) return null;
        
        // Handle serverTimestamp objects specially
        if (obj && typeof obj === 'object' && obj._methodName === 'serverTimestamp') {
          return obj;
        }
        
        // Handle arrays
        if (Array.isArray(obj)) {
          return obj.filter(item => item !== undefined).map(item => cleanReportDataRecursively(item));
        }
        
        // Handle regular objects
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
              const cleanedValue = cleanReportDataRecursively(value);
              if (cleanedValue !== undefined) {
                cleaned[key] = cleanedValue;
              }
            } else {
              console.error(`>>> FRONTEND: Found undefined value for key: ${key}`);
            }
          }
          return cleaned;
        }
        
        return obj;
      };

      const cleanedReportData = cleanReportDataRecursively(reportData);

      // Log the full reportData object before saving to Firestore
      console.log('>>> FRONTEND: FULL REPORT DATA OBJECT BEING SAVED TO FIRESTORE:');
      console.log('reportData:', JSON.stringify({
        ...cleanedReportData,
        reportMarkdown: cleanedReportData.reportMarkdown?.substring(0, 100) + '... [truncated]',
        questionAnswerHistory: `[${cleanedReportData.questionAnswerHistory?.length || 0} entries]`,
        systemPromptUsed: cleanedReportData.systemPromptUsed?.substring(0, 100) + '... [truncated]',
        createdAt: cleanedReportData.createdAt ? 'serverTimestamp object' : 'missing'
      }, null, 2));

      // Additional logging to check for any remaining undefined values
      console.log('>>> FRONTEND: Checking for undefined values in cleanedReportData:');
      const checkForUndefined = (obj: any, path = ''): void => {
        if (obj === undefined) {
          console.error(`Found undefined value at path: ${path}`);
          return;
        }
        if (obj && typeof obj === 'object' && !Array.isArray(obj) && obj._methodName !== 'serverTimestamp') {
          Object.entries(obj).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;
            checkForUndefined(value, currentPath);
          });
        } else if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            const currentPath = `${path}[${index}]`;
            checkForUndefined(item, currentPath);
          });
        }
      };
      
      checkForUndefined(cleanedReportData);
      console.log('>>> FRONTEND: Undefined check completed');

      // Save to Firestore
      try {
        console.log(`FRONTEND: Calling saveScorecardReport at: ${new Date().toISOString()}`);
        const firestoreSaveStartTime = Date.now();

        const docRef = await addDoc(collection(db, "scorecardReports"), cleanedReportData);
        const reportID = docRef.id;

        console.log(`FRONTEND: saveScorecardReport completed at: ${new Date().toISOString()}. Duration: ${(Date.now() - firestoreSaveStartTime) / 1000}s`);
        console.log(">>> FRONTEND: Report saved to Firestore with ID: ", reportID);

        // CRITICAL FIX: Ensure storage operations complete before navigation
        console.log('>>> FRONTEND: Starting storage operations...');

        try {
          // Use Promise.all to ensure ALL storage operations complete synchronously
          console.log('Generating report:', { finalHistory: finalHistory.length, selectedIndustry, leadName });

          await Promise.all([
            sessionStorage.setItem('reportMarkdown', data.reportMarkdown),
            sessionStorage.setItem('questionAnswerHistory', JSON.stringify(finalHistory.slice(0, MAX_QUESTIONS))),
            sessionStorage.setItem('systemPromptUsed', data.systemPromptUsed || ''),
            sessionStorage.setItem('reportId', reportID),
            sessionStorage.setItem('currentReportID', reportID),
            sessionStorage.setItem('userAITier', data.userAITier || 'Unknown'),
            sessionStorage.setItem('aiTier', data.userAITier || 'Unknown'),
            sessionStorage.setItem('tier', data.userAITier || 'Unknown'),
            sessionStorage.setItem('userTier', data.userAITier || 'Unknown'),
            sessionStorage.setItem('finalScore', data.finalScore || ''),
            sessionStorage.setItem('industry', selectedIndustry || '')
          ]);

          console.log('API response data received:', {
            hasMarkdown: !!data.reportMarkdown,
            tier: data.userAITier,
            finalScore: data.finalScore
          });

          // Create and store consolidated userData object for debug session
          const userData = {
            leadName: capturedName || '',
            name: capturedName || '',
            companyName: sessionStorage.getItem('scorecardLeadCompany') || '',
            email: sessionStorage.getItem('scorecardLeadEmail') || '',
            phone: sessionStorage.getItem('scorecardLeadPhone') || '',
            industry: selectedIndustry || '',
            tier: data.userAITier || 'Unknown',
          };

          // Also store in localStorage as backup
          await Promise.all([
            sessionStorage.setItem('userData', JSON.stringify(userData)),
            localStorage.setItem('reportMarkdown', data.reportMarkdown),
            localStorage.setItem('questionAnswerHistory', JSON.stringify(finalHistory.slice(0, MAX_QUESTIONS))),
            localStorage.setItem('systemPromptUsed', data.systemPromptUsed || ''),
            localStorage.setItem('reportId', reportID),
            localStorage.setItem('currentReportID', reportID),
            localStorage.setItem('userAITier', data.userAITier || 'Unknown'),
            localStorage.setItem('aiTier', data.userAITier || 'Unknown'),
            localStorage.setItem('tier', data.userAITier || 'Unknown'),
            localStorage.setItem('userTier', data.userAITier || 'Unknown'),
            localStorage.setItem('finalScore', data.finalScore || ''),
            localStorage.setItem('industry', selectedIndustry || ''),
            localStorage.setItem('userData', JSON.stringify(userData))
          ]);

          console.log('>>> FRONTEND: Successfully saved all report data to storage.');
        } catch (storageError) {
          console.error('>>> FRONTEND: Error saving to storage:', storageError);
          throw new Error('Failed to save report data to storage');
        }

        // Clear the safety timeout since we're proceeding normally
        clearTimeout(safetyTimeout);

        // Final verification before navigation
        const storedReportId = sessionStorage.getItem('currentReportID') || sessionStorage.getItem('reportId');
        const storedReportMarkdown = sessionStorage.getItem('reportMarkdown');

        console.log(`>>> FRONTEND: Pre-navigation verification - reportId: ${storedReportId}, hasMarkdown: ${!!storedReportMarkdown}`);

        if (!storedReportId || !storedReportMarkdown) {
          throw new Error('Storage verification failed - missing critical data before navigation');
        }

        // IMMEDIATELY change state to hide lead capture form
        console.log(`>>> FRONTEND: Setting currentStep to 'completed' to hide lead capture form`);
        setCurrentStep('completed');
        
        // Hide the loading modal
        console.log(`>>> FRONTEND: Setting finalReport=false and preparing navigation - reportId: ${reportID}`);
        setIsGeneratingFinalReport(false);

        // CRITICAL FIX: Add a small delay to allow the UI to show 100% completion before navigation
        console.log(`>>> FRONTEND: Delaying navigation by 500ms to allow UI update - reportId: ${reportID}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Give React time to render the state change

        console.log(`>>> FRONTEND: Navigation executing after delay - reportId: ${reportID}`);

        // Navigation happens ONLY after storage is confirmed complete and UI has shown completion
        console.log('Navigating with reportId:', reportID);
        window.location.href = `/scorecard/results?reportId=${reportID}`;

        } catch (error) {
          console.error(`FRONTEND: Error saving to Firestore at: ${new Date().toISOString()}`, error);
          throw new Error('Failed to save report to Firestore');
        }

      } catch (error) {
        console.error(`FRONTEND: Error in generateReport at: ${new Date().toISOString()}`, error);

        // Check if this is a timeout error from AbortController
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('FRONTEND: Report generation timed out via AbortController');
          alert('We apologize, but report generation is taking too long. Please try again later.');
        } else {
          // Handle other types of errors with a generic message
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          alert(`We apologize, but an error occurred while generating your report. Please try again. Error: ${errorMessage}`);
        }

        setIsGeneratingFinalReport(false);
        clearTimeout(safetyTimeout);
      }
    
    // At the very end of generateReport (even if error or success)
    console.log(`FRONTEND: generateReport function ended at: ${new Date().toISOString()}. Total duration: ${(Date.now() - startTime) / 1000}s`);
  }, [selectedIndustry, leadName, MAX_QUESTIONS]);

  // Modified lead capture success handler
  const handleLeadCaptureSuccess = useCallback((capturedName: string) => {
    console.log("DEBUG: handleLeadCaptureSuccess called with name:", capturedName);

    // Set loading state for report generation first
    setIsGeneratingFinalReport(true);

    // Update lead capture state
    setLeadCaptured(true);
    setLeadName(capturedName);

    // Store the name in sessionStorage for use in results page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('scorecardUserName', capturedName);
      sessionStorage.setItem('scorecardLeadName', capturedName);
    }

    console.log("DEBUG: Lead capture state updated. About to call generateReport");
    console.log("DEBUG: currentHistory length:", scorecardState.history.length);
    console.log("DEBUG: selectedIndustry:", selectedIndustry);

    // Use the current history to generate the report
    const currentHistory = [...scorecardState.history];

    // Generate the report with exactly MAX_QUESTIONS answers or current answers if fewer
    const historyToUse = currentHistory.slice(0, MAX_QUESTIONS);
    console.log("DEBUG: historyToUse length:", historyToUse.length);

    generateReport(historyToUse, capturedName);

    // Don't set currentStep to 'results' here - let generateReport handle navigation to the dedicated results page
  }, [setLeadCaptured, setLeadName, scorecardState.history, MAX_QUESTIONS, setIsGeneratingFinalReport, generateReport, setCurrentStep, selectedIndustry]);

  const handlePostAssessmentLeadCaptureSuccess = useCallback(() => {
    console.log("Post-assessment lead capture successful. Moving to results.");
    // Don't set currentStep - let natural navigation to results page happen
  }, []);
  
  // Extract tier from report markdown if available
  const extractedTier = useMemo(() => {
    if (!scorecardState.reportMarkdown) return null;

    const tierMatch = scorecardState.reportMarkdown.match(/## Overall Tier:?\s*(.+?)($|\n)/i);
    if (tierMatch && tierMatch[1]) {
      return tierMatch[1].trim();
    }

    // Fallback to searching for Leader, Enabler, or Dabbler in the markdown   
    const tierKeywords = ["Leader", "Enabler", "Dabbler"];
    for (const keyword of tierKeywords) {
      if (scorecardState.reportMarkdown.includes(keyword)) {
        return keyword;
      }
    }

    return null;
  }, [scorecardState.reportMarkdown]);

  // NEW: Add a failsafe effect to navigate to results when a report is completed
  useEffect(() => {
    // If report is completed and we have the data, navigate to results page
    if (scorecardState.overall_status === 'completed' && scorecardState.reportMarkdown && currentStep === 'assessment') {
      console.log('>>> FRONTEND: BACKUP NAVIGATION - Report completed, navigating to results page');
      const reportId = sessionStorage.getItem('currentReportID') || sessionStorage.getItem('reportId');
      if (reportId) {
        window.location.href = `/scorecard/results?reportId=${reportId}`;
      }
    }
  }, [scorecardState.overall_status, scorecardState.reportMarkdown, currentStep]);

  // --- Stabilize handleAnswerSubmit using Functional Updates ---
  const handleAnswerSubmit = useCallback(async (answer: any, answerSource?: AnswerSourceType) => {
    let submittedQuestion = '';
    let currentPhase = '';
    let currentAnswerType: string | null = null;
    let currentOptions: string[] | null = null;
    let currentReasoning: string | null = null;

    // Capture current history length to check if we need to proceed after adding this answer
    let currentHistoryLength = 0;

    setScorecardState(prev => {
      if (!prev.currentQuestion) {
        console.error('Submit attempted with no current question (inside functional update)');
        return prev;
      }
      submittedQuestion = prev.currentQuestion;
      currentPhase = prev.currentPhaseName;
      currentAnswerType = prev.answerType ?? '';
      currentOptions = prev.options;
      currentReasoning = prev.reasoningText;
      currentHistoryLength = prev.history.length;

      const newHistory = [...prev.history, {
        question: submittedQuestion,
        answer: answer,
        phaseName: currentPhase,
        answerType: currentAnswerType,
        options: currentOptions,
        reasoningText: currentReasoning,
        answerSource: answerSource || 'Manual',
      }];
      return { ...prev, isLoading: true, error: null, history: newHistory };
    });

    try {
      const updatedHistory = (await new Promise<ScorecardState>(resolve => setScorecardState(prev => { resolve(prev); return prev; }))).history;

      // After adding this answer, check if we've reached MAX_QUESTIONS
      // currentHistoryLength + 1 should be the new length after adding one answer
      const newHistoryLength = currentHistoryLength + 1;
      console.log(`>>> FRONTEND: Question ${newHistoryLength}/${MAX_QUESTIONS} completed. Auto-completing: ${isAutoCompleting}`);

      // MODIFIED: Check if we need to show lead capture form
      // Show lead form exactly after 20 questions are answered
      if (!leadCaptured && newHistoryLength === LEAD_FORM_THRESHOLD) {
        console.log(`>>> FRONTEND: Reached lead form threshold (${LEAD_FORM_THRESHOLD}). Showing lead capture form.`);

        // Stop auto-complete if it's running
        if (isAutoCompleting) {
          console.log('[Parent] Pausing for lead capture, disabling auto-complete.');
          setIsAutoCompleting(false);
        }

        setScorecardState(prev => ({
          ...prev,
          isLoading: false,
          overall_status: 'lead-capture-required', // Add status to indicate lead capture is required
          currentQuestionNumber: MAX_QUESTIONS // Set to max questions to prevent showing more
        }));

        // Show lead capture form - this should happen BEFORE navigation to results
        setCurrentStep('leadCapture');
        return;
      }

      // IMPORTANT: Only show lead capture form at MAX_QUESTIONS, don't generate report here
      // The report will be generated after the lead form is submitted
      if (newHistoryLength >= MAX_QUESTIONS) {
        console.log(`>>> FRONTEND: Reached maximum questions (${MAX_QUESTIONS}). Showing lead capture form.`);

        // Show lead capture form for final step
        setCurrentStep('leadCapture');

        setScorecardState(prev => ({
          ...prev,
          isLoading: false,
          overall_status: 'lead-capture-required', // Ensure status indicates lead capture is required
          currentQuestionNumber: MAX_QUESTIONS
        }));

        console.log(`>>> FRONTEND: MAX_QUESTIONS REACHED: Lead capture will trigger final report generation`);
        return;
      }

      // Only fetch the next question if we haven't reached MAX_QUESTIONS
      try {
        const response = await fetch('/api/scorecard-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            currentPhaseName: currentPhase,
            history: updatedHistory,
            industry: selectedIndustry
          }),
        });

        // Check response content type before trying to parse JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error('Non-JSON response received:', textResponse.substring(0, 200));
          const errorMessage = `Server returned non-JSON response: ${contentType || 'unknown'}`;

          setScorecardState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage
          }));

          if (isAutoCompleting) {
            console.log('Stopping auto-complete due to content type error');
            setIsAutoCompleting(false);
            setAutoCompleteError(`Auto-complete failed: ${errorMessage}`);
          }
          return;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          console.error('>>> FRONTEND: Raw API Error Response Body:', errorBody);
          const detailedErrorMessage = `Failed to submit answer. Status: ${response.status}. Body: ${errorBody}`;
          console.error(detailedErrorMessage);
          setScorecardState(prev => ({
            ...prev,
            isLoading: false,
            error: detailedErrorMessage + ". Please try restarting the assessment."
          }));
          if (isAutoCompleting) {
            console.log('Stopping auto-complete due to API error');
            setIsAutoCompleting(false);
            setAutoCompleteError(`Auto-complete failed: ${detailedErrorMessage}`);
          }
          return;
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError: any) {
          console.error('JSON parse error:', jsonError);
          const errorMessage = `Failed to parse server response as JSON. Error: ${jsonError.message}`;

          setScorecardState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage
          }));

          if (isAutoCompleting) {
            console.log('Stopping auto-complete due to JSON parse error');
            setIsAutoCompleting(false);
            setAutoCompleteError(`Auto-complete failed: ${errorMessage}`);
          }
          return;
        }

        if (data.overall_status) {
          console.log('API response overall_status:', data.overall_status);

          // Check if we should generate the report based on API response or if MAX_QUESTIONS is reached during auto-complete
          if (
            (data.overall_status === 'assessment-completed' ||
            data.overall_status === 'completed' ||
            data.overall_status.includes('complet')) ||
            (isAutoCompleting && updatedHistory.length >= MAX_QUESTIONS) // Explicitly check history length for auto-complete
          ) {
            if (isAutoCompleting) {
              console.log('[Parent] Assessment completed detected or MAX_QUESTIONS reached, disabling auto-complete.');
              setIsAutoCompleting(false);
            }
            setScorecardState(prev => ({
              ...prev,
              isLoading: false,
              overall_status: data.overall_status // Use API status or force 'completed' if MAX_QUESTIONS reached? Let's stick to API status for now.
            }));

            // Ensure we use exactly MAX_QUESTIONS answers for the report
            generateReport(updatedHistory.slice(0, MAX_QUESTIONS));
          }
          // Otherwise, update state with the next question
          else {
            if (!data.questionText) {
              throw new Error("API returned success but no question was provided");
            }

            // Normalize the answer type to ensure consistency
            const normalizedAnswerType = normalizeAnswerType(data.answerType);
            
            setScorecardState(prev => ({
              ...prev,
              isLoading: false,
              currentQuestion: data.questionText,
              answerType: normalizedAnswerType, // Use normalized answer type
              options: data.options,
              currentPhaseName: data.currentPhaseName,
              overall_status: data.overall_status,
              reasoningText: data.reasoning_text,
              currentQuestionNumber: Math.min(updatedHistory.length + 1, MAX_QUESTIONS)
            }));
          }
        }
      } catch (apiError: any) {
        console.error('API error in handleAnswerSubmit:', apiError);
        setScorecardState(prev => ({
          ...prev,
          isLoading: false,
          error: `An API error occurred: ${apiError.message || 'Unknown error'}`
        }));
      }
    } catch (error: any) {
      console.error('Error in handleAnswerSubmit:', error);
      setScorecardState(prev => ({
        ...prev,
        isLoading: false,
        error: `An unexpected error occurred in handleAnswerSubmit: ${error.message || 'Unknown error'}`
      }));
    }
  }, [selectedIndustry, MAX_QUESTIONS, isAutoCompleting, setIsAutoCompleting, setAutoCompleteError, generateReport, leadName, leadCaptured, LEAD_FORM_THRESHOLD]);

  // --- Stabilize handleStartAutoComplete using Functional Updates ---
  const handleStartAutoComplete = useCallback(() => {
    // Enhanced check for auto-complete feature
    const isProd = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
    const forceDisabled = isProd && process.env.NEXT_PUBLIC_ENABLE_AUTO_COMPLETE !== 'true';
    
    // Log environment details
    console.log(`[DEBUG] handleStartAutoComplete: NODE_ENV=${process.env.NODE_ENV}, ENABLE=${process.env.NEXT_PUBLIC_ENABLE_AUTO_COMPLETE}`);
    
    // Don't allow auto-complete if feature is disabled
    if (!autoCompleteFeatureEnabled || forceDisabled) {
      console.log('>>> FRONTEND: Auto-complete feature is disabled in this environment');
      return;
    }
    
    // Prevent starting auto-complete if already in progress or app is loading
    if (isAutoCompleting || scorecardState.isLoading) {
      console.log('>>> FRONTEND: Already auto-completing or loading, ignoring duplicate click');
      return;
    }

    console.log('>>> FRONTEND: Starting auto-complete from question', scorecardState.currentQuestionNumber);
    setIsAutoCompleting(true);
    setAutoCompleteError(null);
  }, [autoCompleteFeatureEnabled, isAutoCompleting, scorecardState.isLoading, scorecardState.currentQuestionNumber]);

  // --- Stabilize autoCompleteCount using Functional Updates ---
  const handleAutoCompleteCount = useCallback((count: number) => {
    setAutoCompleteCount(count);
  }, []);

  // Create a function to normalize answer types for consistency
  const normalizeAnswerType = (apiAnswerType: string): string => {
    if (!apiAnswerType) return 'text';
    
    const type = apiAnswerType.toLowerCase().trim();
    
    if (type === 'radio') return 'radio';
    if (type === 'checkbox') return 'checkbox';
    if (type === 'scale') return 'scale';
    if (type === 'text') return 'text';
    
    if (type === 'single-choice' || type === 'single' || type === 'choice' || type === 'select') return 'radio';
    if (type === 'multiple-choice' || type === 'multiple' || type === 'multi') return 'checkbox';
    if (type === 'rating' || type === 'number' || type === 'numeric') return 'scale';
    if (type === 'textarea' || type === 'longtext' || type === 'freetext' || type === 'free-text' || type === 'input') return 'text';
    
    console.warn(`Unexpected answer type: ${apiAnswerType}, defaulting to text input`);
    return 'text';
  };

  // Add the renderContent function which was missing
  const renderContent = () => {
    console.log(`RENDER_CONTENT: currentStep=${currentStep}, overall_status=${scorecardState.overall_status}`);

    // Show loading overlay for report generation
    if (isGeneratingFinalReport) {
      return <ReportLoadingIndicator isLoading={true} />;
    }

    // Industry Selection
    if (currentStep === 'industrySelection') {
      return (
        <NewAssessmentLanding
          onStartAssessment={startActualAssessment}
        />
      );
    }

    // Lead Capture
    if (currentStep === 'leadCapture') {
      return (
        <div className="mt-12">
          <LeadCaptureForm
            aiTier={null} // Pass null for now, tier is determined after assessment
            onSubmitSuccess={handleLeadCaptureSuccess} // This will now generate report and navigate
            reportMarkdown={null} // Not available at this stage
            questionAnswerHistory={scorecardState.history} // Pass history for context
            industry={selectedIndustry} // Pass the selected industry to the form
          />
        </div>
      );
    }

    // Assessment Questions - Only show if not reached max questions and lead form not required
    if (currentStep === 'assessment' && 
        scorecardState.currentQuestionNumber <= MAX_QUESTIONS && 
        scorecardState.overall_status !== 'lead-capture-required' &&
        scorecardState.overall_status !== 'completed') {
      return (
        <AssessmentQuestion
          scorecardState={scorecardState}
          memoizedOptions={memoizedOptions}
          memoizedReasoningText={memoizedReasoningText}
          handleAnswerSubmit={handleAnswerSubmit}
          isAutoCompleting={isAutoCompleting}
          memoizedSetIsAutoCompleting={memoizedSetIsAutoCompleting}
          memoizedSetAutoCompleteError={memoizedSetAutoCompleteError}
          handleStartAutoComplete={handleStartAutoComplete}
          autoCompleteCount={autoCompleteCount}
          memoizedHistory={memoizedHistory}
          selectedIndustry={selectedIndustry}
          autoCompleteError={autoCompleteError} // Pass autoCompleteError from parent state
        />
      );
    }

    // Show "Redirecting..." message when completed
    if (currentStep === 'completed') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sg-bright-green"></div>
          <p className="text-lg font-medium text-gray-700">Redirecting to your results...</p>
        </div>
      );
    }

    // Results should be handled by the dedicated results page at /scorecard/results
    // If we reach this point in the results step, allow navigation to proceed
    if (currentStep === 'results' || scorecardState.overall_status === 'completed') {
      // Navigation to /scorecard/results should have already occurred
      // If we're still here, it means navigation might have failed, so redirect
      const reportId = sessionStorage.getItem('currentReportID') || sessionStorage.getItem('reportId');
      if (reportId) {
        console.log('>>> FRONTEND: Redirecting to results page with reportId:', reportId);
        window.location.href = `/scorecard/results?reportId=${reportId}`;
        return <ReportLoadingIndicator isLoading={true} />;
      } else {
        console.error('>>> FRONTEND: No reportId found, cannot navigate to results');
        return <div>Report ID not found. Please try again.</div>;
      }
    }

    // Default: Show industry selection
    return (
      <IndustrySelection
        industries={industries}
        selectedIndustry={selectedIndustry}
        handleIndustryChange={setSelectedIndustry}
        startAssessment={startActualAssessment}
        leadCaptured={leadCaptured}
        scorecardState={scorecardState}
      />
    );
  };

  // Main application render
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Professional Header */}
      <AssessmentHeader />
      
      {/* Main Content */}
      <main className="flex-1">
        <NoSidebarLayout>
          {/* Existing content rendering logic */}
          {renderContent()}
        </NoSidebarLayout>
      </main>
      
      {/* Professional Footer */}
      <AssessmentFooter />
    </div>
  );
}
