
"use client"

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { demoCase } from '@/lib/mock-data';
import { CaseIntake } from '@/lib/types';
import { FileText, AlertCircle, Upload, X, Link as LinkIcon } from 'lucide-react';
import { LegalLoading } from '@/components/ui/legal-loading';

// Mock judge profiles
const judges = [
  { id: '1', name: 'Hon. Sarah Mitchell', court: 'EDNY/SDNY', initials: 'SM' },
  { id: '2', name: 'Hon. Robert Chen', court: 'EDNY/SDNY', initials: 'RC' },
  { id: '3', name: 'Hon. Maria Garcia', court: 'EDNY/SDNY', initials: 'MG' },
  { id: '4', name: 'Hon. David Thompson', court: 'CDCA', initials: 'DT' },
];

// Mock state lawyers
const stateLawyers = [
  { id: '1', name: 'James Anderson', firm: 'Anderson & Associates', state: 'New York', initials: 'JA' },
  { id: '2', name: 'Emily Rodriguez', firm: 'Rodriguez Law Group', state: 'New York', initials: 'ER' },
  { id: '3', name: 'Michael Chen', firm: 'Chen Legal Partners', state: 'California', initials: 'MC' },
  { id: '4', name: 'Sarah Johnson', firm: 'Johnson & Smith LLP', state: 'California', initials: 'SJ' },
  { id: '5', name: 'David Williams', firm: 'Williams Law Firm', state: 'Florida', initials: 'DW' },
  { id: '6', name: 'Jennifer Davis', firm: 'Davis Legal Services', state: 'Texas', initials: 'JD' },
  { id: '7', name: 'Robert Martinez', firm: 'Martinez & Partners', state: 'Illinois', initials: 'RM' },
  { id: '8', name: 'Lisa Thompson', firm: 'Thompson Legal Group', state: 'Pennsylvania', initials: 'LT' },
];

// Mock states
const states = [
  'New York', 'California', 'Florida', 'Texas', 'Illinois', 'Pennsylvania'
];

