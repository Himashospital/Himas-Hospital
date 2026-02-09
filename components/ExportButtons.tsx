
import React, { useState } from 'react';
import { Download, Printer, Calendar as CalendarIcon, X, FileSpreadsheet } from 'lucide-react';
import { Patient, PackageProposal, SurgeonCode } from '../types';

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '';

  const datePart = dateString.split('T')[0];
  const parts = datePart.split('-');

  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return datePart;
  }
  
  return dateString;
};

// Helper to determine visit type (New/Revisit)
const getVisitTypeLabel = (p: Patient, allPatients: Patient[]): string => {
  if (p.visit_type) return p.visit_type;
  const visits = allPatients
    .filter(v => v.mobile === p.mobile)
    .sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
  if (visits.length > 0 && visits[0].id === p.id) return 'New';
  return 'Revisit';
};

// Helper to get descriptive status for reports
const getStatusLabel = (p: Patient): string => {
  if (p.packageProposal?.outcome) {
    switch (p.packageProposal.outcome) {
      case 'Scheduled': return 'Surgery Scheduled';
      case 'Follow-Up': return 'Follow-Up Surgery';
      case 'Lost': return 'Surgery Lost';
      case 'Completed': return 'Surgery Completed';
    }
  }
  if (p.doctorAssessment) {
    if (p.doctorAssessment.quickCode === SurgeonCode.S1) return 'Package Proposal';
    if (p.doctorAssessment.quickCode === SurgeonCode.M1) return 'Medication Done';
    return 'Doctor Done';
  }
  if (p.status === 'Arrived') return 'Arrived';
  return p.visitType === 'Follow Up' ? 'Follow Up' : 'Scheduled';
};

