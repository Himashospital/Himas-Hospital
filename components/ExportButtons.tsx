import React, { useState } from 'react';
import { Download, Printer, Calendar as CalendarIcon, X, FileSpreadsheet } from 'lucide-react';
import { Patient } from '../types';

interface ExportButtonsProps {
  patients: Patient[];
  role: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ patients, role }) => {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let filteredPatients = [...patients];

    // Filter by date if dates are selected
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filteredPatients = patients.filter(p => {
        const regDate = new Date(p.registeredAt);
        return regDate >= start && regDate <= end;
      });
    }

    // Comprehensive Headers
    const headers = [
      'File Registration No', 
      'Name', 
      'DOB',
      'Gender', 
      'Age', 
      'Mobile', 
      'Occupation',
      'Insurance',
      'Insurance Provider',
      'Source',
      'Condition',
      'Registration Time',
      // Doctor Data
      'Doctor Assessed', 
      'Surgeon Code', 
      'Pain Severity',
      'Affordability',
      'Readiness',
      'Surgery Date',
      'Doctor Signature',
      // Package Data
      'Proposal Created', 
      'Decision Pattern',
      'Objection',
      'Strategy',
      'Follow Up Date'
    ];

    const rows = filteredPatients.map(p => [
      p.id,
      p.name,
      p.dob || '',
      p.gender,
      p.age,
      p.mobile,
      p.occupation || '',
      p.hasInsurance,
      p.insuranceName || 'N/A',
      p.source,
      p.condition,
      new Date(p.registeredAt).toLocaleString(),
      
      // Doctor
      p.doctorAssessment ? 'Yes' : 'No',
      p.doctorAssessment?.quickCode || '',
      p.doctorAssessment?.painSeverity || '',
      p.doctorAssessment?.affordability || '',
      p.doctorAssessment?.conversionReadiness || '',
      p.doctorAssessment?.tentativeSurgeryDate || '',
      p.doctorAssessment?.doctorSignature || '',

      // Package
      p.packageProposal ? 'Yes' : 'No',
      p.packageProposal?.decisionPattern || '',
      p.packageProposal?.objectionIdentified || '',
      p.packageProposal?.counselingStrategy || '',
      p.packageProposal?.followUpDate || ''
    ].map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateRangeStr = startDate && endDate ? `_${startDate}_to_${endDate}` : '';
    link.setAttribute('href', url);
    link.setAttribute('download', `himas_data_${role}${dateRangeStr}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Close modal if open
    setShowDateFilter(false);
  };

  return (
    <div className="flex gap-2 no-print relative">
      <button 
        onClick={handlePrint}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
      >
        <Printer className="w-4 h-4" />
        Print
      </button>
      
      <button 
        onClick={() => setShowDateFilter(true)}
        className="flex items-center gap-2 px-3 py-2 bg-hospital-600 text-white border border-transparent rounded-md text-sm font-medium hover:bg-hospital-700 shadow-sm"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Export Reports
      </button>

      {showDateFilter && (
        <div className="absolute top-12 right-0 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-hospital-500" /> Date Range Report
            </h3>
            <button onClick={() => setShowDateFilter(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-hospital-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-hospital-500 outline-none"
              />
            </div>
            
            <div className="pt-2 border-t flex justify-end gap-2">
               <button 
                 onClick={handleExportCSV}
                 className="flex-1 bg-hospital-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-hospital-700 flex items-center justify-center gap-2"
               >
                 <Download className="w-4 h-4" />
                 Download CSV
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};