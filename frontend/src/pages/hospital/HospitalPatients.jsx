import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Loader2, AlertCircle, Users, CheckCircle2, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const HospitalPatients = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const init = async () => {
      try {
        const [patRes, docRes] = await Promise.all([
          api.get('/hospital/patients'),
          api.get(`/facilities/${user.managed_facility_id}/doctors`)
        ]);
        setPatients(patRes.data);
        setDoctors(docRes.data);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Hospital Patients Directory', 14, 15);
    
    const tableColumn = ["Patient Name", "Phone Number", "Gender", "Last Visit Date"];
    const tableRows = [];
    
    patients.forEach(p => {
      const rowData = [
        p.name,
        p.phone,
        p.gender,
        p.last_visit
      ];
      tableRows.push(rowData);
    });
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save(`patients_directory_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <div className="h-full flex justify-center items-center"><Loader2 className="h-8 w-8 text-green-600 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
        {patients.length > 0 && (
          <button 
            onClick={handleDownloadPDF} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
        )}
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="h-4 w-4" /> {error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm"><CheckCircle2 className="h-4 w-4" /> {success}</div>}
      
      {patients.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No patients found. Patients will appear here after their first confirmed appointment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">Patient Name</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Phone Number</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Gender</th>
                <th className="p-4 text-sm font-semibold text-slate-600 text-right">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{p.name}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-slate-700">{p.phone}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-slate-700 capitalize">{p.gender}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm text-slate-700">{p.last_visit}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default HospitalPatients;
