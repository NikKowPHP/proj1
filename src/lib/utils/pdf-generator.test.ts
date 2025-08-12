/** @jest-environment jsdom */

import { generateAssessmentPdf } from './pdf-generator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { AssessmentResult } from '../types';

// Mock the jsPDF library
jest.mock('jspdf', () => {
  const mockAutoTable = jest.fn();
  const mockText = jest.fn();
  const mockSetFontSize = jest.fn();
  const mockSetTextColor = jest.fn();
  const mockSave = jest.fn();

  // Mock the jsPDF constructor to return an object with our mocked methods
  return jest.fn().mockImplementation(() => ({
    autoTable: mockAutoTable,
    text: mockText,
    setFontSize: mockSetFontSize,
    setTextColor: mockSetTextColor,
    save: mockSave,
  }));
});

// Access the mocked constructor and methods for assertions
const MockedJsPDF = jsPDF as jest.Mock;
const mockAutoTable = new MockedJsPDF().autoTable;

describe('generateAssessmentPdf', () => {
  const mockData: AssessmentResult = {
    riskFactors: [
      { factor: 'Smoking', riskLevel: 'High', explanation: 'Causes cancer.' }
    ],
    positiveFactors: [
      { factor: 'Exercise', explanation: 'Is good for you.' }
    ],
    recommendations: ['See a doctor.']
  };

  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();
  });

  it('should call autoTable with risk factors data', () => {
    generateAssessmentPdf(mockData);
    expect(mockAutoTable).toHaveBeenCalledWith(expect.objectContaining({
      head: [['Factor', 'Risk Level', 'Explanation']],
      body: [['Smoking', 'High', 'Causes cancer.']]
    }));
  });

  it('should call autoTable with positive factors data', () => {
    generateAssessmentPdf(mockData);
    expect(mockAutoTable).toHaveBeenCalledWith(expect.objectContaining({
      head: [['Factor', 'Details']],
      body: [['Exercise', 'Is good for you.']]
    }));
  });

  it('should call autoTable twice (once for each section)', () => {
    generateAssessmentPdf(mockData);
    expect(mockAutoTable).toHaveBeenCalledTimes(2);
  });

  it('should call doc.save with a correctly formatted filename', () => {
    generateAssessmentPdf(mockData);
    const expectedFilename = `Health_Assessment_Results_${new Date().toLocaleDateString()}.pdf`;
    expect(new MockedJsPDF().save).toHaveBeenCalledWith(expectedFilename);
  });
});