import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Button, Card, Input, Select } from '../components/ui';
import { ChevronLeft, FileBarChart, Copy, Search, Printer, Check } from 'lucide-react';
import { safeArray, printSection, normalizeStatus } from '../utils';
import { format, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ReportsScreen({ onBack }: { onBack: () => void }) {
  const { state, getActiveProfile } = useAppStore();
  const profile = getActiveProfile();

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'completo' | 'comportamental' | 'terapias' | 'rotina'>('completo');
  
  const [copied, setCopied] = useState(false);

  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  
  const inRange = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d >= start && d <= end;
  };

  const periodCrises = safeArray(state.crises).filter(c => c.childId === profile.id && inRange(c.date)).sort((a,b) => a.date.localeCompare(b.date));
  const periodDiary = safeArray(state.diaryEntries).filter(d => d.childId === profile.id && inRange(d.date)).sort((a,b) => a.date.localeCompare(b.date));
  const periodSessions = safeArray(state.therapySessions).filter(ts => ts.childId === profile.id && inRange(ts.date));
  const periodAppointments = safeArray(state.appointments).filter(a => a.childId === profile.id && inRange(a.date));
  const routineItems = safeArray(state.routineItems).filter(r => r.childId === profile.id);
  const periodMeds = safeArray(state.medications).filter(m => m.childId === profile.id);
  const periodDocs = safeArray(state.documents).filter(d => d.childId === profile.id && inRange(d.date)).sort((a,b) => a.date.localeCompare(b.date));
  
  // Calculate routine stats
  let totalRoutineCount = 0;
  let totalCompletedRoutineCount = 0;
  let perfectDays = 0;
  let incompleteDays = 0;
  const daysInInterval = eachDayOfInterval({ start, end });
  
  if (routineItems.length > 0) {
     daysInInterval.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        let completedToday = 0;
        routineItems.forEach(item => {
           totalRoutineCount++;
           const dates = Array.isArray(item.completedDates) ? item.completedDates : (item.completedAt && item.completedAt.startsWith(dayStr) ? [dayStr] : []);
           if (dates.includes(dayStr)) {
              completedToday++;
              totalCompletedRoutineCount++;
           }
        });
        if (completedToday === routineItems.length) {
           perfectDays++;
        } else {
           incompleteDays++;
        }
     });
  }
  
  const routineOverallPercent = totalRoutineCount > 0 ? Math.round((totalCompletedRoutineCount / totalRoutineCount) * 100) : 0;

  type UnifiedSession = { date: string, time: string, title?: string, type: string, professional: string, status: string, notes?: string, isAppointment: boolean };
  const allSessionsAndAppointments: UnifiedSession[] = [
    ...periodSessions.map(ts => {
      const therapy = safeArray(state.therapies).find(th => th.id === ts.therapyId);
      return {
        date: ts.date,
        time: ts.time,
        title: therapy?.type || 'Terapia',
        type: therapy?.type || 'Terapia',
        professional: therapy?.professionalName || 'Profissional',
        status: normalizeStatus(ts.status),
        notes: ts.notes,
        isAppointment: false
      };
    }),
    ...periodAppointments.map(a => ({
      date: a.date,
      time: a.time,
      title: a.title,
      type: a.type || 'Consulta',
      professional: a.professionalName,
      status: normalizeStatus(a.status),
      notes: a.notes,
      isAppointment: true
    }))
  ].sort((a, b) => {
    const timeA = new Date(`${a.date}T${a.time || '00:00'}`);
    const timeB = new Date(`${b.date}T${b.time || '00:00'}`);
    return timeA.getTime() - timeB.getTime();
  });

  const sessionsCounts = allSessionsAndAppointments.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const validRealizadas = sessionsCounts['Realizada'] || 0;
  const validFaltas = sessionsCounts['Falta'] || 0;
  const totalValidosParaAssiduidade = validRealizadas + validFaltas;
  const assiduidadePercentual = totalValidosParaAssiduidade > 0 
      ? Math.round((validRealizadas / totalValidosParaAssiduidade) * 100)
      : null;

  const totalSessoes = allSessionsAndAppointments.length;

  const handlePrint = () => {
    if (!profile.name) {
      alert('Selecione ou cadastre uma criança primeiro.');
      return;
    }
    if (periodCrises.length === 0 && periodDiary.length === 0 && periodSessions.length === 0 && routineItems.length === 0) {
      alert('Não encontramos registros para esse período.');
      return;
    }
    printSection('print-report', 'Relatório Agenda Azul');
  };

  const generateReportText = () => {
     let text = `RELATÓRIO: ${profile.name || 'Criança'}\n`;
     text += `Período: ${format(start, 'dd/MM/yyyy')} a ${format(end, 'dd/MM/yyyy')}\n`;
     text += `Tipo: ${reportType.toUpperCase()}\n\n`;

     text += `--- RESUMO GERAL ---\n`;
     text += `Total de Compromissos (Terapias/Consultas): ${totalSessoes}\n`;
     text += `Realizadas: ${sessionsCounts['Realizada'] || 0}\n`;
     text += `Faltas: ${sessionsCounts['Falta'] || 0}\n`;
     text += `Canceladas: ${sessionsCounts['Cancelada'] || 0}\n`;
     text += `Remarcadas: ${sessionsCounts['Remarcada'] || 0}\n`;
     text += `Agendadas: ${sessionsCounts['Agendada'] || 0}\n`;
     if (assiduidadePercentual !== null) {
        text += `Percentual de Assiduidade: ${assiduidadePercentual}%\n`;
     } else {
        text += `Percentual de Assiduidade: Sem dados suficientes para calcular assiduidade.\n`;
     }
     text += `Total de crises: ${periodCrises.length}\n`;
     text += `Total de registros no diário: ${periodDiary.length}\n\n`;

     if (reportType === 'completo' || reportType === 'rotina') {
        text += `--- ROTINA E AUTONOMIA ---\n`;
        text += `Assiduidade média diária: ${routineOverallPercent}%\n`;
        text += `Dias concluídos 100%: ${perfectDays}\n`;
        text += `Dias incompletos: ${incompleteDays}\n\n`;
     }

     if (reportType === 'completo' || reportType === 'terapias') {
        text += `--- TERAPIAS E CONSULTAS (${allSessionsAndAppointments.length}) ---\n`;
        if (allSessionsAndAppointments.length === 0) text += "Nenhuma terapia ou consulta no período.\n";
        allSessionsAndAppointments.forEach(s => {
           let theTime = s.time ? s.time : '--:--';
           text += `- ${format(new Date(s.date+'T12:00:00'), 'dd/MM/yyyy')} ${theTime} | ${s.title} com ${s.professional} | Status: ${s.status}\n`;
           if (s.notes) text += `  Obs: ${s.notes}\n`;
        });
        text += `\n`;
     }

     if (reportType === 'completo' || reportType === 'comportamental') {
        text += `--- CRISES (${periodCrises.length}) ---\n`;
        if (periodCrises.length === 0) {
           text += "Nenhuma crise registrada no período.\n";
        } else {
           periodCrises.forEach(c => {
              let t = c.time || '12:00';
              let dtStr = c.date + 'T' + t;
              let dObj = new Date(dtStr);
              if (isNaN(dObj.getTime())) dObj = new Date(c.date+'T12:00:00'); 
              text += `- ${format(dObj, "dd/MM/yyyy 'às' HH:mm")} | Int: ${c.intensity || 'Não informado'} | Dura. ${c.durationMins || 'S/ registro'} mins\n`;
              if (c.trigger) text += `  Gatilho: ${c.trigger || 'S/ registro'}\n`;
              if (c.description) text += `  Comport.: ${c.description || 'S/ registro'}\n`;
              if (c.resolution) text += `  Resolução: ${c.resolution}\n`;
           });
        }
        text += `\n`;

        text += `--- DIÁRIO (${periodDiary.length}) ---\n`;
        if (periodDiary.length === 0) text += "Nenhum registro no diário.\n";
        periodDiary.forEach(d => {
           text += `- ${format(new Date(d.date+'T12:00:00'), 'dd/MM/yyyy')}:\n`;
           text += `  Alimentação: ${d.food || 'S/ registro'}\n`;
           text += `  Sono: ${d.sleep || 'S/ registro'}\n`;
           text += `  Comportamento: ${d.behavior || 'S/ registro'}\n`;
        });
        text += `\n`;
     }
     
     if (reportType === 'completo') {
        text += `--- MEDICAMENTOS (${periodMeds.length}) ---\n`;
        if (periodMeds.length === 0) text += "Nenhum medicamento listado.\n";
        periodMeds.forEach(m => {
           text += `- ${m.name} | Dose: ${m.dosage} | Horários: ${m.times.join(', ')}\n`;
        });
        text += `\n`;

        text += `--- DOCUMENTOS (${periodDocs.length}) ---\n`;
        if (periodDocs.length === 0) text += "Nenhum documento registrado no período.\n";
        periodDocs.forEach(d => {
           text += `- ${format(new Date(d.date+'T12:00:00'), 'dd/MM/yyyy')} | ${d.type}: ${d.title}\n`;
        });
        text += `\n`;
     }

     return text;
  };

  const handleCopy = () => {
     navigator.clipboard.writeText(generateReportText());
     setCopied(true);
     setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen pb-32 max-w-lg mx-auto print:bg-white print:p-0 print:min-h-0">
      <div className="bg-white px-5 pt-4 pb-2 shadow-sm flex items-center justify-between sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onBack} className="p-1 -ml-2 text-stone-500">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#4a5568]">Relatórios</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Extrair dados em texto</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6 print:hidden">
         <Card className="p-5 space-y-4 shadow-sm border-blue-50">
           <div className="flex items-center gap-3 text-blue-600 mb-2">
              <FileBarChart className="w-6 h-6" />
              <h2 className="font-bold">Gerar Relatório</h2>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <Input type="date" label="Data Inicial" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <Input type="date" label="Data Final" value={endDate} onChange={e => setEndDate(e.target.value)} />
           </div>

           <Select label="Tipo de Relatório" value={reportType} onChange={(e) => setReportType(e.target.value as any)} 
              options={[
                 {label: 'Relatório Completo', value: 'completo'},
                 {label: 'Rotina e Autonomia', value: 'rotina'},
                 {label: 'Apenas Comportamental (Crises, Sono)', value: 'comportamental'},
                 {label: 'Apenas Terapias (Assiduidade)', value: 'terapias'}
              ]}
           />
           
           <div className="flex gap-3 pt-2">
              <Button onClick={handlePrint} className="flex-1 bg-stone-800 text-white flex items-center justify-center gap-2">
                 <Printer className="w-4 h-4" /> PDF / Imprimir
              </Button>
              <Button onClick={handleCopy} variant="outline" className="flex-1 flex items-center justify-center gap-2">
                 {copied ? <><Check className="w-4 h-4 text-emerald-500"/> Copiado</> : <><Copy className="w-4 h-4" /> Texto </>}
              </Button>
           </div>
         </Card>
      </div>

      {/* Print Preview Area */}
      {periodCrises.length === 0 && periodDiary.length === 0 && allSessionsAndAppointments.length === 0 && routineItems.length === 0 ? (
        <div className="mx-5 bg-white p-6 shadow-sm border border-gray-100 text-center text-gray-500 print:hidden">
          <p>Não encontramos registros para esse período.</p>
        </div>
      ) : (
      <div id="print-report" className="report-print-area mx-5 bg-white p-6 shadow-sm border border-gray-100 print:m-0 print:border-none print:shadow-none print:p-4 text-justify">
         <div className="text-center mb-8 border-b pb-6 flex flex-col items-center">
            {profile.photoData || profile.photoUrl ? (
               <img src={profile.photoData || profile.photoUrl} alt="Paciente" className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-gray-200" />
            ) : null}
            <h1 className="text-2xl font-bold text-gray-800 mb-1">RELATÓRIO DE ACOMPANHAMENTO</h1>
            <h2 className="text-lg font-bold text-gray-600 uppercase mb-3">Paciente: {profile.name || 'Não informado'}</h2>
            <div className="inline-flex gap-4 text-xs font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
               <span>Início: {format(start, 'dd/MM/yyyy')}</span>
               <span>Término: {format(end, 'dd/MM/yyyy')}</span>
            </div>
         </div>

         <div className="mb-10">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">
               <span className="w-2 h-2 rounded-full bg-slate-800"></span>
               Resumo Geral
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
               <div className="bg-slate-50 text-slate-800 p-4 rounded-xl text-center font-bold">
                  <div className="text-2xl">{totalSessoes}</div>
                  <div className="text-[10px] uppercase opacity-70 mt-1">Sessões / Consultas</div>
               </div>
               <div className="bg-slate-50 text-slate-800 p-4 rounded-xl text-center font-bold">
                  <div className="text-2xl">{periodCrises.length}</div>
                  <div className="text-[10px] uppercase opacity-70 mt-1">Crises Registradas</div>
               </div>
               <div className="bg-slate-50 text-slate-800 p-4 rounded-xl text-center font-bold">
                  <div className="text-2xl">{periodDiary.length}</div>
                  <div className="text-[10px] uppercase opacity-70 mt-1">Registros no Diário</div>
               </div>
               <div className="bg-slate-50 text-slate-800 p-4 rounded-xl text-center font-bold">
                  <div className="text-2xl">{assiduidadePercentual !== null ? `${assiduidadePercentual}%` : '-'}</div>
                  <div className="text-[10px] uppercase opacity-70 mt-1">Assiduidade Geral</div>
               </div>
            </div>
         </div>

         {(reportType === 'completo' || reportType === 'terapias') && (
            <div className="mb-10">
               <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Terapias e Consultas ({allSessionsAndAppointments.length})
               </h3>
               
               <div className="flex flex-wrap gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2 font-medium"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Realizadas: {sessionsCounts['Realizada'] || 0}</div>
                  <div className="flex items-center gap-2 font-medium"><span className="w-3 h-3 rounded-full bg-red-500"></span> Faltas: {sessionsCounts['Falta'] || 0}</div>
                  <div className="flex items-center gap-2 font-medium text-stone-500"><span className="w-3 h-3 rounded-full bg-stone-500"></span> Canceladas: {sessionsCounts['Cancelada'] || 0}</div>
                  <div className="flex items-center gap-2 font-medium text-orange-500"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Remarcadas: {sessionsCounts['Remarcada'] || 0}</div>
                  <div className="flex items-center gap-2 font-medium text-blue-500"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Agendadas: {sessionsCounts['Agendada'] || 0}</div>
               </div>

               {allSessionsAndAppointments.length > 0 ? (
                 <div className="space-y-3">
                   {allSessionsAndAppointments.map((s, idx) => {
                     const isRealizada = s.status === 'Realizada';
                     const isFalta = s.status === 'Falta';
                     const tagColor = isRealizada ? 'bg-emerald-100 text-emerald-800' : isFalta ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700';

                     return (
                       <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                             <p className="font-bold text-gray-800 text-sm">
                                {format(new Date(s.date+'T12:00:00'), 'dd/MM/yyyy')} {s.time ? `às ${s.time}` : ''} • {s.title}
                             </p>
                             <p className="text-xs text-gray-500 mt-0.5">Profissional: {s.professional}{s.notes ? ` • Obs: ${s.notes}` : ''}</p>
                          </div>
                          <div className={`mt-2 sm:mt-0 self-start sm:self-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${tagColor}`}>
                             {s.status}
                          </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <p className="text-sm text-gray-500 italic">Nenhuma sessão ou consulta registrada.</p>
               )}
            </div>
         )}

         {(reportType === 'completo' || reportType === 'rotina') && (
            <div className="mb-10">
               <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Rotina e Autonomia
               </h3>
               <div className="flex gap-4">
                  <div className="bg-amber-50 text-amber-800 p-4 rounded-xl flex-1 text-center font-bold">
                     <div className="text-2xl">{routineOverallPercent}%</div>
                     <div className="text-[10px] uppercase opacity-70 mt-1">Conclusão Média</div>
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl flex-1 text-center font-bold">
                     <div className="text-2xl">{perfectDays}</div>
                     <div className="text-[10px] uppercase opacity-70 mt-1">Dias Completos</div>
                  </div>
                  <div className="bg-orange-50 text-orange-800 p-4 rounded-xl flex-1 text-center font-bold">
                     <div className="text-2xl">{incompleteDays}</div>
                     <div className="text-[10px] uppercase opacity-70 mt-1">Dias Incompletos</div>
                  </div>
               </div>
            </div>
         )}

         {(reportType === 'completo' || reportType === 'comportamental') && (
            <div className="mb-10">
               <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Histórico de Crises ({periodCrises.length})
               </h3>
               {periodCrises.length > 0 ? (
                 <div className="space-y-4">
                    {periodCrises.map(c => {
                       let t = c.time || '12:00';
                       let dtStr = c.date + 'T' + t;
                       let dObj = new Date(dtStr);
                       if (isNaN(dObj.getTime())) dObj = new Date(c.date+'T12:00:00'); 
                       return (
                           <div key={c.id} className="text-sm bg-red-50/30 p-3 rounded-lg border border-red-50">
                              <p className="font-bold text-gray-800">
                                 {format(dObj, "dd/MM/yyyy 'às' HH:mm")} • 
                                 Intensidade: <span className={c.intensity === 'Forte' || c.intensity === 'Severa' ? 'text-red-600' : 'text-orange-500'}>{c.intensity || 'Não informado'}</span> • 
                                 Duração: {c.durationMins || 'S/ registro'} min
                              </p>
                              {c.trigger && <p className="text-gray-600 mt-1"><span className="font-semibold text-gray-700">Gatilho provável:</span> {c.trigger}</p>}
                              {c.description && <p className="text-gray-600"><span className="font-semibold text-gray-700">Comportamento/Estratégia:</span> {c.description}</p>}
                              {c.resolution && <p className="text-gray-600"><span className="font-semibold text-gray-700">Resolução:</span> {c.resolution}</p>}
                           </div>
                       );
                    })}
                 </div>
               ) : (
                 <p className="text-sm text-gray-500 italic">Nenhum registro de crise no período.</p>
               )}
            </div>
         )}

         {(reportType === 'completo' || reportType === 'comportamental') && (
            <div className="mb-10 block">
               <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Diário e Rotina ({periodDiary.length})
               </h3>
               {periodDiary.length > 0 ? (
                 <div className="space-y-5">
                    {periodDiary.map(d => (
                       <div key={d.id} className="text-sm bg-gray-50/50 p-3 rounded-lg">
                          <p className="font-bold text-gray-800 mb-2 underline decoration-indigo-200 decoration-2 underline-offset-4">
                             {format(new Date(d.date+'T12:00:00'), "dd/MM/yyyy")}
                          </p>
                          <div className="grid grid-cols-2 gap-4 mb-2">
                             <div><span className="font-semibold text-gray-600">Sono:</span> {d.sleep || 'Não preenchido'}</div>
                             <div><span className="font-semibold text-gray-600">Alimentação:</span> {d.food || 'Não preenchida'}</div>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-sm"><span className="font-semibold text-gray-600">Anotações/Comport.:</span> {d.behavior || 'Não preenchido'}</p>
                       </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-sm text-gray-500 italic">Nenhum registro diário no período.</p>
               )}
            </div>
         )}

         {reportType === 'completo' && (
            <div className="mb-10 block">
               <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  Medicamentos Ativos ({periodMeds.length})
               </h3>
               {periodMeds.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {periodMeds.map(m => (
                       <div key={m.id} className="text-sm bg-teal-50/30 p-3 rounded-lg border border-teal-50">
                          <p className="font-bold text-gray-800">{m.name}</p>
                          <p className="text-gray-600 mt-1"><span className="font-semibold">Dose:</span> {m.dosage}</p>
                          <p className="text-gray-600"><span className="font-semibold">Horários:</span> {m.times.join(', ') || 'Não informado'}</p>
                       </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-sm text-gray-500 italic">Nenhum medicamento ativo associado à criança.</p>
               )}
            </div>
         )}
         
         {reportType === 'completo' && (
            <div className="mb-10 block">
               <h3 className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Documentos Anexados no Período ({periodDocs.length})
               </h3>
               {periodDocs.length > 0 ? (
                 <div className="space-y-2">
                    {periodDocs.map(d => (
                       <div key={d.id} className="text-sm bg-yellow-50/50 p-2 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between">
                          <p className="font-bold text-gray-800">{format(new Date(d.date+'T12:00:00'), 'dd/MM/yyyy')} • {d.type}: {d.title}</p>
                       </div>
                    ))}
                 </div>
               ) : (
                 <p className="text-sm text-gray-500 italic">Nenhum documento anexado no período selecionado.</p>
               )}
            </div>
         )}

         <div className="mt-20 pt-8 border-t border-gray-300 text-center text-xs text-gray-400 font-medium">
            Gerado via Agenda Azul - Organizando a jornada da sua família. ({format(new Date(), 'dd/MM/yyyy HH:mm')})
         </div>
      </div>
      )}
    </div>
  );
}
