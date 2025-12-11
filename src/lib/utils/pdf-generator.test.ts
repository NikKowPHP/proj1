/** @jest-environment jsdom */

import { generateAssessmentPdf } from './pdf-generator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ActionPlan } from '../types';

// Mock the jsPDF library
const mockSave = jest.fn();
const mockText = jest.fn();
const mockAddPage = jest.fn();
const mockSetFontSize = jest.fn();
const mockSetFont = jest.fn();
const mockSetTextColor = jest.fn();
const mockSetCharSpace = jest.fn();
const mockAddFileToVFS = jest.fn();
const mockAddFont = jest.fn();
const mockAddImage = jest.fn();
const mockRect = jest.fn();
const mockSetFillColor = jest.fn();
const mockSplitTextToSize = jest.fn((text: string) => [text]);

const mockDoc = {
  save: mockSave,
  text: mockText,
  addPage: mockAddPage,
  setFontSize: mockSetFontSize,
  setFont: mockSetFont,
  setTextColor: mockSetTextColor,
  setCharSpace: mockSetCharSpace,
  addFileToVFS: mockAddFileToVFS,
  addFont: mockAddFont,
  addImage: mockAddImage,
  rect: mockRect,
  setFillColor: mockSetFillColor,
  splitTextToSize: mockSplitTextToSize,
  internal: {
    pageSize: {
      getWidth: () => 210,
    },
  },
  lastAutoTable: { finalY: 100 },
};

jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => mockDoc);
});

// Mock jspdf-autotable
jest.mock('jspdf-autotable', () => {
  return jest.fn();
});

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
    expect(autoTable).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      body: [['Screening 1', 'Reason 1']]
    }));
  });

  it('should call autoTable for lifestyle guidelines', () => {
    generateAssessmentPdf(mockPlan, mockAnswers, 'en');
    expect(autoTable).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      body: [['Lifestyle 1', 'Desc L1']]
    }));
  });

  it('should call autoTable for topics for doctor', () => {
    generateAssessmentPdf(mockPlan, mockAnswers, 'en');
    expect(autoTable).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        body: [['Topic 1', 'Reason T1']]
    }));
  });
  
  it('should call autoTable for user answers', () => {
    generateAssessmentPdf(mockPlan, mockAnswers, 'en');
    expect(autoTable).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        body: [['Age', '50-59'], ['Smoking Status', 'Never Smoked']]
    }));
  });

  it('should call autoTable four times (once for each section)', () => {
    generateAssessmentPdf(mockPlan, mockAnswers, 'en');
    expect(autoTable).toHaveBeenCalledTimes(4);
  });

  it('should call doc.save with a correctly formatted filename', () => {
    generateAssessmentPdf(mockPlan, mockAnswers, 'en');
    const expectedFilename = `Doctors_Discussion_Guide_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`;
    expect(mockSave).toHaveBeenCalledWith(expectedFilename);
  });
});