export function CaseIntakeForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<CaseIntake>(demoCase);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedLawyer, setSelectedLawyer] = useState<string>('');
  const [showLoading, setShowLoading] = useState(false);
  
  const loadingMessages = [
    "Reviewing legal databases…",
    "Analyzing precedents…",
    "Evaluating case specifics…",
    "Identifying similar cases…",
    "Building strategic foundations…"
  ];
  
  // Filter lawyers by selected state
  const filteredLawyers = selectedState 
    ? stateLawyers.filter(lawyer => lawyer.state === selectedState)
    : stateLawyers;

  const handleInputChange = (field: keyof CaseIntake, value: any) => {
    if (field === 'preferences') {
      setFormData(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      // Filter to only accept PDF files
      const pdfFiles = Array.from(files).filter(file => 
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      if (pdfFiles.length !== files.length) {
        alert('Only PDF files are accepted. Non-PDF files have been filtered out.');
      }
      setUploadedFiles(prev => [...prev, ...pdfFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show loading animation while processing
    setShowLoading(true);
    
    try {
      // If PDFs are uploaded, send them to the backend for processing
      if (uploadedFiles.length > 0) {
        const formDataToSend = new FormData();
        uploadedFiles.forEach(file => {
          formDataToSend.append('files', file);
        });
        
        const response = await fetch('http://localhost:5000/api/upload-case', {
          method: 'POST',
          body: formDataToSend,
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Store the similar cases in localStorage
          localStorage.setItem('similarCases', JSON.stringify(result.cases));
          localStorage.setItem('extractedText', result.extracted_text || '');
          localStorage.setItem('generatedQuery', result.query || '');
          
          // Store case data in localStorage
          const caseData = {
            ...formData,
            extractedText: result.extracted_text,
            uploadedFileNames: uploadedFiles.map(f => f.name)
          };
          localStorage.setItem('legalCase', JSON.stringify(caseData));
          
          // Navigate after processing completes
          router.push('/cases');
        } else {
          console.error('Error from backend:', result.error);
          alert(`Error: ${result.error}`);
          setShowLoading(false);
        }
      } else {
        // No PDFs uploaded, use mock data flow
        localStorage.setItem('legalCase', JSON.stringify(formData));
        
        // Navigate after saving
        router.push('/cases');
      }
    } catch (error) {
      console.error('Error uploading case:', error);
      alert('An error occurred while processing your case. Please try again.');
      setShowLoading(false);
    }
  };

  return (
    <>
      <ProgressHeader 
        currentStep={1} 
        title="Case Intake" 
        description="Enter your case details to begin strategy development"
      />
      
      <div className="max-w-4xl mx-auto p-6">
        {showLoading ? (
          <LegalLoading messages={loadingMessages} duration={12500} />
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Section */}
          <Card className="legal-card legal-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="h-6 w-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-xl text-black">Case Information</CardTitle>
                  <CardDescription>
                    Provide the core details of your legal matter
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                  <Select 
                    value={formData.jurisdiction} 
                    onValueChange={(value) => handleInputChange('jurisdiction', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EDNY/SDNY">EDNY/SDNY</SelectItem>
                      <SelectItem value="CDCA">CDCA</SelectItem>
                      <SelectItem value="NDIL">NDIL</SelectItem>
                      <SelectItem value="SDFL">SDFL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="judge">Judge Profile</Label>
                  <Select 
                    value={formData.judge} 
                    onValueChange={(value) => handleInputChange('judge', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select judge" />
                    </SelectTrigger>
                    <SelectContent>
                      {judges.map((judge) => (
                        <SelectItem key={judge.id} value={judge.name}>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-gray-100 text-black">
                                {judge.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{judge.name}</span>
                              <span className="text-xs text-gray-500">{judge.court}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opposingParty">Opposing Party</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm text-gray-600">State</Label>
                    <Select 
                      value={selectedState} 
                      onValueChange={(value) => {
                        setSelectedState(value);
                        setSelectedLawyer(''); // Reset lawyer when state changes
                        handleInputChange('opposingCounsel', value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateLawyer" className="text-sm text-gray-600">State Attorney</Label>
                    <Select
                      value={selectedLawyer}
                      onValueChange={(value) => {
                        setSelectedLawyer(value);
                        handleInputChange('opposingCounsel', selectedState ? `${selectedState} - ${value}` : value);
                      }}
                      disabled={!selectedState}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedState ? "Select lawyer" : "Select state first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLawyers.map((lawyer) => (
                          <SelectItem key={lawyer.id} value={lawyer.name}>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-gray-100 text-black">
                                  {lawyer.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">{lawyer.name}</span>
                                <span className="text-xs text-gray-500">{lawyer.firm}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facts">Case Facts & Evidence *</Label>
                
                {/* File Dropzone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragActive ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Drag and drop PDF files here, or click to browse
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Upload case documents to automatically find similar cases
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,application/pdf"
                      className="hidden"
                      id="file-upload"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Select Files
                    </Button>
                  </div>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Free Text Field */}
                <Textarea
                  id="facts"
                  value={formData.facts}
                  onChange={(e) => handleInputChange('facts', e.target.value)}
                  placeholder="Describe the key facts of your case..."
                  rows={4}
                  className="min-h-[100px] mt-3"
                />
              </div>

              {/* Connectors Section */}
              <div className="space-y-2">
                <Label>Document Management Connectors</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button type="button" variant="outline" size="sm" className="justify-start">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Clio
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="justify-start">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    MyCase
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="justify-start">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    NetDocuments
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="justify-start">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    iManage
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Connect to your document management system to import case files automatically
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>All case information is processed locally and securely</span>
            </div>
            <Button 
              type="submit" 
              size="lg"
              className="legal-gradient text-white px-8 py-3 text-base font-medium"
            >
              Analyze Case & Find Similar Cases
            </Button>
          </div>
        </form>
        )}
      </div>
    </>
  );
}
