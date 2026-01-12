
import React, { useState, useRef, useEffect } from 'react';
import { INITIAL_EMPLOYEES } from '../constants';
import { Download, Calendar, Search, Filter, Loader2, CheckCircle, X, Check, ChevronLeft, ChevronRight, ChevronDown, Bell, Printer, ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Definition of statuses based on the legend
const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string, hours: number, editable: boolean }> = {
  'Я': { label: 'Явка', color: 'text-green-700', bg: 'bg-green-100', hours: 8, editable: true },
  'Н': { label: 'Ночь', color: 'text-indigo-700', bg: 'bg-indigo-100', hours: 8, editable: true },
  'В': { label: 'Выходной', color: 'text-slate-600', bg: 'bg-slate-200', hours: 0, editable: false },
  'Б': { label: 'Больничный', color: 'text-amber-700', bg: 'bg-amber-100', hours: 0, editable: false },
  'К': { label: 'Командировка', color: 'text-blue-700', bg: 'bg-blue-100', hours: 8, editable: true },
  'ОТ': { label: 'Отпуск', color: 'text-purple-700', bg: 'bg-purple-100', hours: 0, editable: false },
  'НН': { label: 'Неявка', color: 'text-rose-700', bg: 'bg-rose-100', hours: 0, editable: false },
};

const STATUS_ORDER = ['Я', 'Н', 'В', 'Б', 'К', 'ОТ', 'НН'];