interface ExportButtonsProps {
  patients: Patient[];
  role: string;
  selectedPatient?: Patient | null;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ patients, role, selectedPatient }) => {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const resetForm = () => {
    setStartDate('');
    setEndDate('');
  };

  const handlePrint = () => {
    if (role === 'package_team' && selectedPatient && selectedPatient.packageProposal) {
      const p = selectedPatient;
      const prop = p.packageProposal as PackageProposal;
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const today = formatDate(prop.outcomeDate || prop.proposalCreatedAt || new Date().toISOString());
      const stayText = prop.stayDays ? `${prop.stayDays} DAYS` : '---';
      const packageAmt = prop.packageAmount ? `₹ ${parseInt(prop.packageAmount.replace(/,/g, '')).toLocaleString()}` : '₹ 0';
      const displaySource = p.source === 'Doctor Recommended' ? `DR. ${p.sourceDoctorName || 'RECOMMENDED'}` : p.source;

      const surgeryText = p.doctorAssessment?.surgeryProcedure === 'Other'
        ? (p.doctorAssessment?.otherSurgeryName || 'OTHER PROCEDURE')
        : (p.doctorAssessment?.surgeryProcedure || '---');

      // Logic to determine Post-Op Follow-Up display string
      let followUpDisplay = '---';
      if (prop.postFollowUp === 'Excluded') {
        followUpDisplay = 'NO';
      } else if (prop.postFollowUp === 'Included') {
        if (prop.postFollowUpCount) {
          followUpDisplay = `${prop.postFollowUpCount} ${prop.postFollowUpCount === 1 ? 'DAY' : 'DAYS'}`;
        } else {
          followUpDisplay = 'INCLUDED';
        }
      } else if (prop.postFollowUp) {
        // Support legacy values if they exist
        followUpDisplay = prop.postFollowUp.toUpperCase();
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Proposed Tariff - ${p.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              color: #1e293b; 
              padding: 30px 40px; 
              max-width: 800px; 
              margin: auto;
              line-height: 1.4;
            }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
            .header-left h1 { font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -0.02em; }
            .header-left p { font-size: 14px; color: #64748b; font-weight: 700; margin-top: 4px; }
            .logo-box { text-align: right; }
            .logo-text { font-size: 20px; font-weight: 900; color: #0284c7; text-transform: uppercase; margin: 0; }
            .logo-subtext { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th, td { border: 1.5px solid #1e293b; padding: 10px 15px; text-align: left; font-size: 12px; }
            th { width: 40%; font-weight: 800; text-transform: uppercase; color: #475569; background-color: #ffffff; }
            td { font-weight: 700; color: #1e293b; text-transform: uppercase; }
            .pkg-row { font-size: 14px; }
            
            .section-title { font-size: 14px; font-weight: 900; text-transform: uppercase; margin: 25px 0 10px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
            .facilities-list { list-style: none; padding: 0; font-size: 12px; font-weight: 500; }
            .facilities-list li { margin-bottom: 6px; }
            .facilities-list b { color: #0284c7; text-decoration: underline; }
            
            .terms { font-size: 11px; color: #475569; margin-top: 25px; }
            .terms ol { padding-left: 20px; }
            .terms li { margin-bottom: 5px; }
            
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
            .sig-line { width: 250px; border-top: 1.5px solid #1e293b; text-align: center; padding-top: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #64748b; }
            
            @media print {
              body { padding: 20px 40px; }
              .signatures { margin-top: 50px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <h1>PROPOSED TARIFF</h1>
              <p>DATE: ${today}</p>
            </div>
            <div class="logo-box">
              <h2 class="logo-text">HIMAS</h2>
              <p class="logo-subtext">HOSPITAL MANAGEMENT</p>
            </div>
          </div>

          <table>
            <tr><th>PATIENT NAME</th><td>${p.name}</td></tr>
            <tr><th>UHID NO</th><td>${p.id}</td></tr>
            <tr><th>REFERRED BY</th><td>${displaySource}</td></tr>
            <tr><th>PROPOSED SURGERY</th><td>${surgeryText}</td></tr>
            <tr><th>PAYMENT MODE</th><td>${prop.modeOfPayment || '---'}</td></tr>
            <tr><th>ROOM TYPE</th><td>${prop.roomType || '---'}</td></tr>
            <tr><th>EXPECTED STAY</th><td>${stayText}</td></tr>
            <tr class="pkg-row"><th>PROPOSED PACKAGE AMOUNT</th><td style="font-size: 18px; font-weight: 900;">${packageAmt}</td></tr>
          </table>

          <div class="section-title">HOSPITAL REMARKS & FACILITIES</div>
          <ul class="facilities-list">
            <li>• Room Category: <b>${prop.roomType || '---'}</b></li>
            <li>• Medicines: <b>${prop.surgeryMedicines || '---'}</b></li>
            <li>• ICU Charges: <b>${prop.icuCharges || '---'}</b></li>
            <li>• Pre-Op Investigation: <b>${prop.preOpInvestigation || '---'}</b></li>
            <li>• Post-Op Follow-Up: <b>${followUpDisplay}</b></li>
          </ul>

          <div class="section-title">IMPORTANT TERMS</div>
          <div class="terms">
            <ol>
              <li>Special investigations or consultations beyond basic package are CHARGED EXTRA.</li>
              <li>Advance of ₹ 20,000 required for date confirmation.</li>
              <li>ICU Charges (if required): ₹15,000 per day; with ventilator support: ₹25,000 per day.</li>
            </ol>
          </div>

          <div class="signatures">
            <div class="sig-line">COUNSELOR SIGNATURE</div>
            <div class="sig-line">PATIENT SIGNATURE</div>
          </div>

          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  const handleExportCSV = () => {
    let filteredPatients = [...patients];

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filteredPatients = patients.filter(p => {
        const regDateStr = formatDate(p.entry_date || p.registeredAt);
        if (!regDateStr) return false;

        const regDate = new Date(regDateStr);
        return regDate >= start && regDate <= end;
      });
    }

    const headers = [
      'File Registration No', 
      'Name', 
      'DOB',
      'Gender', 
      'Age', 
      'Mobile', 
      'Occupation',
      'Insurance Provider',
      'Source',
      'Condition',
      'Visit Type',
      'Registration Date',
      'Status',
      'Doctor Assessed', 
      'Surgeon Code', 
      'Proposed Procedure',
      'Pain Severity',
      'Affordability',
      'Readyiness',
      'Surgery Date',
      'Digital Signature',
      'Clinical Findings & Notes',
      'Proposal Created', 
      'Proposal Stage',
      'Decision Pattern',
      'Objection',
      'Strategy',
      'Follow Up Date',
      'Remark'
    ];

    const rows = filteredPatients.map(p => [
      p.id,
      p.name,
      p.dob || '',
      p.gender,
      p.age,
      p.mobile,
      p.occupation || '',
      p.insuranceName || 'N/A',
      p.source === 'Doctor Recommended' ? `Dr. ${p.sourceDoctorName || 'Recommended'}` : p.source,
      p.condition,
      getVisitTypeLabel(p, patients),
      formatDate(p.entry_date || p.registeredAt),
      getStatusLabel(p),
      p.doctorAssessment ? 'Yes' : 'No',
      p.doctorAssessment?.quickCode || '',
      p.doctorAssessment?.surgeryProcedure === 'Other' 
        ? (p.doctorAssessment?.otherSurgeryName || 'Other') 
        : (p.doctorAssessment?.surgeryProcedure || ''),
      p.doctorAssessment?.painSeverity || '',
      p.doctorAssessment?.affordability || '',
      p.doctorAssessment?.conversionReadiness || '',
      formatDate(p.doctorAssessment?.tentativeSurgeryDate),
      p.doctorAssessment?.doctorSignature || '',
      p.doctorAssessment?.notes || '',

      p.packageProposal ? 'Yes' : 'No',
      p.packageProposal?.proposalStage || '',
      p.packageProposal?.decisionPattern || '',
      p.packageProposal?.objectionIdentified || '',
      p.packageProposal?.counselingStrategy || '',
      formatDate(p.packageProposal?.followUpDate),
      p.packageProposal?.remarks || ''
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
            <button onClick={() => { setShowDateFilter(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
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
