import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Card, Button, Input, Select, Textarea, SectionTitle, IconBubble } from '../components/ui';
import { Therapy, TherapySession, TherapyStatus, Appointment, AppointmentType, TherapyType } from '../types';
import { Plus, Clock, Search, ChevronLeft, ChevronRight, Check, Trash2, Calendar as CalIcon, MapPin, AlignLeft, Printer, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useFeedback } from '../components/FeedbackModal';
import { safeArray, printSection } from '../utils';

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const THERAPY_TYPES: TherapyType[] = ['Fonoaudiologia', 'Terapia Ocupacional', 'Psicologia', 'Psicopedagogia', 'Fisioterapia', 'ABA', 'Escola', 'Médico', 'Outro'];
const APPOINTMENT_TYPES: AppointmentType[] = ['Consulta médica', 'Exame', 'Retorno', 'Vacina', 'Reunião escolar', 'Evento livre'];
const STATUSES: TherapyStatus[] = ['Agendada', 'Realizada', 'Falta', 'Cancelada', 'Remarcada'];

export function TherapiesScreen() {
  const { state, getActiveProfile, addTherapy, updateTherapy, deleteTherapy, addTherapySession, updateTherapySession, deleteTherapySession, addAppointment, updateAppointment, deleteAppointment } = useAppStore();
  const profile = getActiveProfile();
  const { showError, FeedbackComponent } = useFeedback();
  
  const categories = safeArray(state.therapyCategories);
  const getCategory = (name: string) => categories.find(c => c.name === name) || { name, color: 'bg-indigo-500', icon: '📝' };

  const [modalType, setModalType] = useState<'recurrent' | 'unique' | 'selectType' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [deleteData, setDeleteData] = useState<{ id: string, name: string, type: 'therapy' | 'session' | 'appointment' } | null>(null);

  const [therapyForm, setTherapyForm] = useState<Partial<Therapy>>({});
  const [appointmentForm, setAppointmentForm] = useState<Partial<Appointment>>({});

  const therapies = safeArray(state.therapies).filter(t => t.childId === profile.id);
  const therapySessions = safeArray(state.therapySessions).filter(ts => ts.childId === profile.id);
  const appointments = safeArray(state.appointments).filter(a => a.childId === profile.id);

  const handleSaveTherapy = () => {
    if (!therapyForm.type || !therapyForm.professionalName) return showError('Atenção', 'Tipo e profissional são obrigatórios.');
    if (editingId) {
      updateTherapy(editingId, therapyForm);
    } else {
      addTherapy({
        id: crypto.randomUUID(),
        childId: profile.id,
        ...therapyForm as Therapy
      });
    }
    setModalType(null);
  };

  const handleSaveAppointment = () => {
    if (!appointmentForm.type || !appointmentForm.professionalName || !appointmentForm.date) return showError('Atenção', 'Tipo, data e profissional são obrigatórios.');
    if (editingId) {
      updateAppointment(editingId, appointmentForm);
    } else {
      addAppointment({
        id: crypto.randomUUID(),
        childId: profile.id,
        status: 'Agendada',
        ...appointmentForm as Appointment
      });
    }
    setModalType(null);
  };

  const handleEditTherapy = (t: Therapy) => {
    setTherapyForm(t);
    setEditingId(t.id);
    setModalType('recurrent');
  };

  const handleEditAppointment = (a: Appointment) => {
    setAppointmentForm(a);
    setEditingId(a.id);
    setModalType('unique');
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string, type: 'therapy' | 'session' | 'appointment') => {
    e.stopPropagation();
    setDeleteData({ id, name, type });
  };
  
  const confirmDelete = async () => {
     if (deleteData) {
        if (deleteData.type === 'therapy') deleteTherapy(deleteData.id);
        else if (deleteData.type === 'session') deleteTherapySession(deleteData.id);
        else if (deleteData.type === 'appointment') deleteAppointment(deleteData.id);
        setDeleteData(null);
        setModalType(null);
     }
  };

  const syncUsageWithStatusChange = (t: Therapy, oldStatus: TherapyStatus | undefined, newStatus: TherapyStatus) => {
     let newUsed = t.usedQuantity || 0;
     if (newStatus === 'Realizada' && oldStatus !== 'Realizada') newUsed++;
     else if (oldStatus === 'Realizada' && newStatus !== 'Realizada') newUsed = Math.max(0, newUsed - 1);
     if (t.authorizedQuantity && newUsed > t.authorizedQuantity) {
       showError('Atenção', 'A quantidade de sessões autorizadas foi atingida!');
       newUsed = t.authorizedQuantity; 
     }
     updateTherapy(t.id, { usedQuantity: newUsed });
  };

  const handleSessionAction = (t: Therapy, dateStr: string, newStatus: TherapyStatus) => {
    const existingSession = therapySessions.find(ts => ts.therapyId === t.id && ts.date === dateStr);
    if (existingSession) {
      const oldStatus = existingSession.status;
      updateTherapySession(existingSession.id, { status: newStatus });
      syncUsageWithStatusChange(t, oldStatus, newStatus);
    } else {
      addTherapySession({ id: crypto.randomUUID(), childId: profile.id, therapyId: t.id, date: dateStr, time: t.time, status: newStatus });
      syncUsageWithStatusChange(t, undefined, newStatus);
    }
  };

  const handleApptAction = (id: string, newStatus: TherapyStatus) => {
     updateAppointment(id, { status: newStatus });
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayOfWeek = getDay(selectedDate);
  
  const inRange = (t: Therapy, dateStr: string) => {
     if (t.startDate && dateStr < t.startDate) return false;
     if (t.endDate && dateStr > t.endDate) return false;
     return true;
  };

  const sessionsForSelectedDay = therapies.filter(t => t.dayOfWeek === selectedDayOfWeek && inRange(t, selectedDateStr)).map(t => {
     const explicitSession = therapySessions.find(ts => ts.therapyId === t.id && ts.date === selectedDateStr);
     return { therapy: t, session: explicitSession, currentStatus: explicitSession ? explicitSession.status : 'Agendada' };
  });

  const apptsForSelectedDay = appointments.filter(a => a.date === selectedDateStr);

  const openNew = () => {
    setModalType('selectType');
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-32 max-w-lg mx-auto">
      {/* Dynamic Screen Header */}
      <div className="bg-white px-5 py-4 border-b border-[#f1f3f7] flex items-center justify-between sticky top-0 z-30 print:hidden shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-[#2563eb]">Agenda do Filho</span>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Calendário & Eventos</h1>
        </div>
        {!modalType && (
          <div className="flex gap-2.5">
            <button 
              onClick={() => printSection('print-agenda', 'Agenda de Terapias e Compromissos')} 
              className="p-3 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-colors cursor-pointer"
              title="Imprimir Agenda"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button 
              onClick={openNew} 
              className="p-3 text-white bg-[#2563eb] hover:bg-blue-700 rounded-2xl shadow-md transition-colors cursor-pointer"
              title="Adicionar Novo"
            >
              <Plus className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-5 print:hidden">
        {modalType === 'selectType' && (
           <Card className="p-6 space-y-4 shadow-lg border border-[#2563eb]/10">
             <div className="flex justify-between items-center border-b pb-3 border-[#f1f3f7]">
               <h2 className="text-base font-extrabold text-[#1e293b]">Novo Agendamento</h2>
               <button onClick={() => setModalType(null)} className="text-slate-400 font-bold hover:text-slate-600">Fechar</button>
             </div>
             <div className="grid gap-3 pt-2">
               <button 
                 onClick={() => { setModalType('unique'); setEditingId(null); setAppointmentForm({ type: 'Consulta médica', date: selectedDateStr, time: '08:00' }); }} 
                 className="flex text-left items-center gap-3.5 p-4 bg-white border border-[#f1f3f7] rounded-3xl hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
               >
                  <IconBubble icon={<CalIcon name="calendar" />} variant="blue" size="md" />
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-800 group-hover:text-blue-700">Evento Único</h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">Consulta médica, exame, retorno, vacina...</p>
                  </div>
               </button>
               <button 
                 onClick={() => { setModalType('recurrent'); setEditingId(null); setTherapyForm({ type: 'Fonoaudiologia', dayOfWeek: selectedDayOfWeek, time: '08:00', startDate: selectedDateStr }); }} 
                 className="flex text-left items-center gap-3.5 p-4 bg-white border border-[#f1f3f7] rounded-3xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group"
               >
                  <IconBubble icon={<Clock name="clock" />} variant="emerald" size="md" />
                  <div>
                    <h3 className="font-extrabold text-xs text-[#0f766e] group-hover:text-emerald-700">Evento Recorrente</h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">Terapias semanais, psicologia, TO...</p>
                  </div>
               </button>
             </div>
             <div className="pt-2">
               <Button className="w-full text-xs font-bold" variant="outline" onClick={() => setModalType(null)}>Cancelar</Button>
             </div>
           </Card>
        )}

        {modalType === 'recurrent' && (
          <Card className="p-6 space-y-4 shadow-lg border border-[#e2e8f0]">
            <div className="flex justify-between items-center border-b pb-3 border-[#f1f3f7]">
              <h2 className="text-base font-extrabold text-slate-800">{editingId ? 'Editar Terapia' : 'Nova Terapia Recorrente'}</h2>
              {editingId && (
                <button onClick={(e) => handleDelete(e, editingId, therapyForm.type || '', 'therapy')} className="text-red-400 p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"><Trash2 className="w-5 h-5"/></button>
              )}
            </div>
            
            <Select label="Tipo de Terapia" value={therapyForm.type || ''} onChange={e => setTherapyForm({...therapyForm, type: e.target.value as any})} options={categories.map(c => ({label: `${c.icon} ${c.name}`, value: c.name}))} />
            <Input label="Profissional / Clínica" value={therapyForm.professionalName || ''} onChange={e => setTherapyForm({...therapyForm, professionalName: e.target.value})} placeholder="Ex: Dra. Ana" />
            <Input label="Local / Sala" value={therapyForm.location || ''} onChange={e => setTherapyForm({...therapyForm, location: e.target.value})} placeholder="Ex: Clínica Som e Voz - Sala 3" />
            
            <div className="grid grid-cols-2 gap-4">
               <Select label="Dia da Semana" value={therapyForm.dayOfWeek ?? 1} onChange={e => setTherapyForm({...therapyForm, dayOfWeek: parseInt(e.target.value)})} options={DAYS_OF_WEEK.map((d, i) => ({label: d, value: i.toString()}))} />
               <Input type="time" label="Horário" value={therapyForm.time || '08:00'} onChange={e => setTherapyForm({...therapyForm, time: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <Input type="date" label="Data Início" value={therapyForm.startDate || ''} onChange={e => setTherapyForm({...therapyForm, startDate: e.target.value})} />
               <Input type="date" label="Data Término" value={therapyForm.endDate || ''} onChange={e => setTherapyForm({...therapyForm, endDate: e.target.value})} />
            </div>

            <div className="pt-3 border-t mt-4 border-[#f1f3f7] space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Guia e Convênio</span>
              <Input label="Convênio / Plano de Saúde" value={therapyForm.insurance || ''} onChange={e => setTherapyForm({...therapyForm, insurance: e.target.value})} placeholder="Ex: Amil, Bradesco" />
              <Input label="Número de Autorização da Guia" value={therapyForm.guideNumber || ''} onChange={e => setTherapyForm({...therapyForm, guideNumber: e.target.value})} placeholder="Ex: G-8492-X" />
              <div className="grid grid-cols-2 gap-4">
                 <Input type="number" label="Qtd. Autorizada" value={therapyForm.authorizedQuantity?.toString() || ''} onChange={e => setTherapyForm({...therapyForm, authorizedQuantity: parseInt(e.target.value) || 0})} />
                 <Input type="number" label="Qtd. Utilizada" value={therapyForm.usedQuantity?.toString() || ''} onChange={e => setTherapyForm({...therapyForm, usedQuantity: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            <Textarea label="Observações de Terapia" value={therapyForm.notes || ''} onChange={e => setTherapyForm({...therapyForm, notes: e.target.value})} placeholder="Foco de trabalho, combinados especiais..." rows={3} />

            <div className="flex gap-3 pt-4 border-t border-[#f1f3f7]">
              <Button className="flex-1 text-xs" onClick={handleSaveTherapy}>Salvar Alterações</Button>
              <Button className="flex-1 text-xs" variant="outline" onClick={() => setModalType(null)}>Voltar</Button>
            </div>
          </Card>
        )}

        {modalType === 'unique' && (
          <Card className="p-6 space-y-4 shadow-lg border border-[#e2e8f0]">
            <div className="flex justify-between items-center border-b pb-3 border-[#f1f3f7]">
              <h2 className="text-base font-extrabold text-slate-800">{editingId ? 'Editar Evento Único' : 'Novo Evento Único'}</h2>
              {editingId && (
                <button onClick={(e) => handleDelete(e, editingId, appointmentForm.type || '', 'appointment')} className="text-red-400 p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"><Trash2 className="w-5 h-5"/></button>
              )}
            </div>
            
            <Select label="Tipo de Evento" value={appointmentForm.type || 'Consulta médica'} onChange={e => setAppointmentForm({...appointmentForm, type: e.target.value as any})} options={APPOINTMENT_TYPES.map(t => ({label: t, value: t}))} />
            <Input label="Título do Evento / Especialidade" value={appointmentForm.title || ''} onChange={e => setAppointmentForm({...appointmentForm, title: e.target.value})} placeholder="Ex: Dr. Paulo Albuquerque (Neuropediatra)" />
            <Input label="Profissional Responsável" value={appointmentForm.professionalName || ''} onChange={e => setAppointmentForm({...appointmentForm, professionalName: e.target.value})} />
            <Input label="Local de Atendimento" value={appointmentForm.location || ''} onChange={e => setAppointmentForm({...appointmentForm, location: e.target.value})} placeholder="Clínica, hospital ou endereço" />
            
            <div className="grid grid-cols-2 gap-4">
               <Input type="date" label="Data do Evento" value={appointmentForm.date || ''} onChange={e => setAppointmentForm({...appointmentForm, date: e.target.value})} />
               <Input type="time" label="Horário" value={appointmentForm.time || '08:00'} onChange={e => setAppointmentForm({...appointmentForm, time: e.target.value})} />
            </div>

            <Textarea label="Instruções / Preparos / Notas" value={appointmentForm.notes || ''} onChange={e => setAppointmentForm({...appointmentForm, notes: e.target.value})} rows={3} placeholder="Levar exames antigos, jejum de 8h..." />

            <div className="flex gap-3 pt-4 border-t border-[#f1f3f7]">
              <Button className="flex-1 text-xs" onClick={handleSaveAppointment}>Salvar Evento</Button>
              <Button className="flex-1 text-xs" variant="outline" onClick={() => setModalType(null)}>Voltar</Button>
            </div>
          </Card>
        )}

        {!modalType && (
          <Card className="p-5 overflow-hidden">
             {/* Calendar month selector */}
             <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#f1f3f7]">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
                <span className="font-black text-slate-800 capitalize tracking-tight text-sm px-4">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
             </div>
             
             {/* Calendar grids */}
             <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <div key={i} className="text-[10px] font-black text-slate-400 p-1 tracking-wider uppercase">{d}</div>
                ))}
             </div>
             <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2 min-h-11 invisible"></div>
                ))}
                {daysInMonth.map((day, i) => {
                  const dayOfWeek = getDay(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  const dayStr = format(day, 'yyyy-MM-dd');
                  
                  const hasTherapies = therapies.some(t => t.dayOfWeek === dayOfWeek && inRange(t, dayStr));
                  const hasAppts = appointments.some(a => a.date === dayStr && a.status !== 'Cancelada');

                  const statusDots = [];
                  if (hasTherapies) {
                     therapies.filter(t => t.dayOfWeek === dayOfWeek && inRange(t, dayStr)).forEach(t => {
                        const sess = therapySessions.find(ts => ts.therapyId === t.id && ts.date === dayStr);
                        const catColor = getCategory(t.type).color;
                        if (sess && sess.status === 'Cancelada') statusDots.push('bg-rose-400');
                        else if (sess && sess.status === 'Realizada') statusDots.push('bg-emerald-400');
                        else statusDots.push(catColor);
                     });
                  }
                  if (hasAppts) {
                     appointments.filter(a => a.date === dayStr && a.status !== 'Cancelada').forEach(a => {
                        statusDots.push('bg-blue-400');
                     });
                  }

                  return (
                    <button 
                      key={i} 
                      onClick={() => setSelectedDate(day)}
                      className={`p-1.5 min-h-[48px] rounded-2xl border transition-all relative flex flex-col items-center justify-between cursor-pointer
                      ${isSelected 
                        ? 'border-[#2563eb] bg-[#2563eb]/10 text-[#2563eb] font-bold shadow-xs' 
                        : isToday 
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                          : 'border-slate-100 bg-slate-50/70 text-slate-700 hover:bg-slate-100'}
                      `}
                    >
                       <span className="text-xs font-extrabold leading-none">{format(day, 'd')}</span>
                       <div className="mt-1 flex gap-[3px] justify-center flex-wrap max-w-full px-0.5">
                         {statusDots.slice(0, 3).map((color, idx) => (
                           <span key={idx} className={`w-[5px] h-[5px] rounded-full ${color}`} />
                         ))}
                         {statusDots.length > 3 && <span className="text-[6px] font-black text-slate-400">+</span>}
                       </div>
                    </button>
                  )
                })}
             </div>

             {/* Selected Day details summary */}
             <div className="mt-6 pt-5 border-t border-[#f1f3f7] min-h-[180px]">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-between">
                   <span>Compromissos: {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                </h3>
                
                <div className="space-y-4">
                  {/* Single Appointments */}
                  {apptsForSelectedDay.map((a, idx) => (
                    <div 
                      key={`a-${idx}`} 
                      className={`p-4 rounded-3xl border text-left transition-all relative overflow-hidden ${
                        a.status === 'Cancelada' 
                          ? 'bg-rose-50/50 border-rose-100 opacity-60' 
                          : a.status === 'Realizada' 
                            ? 'bg-emerald-50/50 border-emerald-100' 
                            : 'bg-blue-50/40 border-blue-100 shadow-xs'
                      }`}
                    >
                       <div className="flex justify-between items-start mb-2.5">
                          <div className="flex-1 cursor-pointer" onClick={() => handleEditAppointment(a)}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                               <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-lg border ${
                                 a.status === 'Cancelada' 
                                   ? 'bg-rose-100 text-rose-800 border-rose-200' 
                                   : 'bg-blue-100 text-blue-800 border-blue-200'
                               }`}>{a.type}</span>
                               <span className="text-xs font-bold text-slate-500">{a.time}</span>
                            </div>
                            <h4 className={`font-black text-sm tracking-tight leading-snug ${a.status === 'Cancelada' ? 'line-through text-rose-600' : 'text-slate-800'}`}>{a.title || a.type}</h4>
                            <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1">
                              <span>👨‍⚕️ {a.professionalName}</span>
                              {a.location && <span>• 📍 {a.location}</span>}
                            </p>
                          </div>
                       </div>
                       
                       <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                          {['Agendada', 'Realizada', 'Cancelada'].map(s => (
                             <button 
                               key={s} 
                               onClick={() => handleApptAction(a.id, s as TherapyStatus)}
                               className={`text-[9px] px-2.5 py-1.5 rounded-xl border font-black uppercase tracking-wider transition-all cursor-pointer 
                               ${a.status === s ? 
                                  (s === 'Realizada' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 
                                   s === 'Cancelada' ? 'bg-rose-500 text-white border-rose-500 shadow-xs' : 
                                   'bg-[#2563eb] text-white border-[#2563eb] shadow-xs') 
                                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300'}`}
                             >
                               {s === 'Realizada' && a.status === s ? <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5"/>Concluído</span> : s}
                             </button>
                          ))}
                       </div>
                    </div>
                  ))}

                  {/* Recurrent Therapies */}
                  {sessionsForSelectedDay.map((item, idx) => {
                     const category = getCategory(item.therapy.type);
                     return (
                      <div 
                        key={`t-${idx}`} 
                        className={`p-4 rounded-3xl border text-left transition-all ${
                          item.currentStatus === 'Cancelada' 
                            ? 'bg-rose-50/50 border-rose-100 opacity-60' 
                            : item.currentStatus === 'Realizada' 
                              ? 'bg-emerald-50/50 border-emerald-100' 
                              : 'bg-white border-[#f1f3f7] shadow-xs'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2.5">
                          <div className="flex-1 cursor-pointer" onClick={() => handleEditTherapy(item.therapy)}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                               <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">Terapia Recorrente</span>
                               <span className="text-xs font-bold text-slate-500">{item.therapy.time}</span>
                            </div>
                            <h4 className="font-black text-sm tracking-tight leading-snug flex items-center gap-2 text-slate-800">
                               <span className={`w-3 h-3 rounded-full ${category.color} border border-white`} title={category.name}></span>
                               {category.icon} {item.therapy.type}
                            </h4>
                            <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1">
                              <span>👩‍🏫 {item.therapy.professionalName}</span>
                              {item.therapy.location && <span>• 📍 {item.therapy.location}</span>}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-50">
                          {STATUSES.map(s => (
                             <button 
                               key={s} 
                               onClick={() => handleSessionAction(item.therapy, selectedDateStr, s)}
                               className={`text-[9px] px-2.5 py-1.5 rounded-xl border font-black uppercase tracking-wider transition-all cursor-pointer 
                               ${item.currentStatus === s ? 
                                  (s === 'Realizada' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 
                                   s === 'Cancelada' ? 'bg-rose-500 text-white border-rose-500 shadow-xs' : 
                                   'bg-slate-800 text-white border-slate-800 shadow-xs') 
                                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300'}`}
                             >
                               {s === 'Realizada' && item.currentStatus === s ? <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5"/>Feito</span> : s}
                             </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {sessionsForSelectedDay.length === 0 && apptsForSelectedDay.length === 0 && (
                     <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <CalIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-bold">Nenhum evento agendado para este dia.</p>
                        <Button variant="ghost" onClick={openNew} className="mt-2 text-[#2563eb] text-xs font-bold">Adicionar Atendimento</Button>
                     </div>
                  )}
                </div>
             </div>
          </Card>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={confirmDelete}
        title="Excluir Registro"
        itemName={deleteData?.name || 'este item'}
      />
      
      {/* Imprimir Area */}
      <div id="print-agenda" className="hidden print:block bg-white p-8">
         <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold mb-2">Agenda de Terapias e Compromissos</h1>
            <p className="text-gray-600">Criança: {profile.name} • Semana selecionada / Eventos do mês ({format(currentMonth, 'MMMM yyyy', { locale: ptBR })})</p>
         </div>
         <div className="space-y-6">
            <div>
               <h2 className="text-xl font-bold text-[#4a5568] border-b pb-2 mb-4">Eventos Fixos (Semanais)</h2>
               {therapies.length > 0 ? (
                 <div className="grid grid-cols-2 gap-4">
                 {DAYS_OF_WEEK.map((dayName, idx) => {
                    const dayTherapies = therapies.filter(t => t.dayOfWeek === idx);
                    if (dayTherapies.length === 0) return null;
                    return (
                       <div key={idx} className="border p-4 rounded-xl">
                          <h3 className="font-bold text-lg mb-2">{dayName}</h3>
                          <div className="space-y-2">
                             {dayTherapies.map(t => (
                                <div key={t.id} className="text-sm">
                                   <span className="font-bold">{t.time}</span> • {t.type} <br/>
                                   <span className="text-gray-600">{t.professionalName} {t.location ? `(${t.location})` : ''}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    );
                 })}
                 </div>
               ) : (
                  <p className="text-sm text-gray-500">Nenhum evento fixo registrado.</p>
               )}
            </div>
            
            <div className="pt-6">
               <h2 className="text-xl font-bold text-[#4a5568] border-b pb-2 mb-4">Eventos Específicos</h2>
               {appointments.length > 0 ? (
                  <div className="grid gap-4">
                     {appointments.sort((a,b) => a.date.localeCompare(b.date)).map(a => (
                        <div key={a.id} className="border p-4 rounded-xl flex gap-4 items-center">
                           <div className="w-20 text-center font-bold text-lg leading-tight bg-gray-50 p-2 rounded-lg">
                              {format(new Date(a.date+'T12:00:00'), 'dd/MM')}
                              <div className="text-xs text-gray-500 font-normal">{a.time}</div>
                           </div>
                           <div>
                              <h4 className="font-bold text-lg">{a.title || a.type} <span className="text-xs font-normal bg-gray-100 px-2 py-0.5 rounded-full ml-2">{a.type}</span></h4>
                              <p className="text-gray-600 text-sm">{a.professionalName} {a.location ? `• ${a.location}` : ''}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="text-sm text-gray-500">Nenhum evento específico agendado.</p>
               )}
            </div>
         </div>
      </div>
      
      {FeedbackComponent()}
    </div>
  );
}
