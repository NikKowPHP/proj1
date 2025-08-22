/** @jest-environment jsdom */

import { generateAssessmentPdf } from './pdf-generator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { ActionPlan } from '../types';

// Mock the jsPDF library
jest.mock('jspdf', () => {
  const implementation = {
    autoTable: jest.fn(),
    text: jest.fn(),
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    save: jest.fn(),
    splitTextToSize: jest.fn((text: string) => [text]),
    addPage: jest.fn(),
  };

  (implementation.autoTable as any).previous = { finalY: 100 };
  return jest.fn().mockImplementation(() => implementation);
});

const MockedJsPDF = jsPDF as jest.Mock;
const mockAutoTable = new MockedJsPDF().autoTable;

describe('generateAssessmentPdf (ActionPlan)', () => {
  const mockPlan: ActionPlan = {
    overallSummary: "This is a mock summary.",
    recommendedScreenings: [
      { id: 'S1', title: 'Screening 1', description: 'Desc 1', why: 'Reason 1' }
    ],
    lifestyleGuidelines: [
      { id: 'L1', title: 'Lifestyle 1', description: 'Desc L1' }
    ],
    topicsForDoctor: [
      { id: 'T1', title: 'Topic 1', why: 'Reason T1' }
    ]
  };

  const mockAnswers = {
    age: '50-59',
    smoking_status: 'Never Smoked'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call autoTable for recommended screenings', () => {
    generateAssessmentPdf(mockPlan, mockAnswers, 'en');
    expect(mockAutoTable).toHaveBeenCalledWith(expect.objectContaining({
      head: [['Screening', 'Reason']],
      body: [['Screening 1', 'Reason 1']]
    }));
  });

  it('should call autoTable for lifestyle guidelines', () => {
    generateAssessmentPdf(mockPlan, mockAnswers, 'en');
    expect(mockAutoTable).toHaveBeenCalledWith(expect.objectContaining({
      head: [['Guideline', 'Description']],
      body: [['Lifestyle 1', 'Desc L1']]
    }));
  });

  it('should call autoTable for topics for doctor', () => {
    generateAssessmentPdf(mockPlan, mockAnswers, 'en');
    expect(mockAutoTable).toHaveBeenCalledWith(expect.objectContaining({
        head: [['Topic', 'Reason for Discussion']],
        body: [['Topic 1', 'Reason T1']]
    }));
  });
  
  it('should call autoTable for user answers', () => {
    generateAssessmentPdf(mockPlan, mockAnswers, 'en');
    expect(mockAutoTable).toHaveBeenCalledWith(expect.objectContaining({
        head: [['Question', 'Your Answer']],
        body: [['Age', '50-59'], ['Smoking Status', 'Never Smoked']]
    }));
  });

  it('should call autoTable four times (once for each section)', () => {
    generateAssessmentPdf(mockPlan, mockAnswers, 'en');
    expect(mockAutoTable).toHaveBeenCalledTimes(4);
  });

  it('should call doc.save with a correctly formatted filename', () => {
    generateAssessmentPdf(mockPlan, mockAnswers, 'en');
    const expectedFilename = `Doctors_Discussion_Guide_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`;
    expect(new MockedJsPDF().save).toHaveBeenCalledWith(expectedFilename);
  });
});
      