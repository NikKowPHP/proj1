'use client'

import React, { useState, useRef } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import Spinner from '../ui/Spinner';
import { Paperclip, Trash2, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  question: any;
  answers: Record<string, any>;
  onAnswer: (id: string, value: any) => void;
}

export const FileUploadComponent = ({ question, answers, onAnswer }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadedFileUrl = answers[question.id];
  const filename = uploadedFileUrl ? decodeURIComponent(uploadedFileUrl.split('/').pop()?.split('-').slice(1).join('-') || '') : null;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);

    // --- Validation ---
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF, JPG, or PNG.');
      return;
    }
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      setError('File is too large. Maximum size is 10 MB.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch(`/api/upload/report?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const newBlob = await response.json();
      onAnswer(question.id, newBlob.url);
    } catch (err) {
      logger.error("File upload failed", err);
      setError('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async () => {
    if (!uploadedFileUrl) return;

    try {
      await fetch('/api/upload/report', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: uploadedFileUrl }),
      });
    } catch (err) {
      logger.error("Failed to delete file from blob storage", err);
    } finally {
      onAnswer(question.id, undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={question.id}>{question.text}</Label>
      {uploadedFileUrl ? (
        <div className="flex items-center justify-between text-sm p-2 bg-secondary ">
          <div className="flex items-center gap-2 truncate">
            <Paperclip className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{filename}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-7 w-7">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Input
            id={question.id}
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
            ref={fileInputRef}
            className={cn("pr-12", error && "border-destructive")}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          {isUploading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Spinner size="sm" />
            </div>
          )}
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
};
      