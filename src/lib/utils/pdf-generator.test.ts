/** @jest-environment jsdom */

import { generateAssessmentPdf } from './pdf-generator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { AssessmentResult } from '../types';

// Mock the jsPDF library
jest.mock('jspdf', () => {
  // Create a mock implementation object that will be returned by the constructor
  const implementation = {
    autoTable: jest.fn(),
    text: jest.fn(),
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    save: jest.fn(),
    splitTextToSize: jest.fn((text: string) => [text]),
  };

  // Attach the 'previous' property to the autoTable mock to simulate
  // the jspdf-autotable plugin's behavior of tracking the last table's position.
  (implementation.autoTable as any).previous = { finalY: 100 };

  // The mock constructor returns our implementation object
  return jest.fn().mockImplementation(() => implementation);
});

// Access the mocked constructor and methods for assertions
const MockedJsPDF = jsPDF as jest.Mock;
const mockAutoTable = new MockedJsPDF().autoTable;

describe('generateAssessmentPdf', () => {
  const mockData: AssessmentResult = {
    overallSummary: "This is a mock summary.",
    modelAssessments: [
      {
        modelName: "General Risk",
        riskFactors: [
          { factor: 'Smoking', riskLevel: 'High', explanation: 'Causes cancer.' }
        ]
      }
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
    generateAssessmentPdf(mockData, 'en');
    expect(mockAutoTable).toHaveBeenCalledWith(expect.objectContaining({
      head: [['Factor', 'Risk Level', 'Explanation']],
      body: [['Smoking', 'High', 'Causes cancer.']]
    }));
  });

  it('should call autoTable with positive factors data', () => {
    generateAssessmentPdf(mockData, 'en');
    expect(mockAutoTable).toHaveBeenCalledWith(expect.objectContaining({
      head: [['Factor', 'Details']],
      body: [['Exercise', 'Is good for you.']]
    }));
  });

  it('should call autoTable twice (once for each section)', () => {
    generateAssessmentPdf(mockData, 'en');
    expect(mockAutoTable).toHaveBeenCalledTimes(2);
  });

  it('should call doc.save with a correctly formatted filename', () => {
    generateAssessmentPdf(mockData, 'en');
    const expectedFilename = `Health_Assessment_Results_${new Date().toLocaleDateString()}.pdf`;
    expect(new MockedJsPDF().save).toHaveBeenCalledWith(expectedFilename);
  });
});
      