const TimeTrackingModule: React.FC = () => {
  // Date State
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(3); // Апрель (0-index: 3)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Data State: Key is `${empId}:${year}:${month}:${day}`
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  // Stores custom hours if they differ from default or need persistence
  const [attendanceHours, setAttendanceHours] = useState<Record<string, number>>({});
  
  // UI State
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingHoursCell, setEditingHoursCell] = useState<string | null>(null); // Key of the cell being edited
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  
  // Export Modal State (Batch export)
  const [isBatchExportModalOpen, setIsBatchExportModalOpen] = useState(false);
  const [selectedEmployeesForExport, setSelectedEmployeesForExport] = useState<string[]>([]);
  const [modalSearch, setModalSearch] = useState('');
  const [listSearch, setListSearch] = useState('');

  const datePickerRef = useRef<HTMLDivElement>(null);
  const hoursInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (editingHoursCell && hoursInputRef.current && !hoursInputRef.current.contains(event.target as Node)) {
        setEditingHoursCell(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingHoursCell]);

  useEffect(() => {
    if (editingHoursCell && hoursInputRef.current) {
      hoursInputRef.current.focus();
    }
  }, [editingHoursCell]);

  const getAttendanceKey = (empId: string, d: number) => `${empId}:${year}:${month}:${d}`;

  // Helper to get actual hours (custom or default)
  const getActualHours = (key: string, status: string | undefined): number => {
    if (!status || !STATUS_CONFIG[status]) return 0;
    if (attendanceHours[key] !== undefined) return attendanceHours[key];
    return STATUS_CONFIG[status].hours;
  };

  const handleCellClick = (empId: string, day: number) => {
    const key = getAttendanceKey(empId, day);
    const current = attendance[key];
    
    let next: string | undefined;
    
    if (!current) {
      next = STATUS_ORDER[0]; // Start with 'Я'
    } else {
      const idx = STATUS_ORDER.indexOf(current);
      if (idx === -1 || idx === STATUS_ORDER.length - 1) {
        next = undefined; // Clear cell
      } else {
        next = STATUS_ORDER[idx + 1];
      }
    }

    setAttendance(prev => {
      const newAttendance = { ...prev };
      if (next) newAttendance[key] = next;
      else delete newAttendance[key];
      return newAttendance;
    });

    // Reset custom hours when status changes
    setAttendanceHours(prev => {
      const newHours = { ...prev };
      delete newHours[key];
      return newHours;
    });
  };

  const handleHoursChange = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 24) {
      setAttendanceHours(prev => ({ ...prev, [key]: num }));
    } else if (value === '') {
       // If empty, removing custom hours will revert to default in getActualHours, 
       // but strictly speaking we might want to allow 0. 
       // Let's assume empty input means "reset to default" or 0 if we want strict.
       // For better UX, let's keep it in state even if 0.
       setAttendanceHours(prev => ({ ...prev, [key]: 0 }));
    }
  };

  const calculateStats = (empId: string) => {
    let totalDays = 0;
    let totalHours = 0;
    
    days.forEach(d => {
      const key = getAttendanceKey(empId, d);
      const val = attendance[key];
      if (val && STATUS_CONFIG[val]) {
        const hours = getActualHours(key, val);
        if (hours > 0) {
          totalDays++;
          totalHours += hours;
        }
      }
    });
    return { totalDays, totalHours };
  };

  const loadFont = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load font from ${url}`);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Font loading error:", error);
      throw error;
    }
  };

  const formatShortName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      const surname = parts[0];
      const nameInitial = parts[1] ? parts[1][0] + '.' : '';
      const patronymicInitial = parts.length > 2 ? parts[2][0] + '.' : '';
      return `${nameInitial}${patronymicInitial} ${surname}`;
    }
    return fullName;
  };

  const generatePDF = async (empIds: string[]) => {
    if (empIds.length === 0) return;
    
    setIsExporting(true);
    setExportProgress('Загрузка шрифтов...');

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      
      const fontRegularUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf';
      const fontMediumUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf';
      
      const [fontBase64Regular, fontBase64Medium] = await Promise.all([
        loadFont(fontRegularUrl),
        loadFont(fontMediumUrl)
      ]);
      
      doc.addFileToVFS('Roboto-Regular.ttf', fontBase64Regular);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.addFileToVFS('Roboto-Medium.ttf', fontBase64Medium);
      doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');
      doc.setFont('Roboto', 'normal');

      setExportProgress('Генерация страниц...');

      const selectedEmpsData = INITIAL_EMPLOYEES.filter(e => empIds.includes(e.id));
      const isSingleEmployee = selectedEmpsData.length === 1;
      const singleEmp = isSingleEmployee ? selectedEmpsData[0] : null;

      const uniqueDepts = Array.from(new Set(selectedEmpsData.map(e => e.department)));
      const headerDepartment = isSingleEmployee 
        ? singleEmp!.department 
        : (uniqueDepts.length === 1 ? uniqueDepts[0] : "Сводный отчет");

      const headerPosition = isSingleEmployee ? singleEmp!.position : "По списку";
      const headerId = isSingleEmployee ? singleEmp!.id : "---";

      doc.setFontSize(14);
      doc.setFont('Roboto', 'bold');
      doc.text("ООО «РК-ГРАНД»", 14, 15);
      
      doc.setFontSize(10);
      doc.setFont('Roboto', 'normal');
      doc.text("ЦЕЛЛЮЛОЗНЫЙ ЗАВОД Г. ПИТКЯРАНТА", 14, 20);
      
      doc.setFontSize(9);
      doc.text("ИНН: 7728646908 / ОГРН: 1087746182050", 283, 15, { align: 'right' });
      doc.text("г. Питкяранта, о. Пусунсаари, д. 1", 283, 19, { align: 'right' });
      doc.text("+7 (814) 33-12-34", 283, 23, { align: 'right' });
      
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.line(14, 26, 283, 26);

      doc.setFontSize(16);
      doc.setFont('Roboto', 'bold');
      doc.text("ТАБЕЛЬ УЧЕТА РАБОЧЕГО ВРЕМЕНИ", 148, 36, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setLineWidth(0.3);
      doc.rect(130, 40, 36, 10);
      doc.text(`${MONTHS[month]} ${year}`, 148, 46.5, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('Roboto', 'normal');
      doc.text("Подразделение:", 14, 60);
      doc.text("Должность:", 60, 60);
      doc.text("Табельный номер:", 283, 60, { align: 'right' });
      
      doc.setFont('Roboto', 'bold');
      doc.text(headerDepartment, 14, 65);
      doc.text(headerPosition, 60, 65);
      doc.text(headerId, 283, 65, { align: 'right' });

      const tableHead = [
        [
          { content: 'Фамилия И.О.', styles: { halign: 'left', valign: 'middle', fillColor: [240, 240, 240] } },
          ...days.map(d => ({ content: d.toString(), styles: { halign: 'center', minCellWidth: 6, fillColor: [240, 240, 240] } })),
          { content: 'Дни', styles: { halign: 'center', valign: 'middle', fillColor: [240, 240, 240] } },
          { content: 'Часы', styles: { halign: 'center', valign: 'middle', fillColor: [240, 240, 240] } }
        ]
      ];

      const tableBody: any[] = [];

      selectedEmpsData.forEach(emp => {
        const row1Cells: any[] = [];
        const row2Cells: any[] = [];
        let totalDays = 0;
        let totalHours = 0;

        days.forEach(d => {
          const key = getAttendanceKey(emp.id, d);
          const val = attendance[key];
          
          let code = '';
          let hoursStr = '';
          
          if (val && STATUS_CONFIG[val]) {
            code = val;
            const h = getActualHours(key, val);
            // Only show hours for statuses that have hours
            hoursStr = (STATUS_CONFIG[val].hours > 0 || h > 0) ? h.toString() : '';
            
            if (h > 0) {
              totalDays++;
              totalHours += h;
            }
          }
          
          row1Cells.push({ content: code, styles: { halign: 'center', valign: 'middle' } });
          row2Cells.push({ content: hoursStr, styles: { halign: 'center', valign: 'middle', fontSize: 7, textColor: [100, 100, 100] } });
        });

        const nameCellContent = isSingleEmployee ? emp.fullName : `${emp.fullName}\n${emp.position}`;

        tableBody.push([
           { content: nameCellContent, rowSpan: 2, styles: { valign: 'middle', fontStyle: 'bold' } },
           ...row1Cells,
           { content: totalDays.toString(), rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
           { content: totalHours.toString(), rowSpan: 2, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } }
        ]);
        tableBody.push(row2Cells);
      });

      autoTable(doc, {
        startY: 70,
        head: tableHead,
        body: tableBody,
        styles: {
          font: 'Roboto', 
          fontStyle: 'normal',
          fontSize: 8,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          cellPadding: 1
        },
        headStyles: { fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] },
        theme: 'plain' 
      });

      let signatureY = (doc as any).lastAutoTable.finalY + 20;
      if (signatureY > 160) {
        doc.addPage();
        signatureY = 40; 
      }

      doc.setFontSize(8);
      doc.setFont('Roboto', 'bold');
      
      doc.text("СПЕЦИАЛИСТ, ПОДГОТОВИВШИЙ ТАБЕЛЬ:", 14, signatureY);
      doc.setLineWidth(0.2);
      doc.line(75, signatureY, 125, signatureY); 
      doc.setFont('Roboto', 'normal');
      doc.text(formatShortName("Минигулова Юлия Ивановна"), 130, signatureY); 
      doc.setFontSize(6);
      doc.setTextColor(150);
      doc.text("подпись", 90, signatureY + 5); 
      doc.text("расшифровка подписи (Ф.И.О.)", 130, signatureY + 5);

      doc.setFontSize(8);
      doc.setTextColor(0);
      doc.setFont('Roboto', 'bold');
      doc.text("С ТАБЕЛЕМ ОЗНАКОМЛЕН (РАБОТНИК):", 160, signatureY); 
      doc.line(225, signatureY, 260, signatureY); 
      doc.setFont('Roboto', 'normal');
      
      const firstEmpName = isSingleEmployee ? singleEmp!.fullName : "Иванов Иван Иванович";
      doc.text(formatShortName(firstEmpName), 283, signatureY, { align: 'right' });
      doc.setFontSize(6);
      doc.setTextColor(150);
      doc.text("подпись", 235, signatureY + 5);
      doc.text("расшифровка подписи (Ф.И.О.)", 283, signatureY + 5, { align: 'right' });

      doc.setFontSize(7);
      doc.setTextColor(180);
      doc.text("Система электронного табелирования «РК-Гранд»", 14, 195);
      doc.text(`Дата формирования: ${new Date().toLocaleDateString('ru-RU')}`, 283, 195, { align: 'right' });

      const monthStr = (month + 1).toString().padStart(2, '0');
      let fileName = `Tabel_Svodniy_${monthStr}_${year}.pdf`;
      if (isSingleEmployee) {
        const nameFormatted = singleEmp!.fullName.replace(/ /g, '_');
        fileName = `${nameFormatted}_${monthStr}_${year}.pdf`;
      }

      doc.save(fileName);
      setIsExporting(false);
      setExportProgress('');
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 4000);
      
    } catch (error) {
      console.error(error);
      setIsExporting(false);
      setExportProgress('');
      alert('Ошибка генерации PDF. Не удалось загрузить кириллический шрифт.');
    }
  };

  const toggleEmployeeSelection = (id: string) => {
    setSelectedEmployeesForExport(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredEmployeesForExport = INITIAL_EMPLOYEES.filter(e => 
    e.fullName.toLowerCase().includes(modalSearch.toLowerCase()) || 
    e.position.toLowerCase().includes(modalSearch.toLowerCase())
  );

  const filteredEmployeesForList = INITIAL_EMPLOYEES.filter(e => 
    e.fullName.toLowerCase().includes(listSearch.toLowerCase()) || 
    e.position.toLowerCase().includes(listSearch.toLowerCase())
  );

  const editingEmployee = INITIAL_EMPLOYEES.find(e => e.id === editingEmployeeId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Учет рабочего времени</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Заполнение табеля и расчет отработанных часов</p>
        </div>
        <div className="flex gap-3">
          <div className="relative" ref={datePickerRef}>
            <button 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
               <Calendar size={18} className="text-blue-500" />
               {MONTHS[month]} {year}
               <ChevronDown size={14} className="opacity-50" />
            </button>
            {isDatePickerOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-4 z-50 w-64 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setYear(year - 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronLeft size={16}/></button>
                  <span className="font-black text-slate-800 dark:text-white">{year}</span>
                  <button onClick={() => setYear(year + 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronRight size={16}/></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((m, idx) => (
                    <button 
                      key={m}
                      onClick={() => { setMonth(idx); setIsDatePickerOpen(false); }}
                      className={`text-[10px] font-bold py-2 rounded-lg transition-colors ${month === idx ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => {
              setSelectedEmployeesForExport(INITIAL_EMPLOYEES.map(e => e.id));
              setIsBatchExportModalOpen(true);
            }}
            disabled={isExporting}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
              isExporting ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
            }`}
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? (exportProgress || 'Генерация...') : 'Массовая выгрузка'}
          </button>
        </div>
      </div>

      {showExportSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-3xl flex items-center gap-4 text-emerald-700 dark:text-emerald-400 animate-in slide-in-from-top-4 shadow-xl shadow-emerald-900/5">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle size={22} className="text-emerald-500" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block">Табель успешно сформирован!</span>
            <p className="text-xs opacity-70">Файл PDF с поддержкой кириллицы скачан.</p>
          </div>
        </div>
      )}

      {/* Main List View */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
           <Search className="text-slate-400 dark:text-slate-600" size={20} />
           <input 
             type="text" 
             placeholder="Поиск сотрудника..." 
             className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 dark:text-slate-200 w-full placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none"
             value={listSearch}
             onChange={(e) => setListSearch(e.target.value)}
           />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest w-1/3">Сотрудник</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Отработано дней</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Всего часов</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredEmployeesForList.map(emp => {
                const { totalDays, totalHours } = calculateStats(emp.id);
                return (
                  <tr 
                    key={emp.id} 
                    onClick={() => setEditingEmployeeId(emp.id)}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{emp.fullName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-600 truncate uppercase font-black tracking-widest mt-0.5">{emp.position}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-black text-slate-700 dark:text-slate-300">
                        <Calendar size={14} className="text-slate-400" /> {totalDays}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                       <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm font-black text-blue-700 dark:text-blue-300">
                        {totalHours} ч.
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:underline">
                         Заполнить табель &rarr;
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED MODAL */}
      {editingEmployeeId && editingEmployee && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-right-full duration-300">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setEditingEmployeeId(null)} 
                 className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-bold"
               >
                 <ArrowLeft size={18} /> Назад к списку
               </button>
               <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
               <div>
                  <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-none">{editingEmployee.fullName}</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">{editingEmployee.department} • {editingEmployee.position}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-4 mr-4 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Отработано дней: <span className="text-slate-900 dark:text-white font-black">{calculateStats(editingEmployee.id).totalDays}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Всего часов: <span className="text-slate-900 dark:text-white font-black">{calculateStats(editingEmployee.id).totalHours}</span>
                  </div>
               </div>
               
               <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-orange-900/20">
                 <Bell size={16} /> Оповестить работника
               </button>
               <button 
                  onClick={() => generatePDF([editingEmployee.id])}
                  disabled={isExporting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
               >
                 {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} 
                 Скачать / Печать
               </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 p-6">
            <div className="max-w-[95vw] mx-auto space-y-6">
              <div className="flex items-center gap-2 mb-2">
                 <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{MONTHS[month]} {year}</span>
              </div>

              {/* Scrollable Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="min-w-max">
                     <div className="grid" style={{ gridTemplateColumns: `100px repeat(${days.length}, 48px)` }}>
                        {/* Header Row */}
                        <div className="sticky left-0 bg-slate-100 dark:bg-slate-800 p-3 text-xs font-black uppercase text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700 z-10 flex items-center justify-center">
                          День
                        </div>
                        {days.map(d => (
                          <div key={d} className={`p-3 text-center text-sm font-bold border-b border-r border-slate-100 dark:border-slate-800 ${[0, 6].includes(new Date(year, month, d).getDay()) ? 'bg-red-50 dark:bg-red-900/10 text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                            {d}
                          </div>
                        ))}

                        {/* Status Row */}
                        <div className="sticky left-0 bg-white dark:bg-slate-900 p-3 text-xs font-black uppercase text-slate-500 dark:text-slate-400 border-b border-r border-slate-200 dark:border-slate-700 z-10 flex items-center justify-center">
                          Отметка
                        </div>
                        {days.map(d => {
                          const key = getAttendanceKey(editingEmployee.id, d);
                          const val = attendance[key];
                          const config = val ? STATUS_CONFIG[val] : null;
                          
                          return (
                            <div 
                              key={d} 
                              onClick={() => handleCellClick(editingEmployee.id, d)}
                              className={`h-14 border-b border-r border-slate-100 dark:border-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none ${config ? config.bg : ''}`}
                            >
                              {config ? (
                                <span className={`text-sm font-black ${config.color}`}>{val}</span>
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800"></span>
                              )}
                            </div>
                          );
                        })}

                        {/* Hours Row */}
                        <div className="sticky left-0 bg-white dark:bg-slate-900 p-3 text-xs font-black uppercase text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 z-10 flex items-center justify-center">
                          Часы
                        </div>
                        {days.map(d => {
                          const key = getAttendanceKey(editingEmployee.id, d);
                          const val = attendance[key];
                          const hours = getActualHours(key, val);
                          const config = val ? STATUS_CONFIG[val] : null;
                          const isEditable = config?.editable;

                          return (
                            <div 
                              key={d} 
                              className={`h-10 border-r border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs transition-colors ${isEditable ? 'cursor-text hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''}`}
                              onClick={() => {
                                if (isEditable) setEditingHoursCell(key);
                              }}
                            >
                              {editingHoursCell === key ? (
                                <input
                                  ref={hoursInputRef}
                                  type="number"
                                  min="0"
                                  max="24"
                                  value={hours}
                                  onChange={(e) => handleHoursChange(key, e.target.value)}
                                  onBlur={() => setEditingHoursCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setEditingHoursCell(null);
                                  }}
                                  className="w-full h-full text-center bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-bold focus:outline-none"
                                />
                              ) : (
                                <span className={val && isEditable ? 'text-slate-700 dark:text-slate-300 font-bold' : 'text-slate-400'}>
                                  {val ? hours : '-'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                     </div>
                  </div>
                </div>
                
                {/* Scrollbar Style Injection */}
                <style>{`
                  .custom-scrollbar::-webkit-scrollbar { height: 12px; }
                  .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
                  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; border: 3px solid #f1f5f9; }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                  .dark .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
                  .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border: 3px solid #0f172a; }
                `}</style>
              </div>

              {/* Legend */}
              <div className="mt-8">
                 <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Легенда:</h4>
                 <div className="flex flex-wrap gap-3">
                    {Object.entries(STATUS_CONFIG).map(([code, conf]) => (
                      <div key={code} className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 ${conf.bg}`}>
                         <span className={`font-black ${conf.color}`}>{code}</span>
                         <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">- {conf.label} ({code})</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Export Modal */}
      {isBatchExportModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center"><Download size={20} /></div>
                <div>
                  <h3 className="font-black text-xl text-slate-800 dark:text-white tracking-tight leading-none">Экспорт табелей</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Выберите сотрудников для выгрузки</p>
                </div>
              </div>
              <button onClick={() => setIsBatchExportModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="px-8 pt-6 pb-2 shrink-0">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Поиск по списку..." 
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/10 transition-all"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedEmployeesForExport(INITIAL_EMPLOYEES.map(e => e.id))}
                    className="px-4 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Все
                  </button>
                  <button 
                    onClick={() => setSelectedEmployeesForExport([])}
                    className="px-4 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    Снять
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center px-2 py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Выбрано: {selectedEmployeesForExport.length} из {INITIAL_EMPLOYEES.length}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-2 space-y-2">
              {filteredEmployeesForExport.length > 0 ? filteredEmployeesForExport.map(emp => (
                <div 
                  key={emp.id} 
                  onClick={() => toggleEmployeeSelection(emp.id)}
                  className={`flex items-center gap-4 p-4 rounded-3xl border transition-all cursor-pointer group ${
                    selectedEmployeesForExport.includes(emp.id) 
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    selectedEmployeesForExport.includes(emp.id) 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'border-slate-200 dark:border-slate-700 text-transparent'
                  }`}>
                    <Check size={14} strokeWidth={4} />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black text-xs shrink-0">
                    {emp.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-black truncate leading-tight ${selectedEmployeesForExport.includes(emp.id) ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>{emp.fullName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{emp.position}</p>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                  Сотрудники не найдены
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsBatchExportModalOpen(false)} 
                  className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Отмена
                </button>
                <button 
                  onClick={() => {
                    setIsBatchExportModalOpen(false);
                    generatePDF(selectedEmployeesForExport);
                  }}
                  disabled={selectedEmployeesForExport.length === 0}
                  className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-[20px] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  <Download size={18} />
                  Скачать PDF ({selectedEmployeesForExport.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTrackingModule;
