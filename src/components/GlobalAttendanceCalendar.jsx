import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, parseISO, isFuture } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, X, Calendar as CalendarIcon, Info, Minus, Ban } from 'lucide-react';

export default function GlobalAttendanceCalendar({ activeCourses, attendanceHistory, onBatchUpdateHistory }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);
  const [tempChanges, setTempChanges] = useState({});

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const endDate = new Date(monthEnd);
  if (endDate.getDay() !== 6) {
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  }

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDayClick = (day) => {
    if (isFuture(day) && !isToday(day)) return;
    
    const changes = {};
    activeCourses.forEach(course => {
      const record = (attendanceHistory || []).find(h => h.courseId === course.id && isSameDay(parseISO(h.date), day));
      changes[course.id] = {
        existingRecordId: record ? record.id : null,
        status: record ? record.status : null
      };
    });
    setTempChanges(changes);
    setSelectedDate(day);
  };

  const handleSaveDay = () => {
    const updates = [];
    const dateStr = selectedDate.toISOString();

    Object.keys(tempChanges).forEach(courseId => {
      const { status, existingRecordId } = tempChanges[courseId];
      // Only record an update if we are adding a new status or changing/removing an old one
      updates.push({
        courseId,
        date: dateStr,
        newStatus: status,
        existingRecordId
      });
    });

    onBatchUpdateHistory(updates);
    setSelectedDate(null);
  };

  return (
    <>
    <div className="card-minimal flex flex-col bg-white dark:bg-[#111] overflow-hidden mb-6">
      
      {/* Instructions header */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 border-b border-indigo-100 dark:border-indigo-800/50 flex gap-3 items-start">
        <Info size={20} className="text-indigo-500 mt-0.5 shrink-0" />
        <div>
          <h3 className="font-bold text-indigo-900 dark:text-indigo-200">How to log attendance</h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
            Click any day on the calendar below to log your classes for that day. This keeps your attendance beautifully tracked!
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-extrabold text-xl text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-indigo-500" /> Attendance Master
          </h3>
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"><ChevronLeft size={20} /></button>
            <span className="text-base font-bold w-32 text-center text-slate-800 dark:text-slate-200">{format(currentMonth, 'MMMM yyyy')}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500"><ChevronRight size={20} /></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-3 text-center text-sm font-bold text-slate-400">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const future = isFuture(day) && !isToday(day);
            
            // Check overall status for the day (did we mark any classes?)
            const activeCourseIds = activeCourses.map(c => c.id);
            const recordsForDay = (attendanceHistory || []).filter(h => isSameDay(parseISO(h.date), day) && activeCourseIds.includes(h.courseId));
            const hasClasses = recordsForDay.length > 0;
            
            let bgClass = "bg-slate-50 hover:bg-slate-100 dark:bg-[#151515] dark:hover:bg-[#1a1a1a]";
            let textClass = "text-slate-700 dark:text-slate-300";
            let borderClass = "border-transparent";
            let indicator = null;

            if (!isCurrentMonth) {
              textClass = "text-slate-300 dark:text-slate-700";
              bgClass = "bg-transparent";
            }

            if (hasClasses) {
              bgClass = "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50";
              textClass = "text-indigo-700 dark:text-indigo-400 font-bold";
              borderClass = "border-indigo-200 dark:border-indigo-800/50";
              indicator = <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>;
            }

            if (isTodayDate) {
              borderClass = "border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-500/20";
            }

            return (
              <button
                key={idx}
                disabled={future}
                onClick={() => handleDayClick(day)}
                className={`
                  relative aspect-square flex flex-col items-center justify-center rounded-xl border-2 text-sm sm:text-base font-medium transition-all
                  ${bgClass} ${textClass} ${borderClass} ${future ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-90'}
                `}
              >
                {format(day, 'd')}
                {indicator}
              </button>
            );
          })}
        </div>
      </div>
    </div>

    {/* Day Attendance Modal Section */}
    {selectedDate && typeof document !== 'undefined' && createPortal(
      <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="card-minimal w-full max-w-md bg-white dark:bg-[#111] p-0 overflow-hidden flex flex-col rounded-2xl shadow-2xl animate-in zoom-in-95 max-h-[85vh]">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151515] flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <CalendarIcon className="text-indigo-500" size={16} /> {format(selectedDate, 'MMMM do, yyyy')}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Log your attendance for this day</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 overflow-y-auto custom-scrollbar bg-white dark:bg-[#111] flex-1 flex flex-col">
              <div className="space-y-2.5 flex-1">
                {activeCourses.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 flex flex-col items-center">
                    <CalendarIcon className="mb-2 opacity-20" size={28} />
                    <p className="text-sm">No courses active.</p>
                  </div>
                ) : (
                  activeCourses.map(course => {
                    const status = tempChanges[course.id]?.status;
                    
                    const setStatus = (newStatus) => {
                      setTempChanges({
                        ...tempChanges,
                        [course.id]: { 
                          ...tempChanges[course.id], 
                          status: status === newStatus ? null : newStatus 
                        }
                      });
                    };

                    return (
                      <div key={course.id} className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161616] flex items-center justify-between gap-3 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors select-none">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate flex-1 pl-1">
                          {course.name}
                        </h4>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button 
                            onClick={() => setStatus('present')}
                            className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full flex items-center justify-center transition-all border-2 ${status === 'present' ? 'bg-emerald-100 border-emerald-500 text-emerald-600 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-500'}`}
                            title="Mark Present"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          
                          <button 
                            onClick={() => setStatus('absent')}
                            className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full flex items-center justify-center transition-all border-2 ${status === 'absent' ? 'bg-rose-100 border-rose-500 text-rose-600 dark:bg-rose-900/40 dark:border-rose-500 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-500'}`}
                            title="Mark Absent"
                          >
                            <XCircle size={16} />
                          </button>

                          <button 
                            onClick={() => setStatus('cancelled')}
                            className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full flex items-center justify-center transition-all border-2 ${status === 'cancelled' ? 'bg-amber-100 border-amber-500 text-amber-600 dark:bg-amber-900/40 dark:border-amber-500 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-500'}`}
                            title="Mark Cancelled"
                          >
                            <Ban size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              <div className="mt-4 flex justify-center gap-4 text-[11px] font-medium text-slate-500 pt-2 flex-wrap">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Present</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Absent</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Cancelled</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 border border-slate-300 dark:border-slate-700 rounded-sm"></div> No Class</div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151515] shrink-0">
              <button onClick={handleSaveDay} className="btn-primary w-full h-10 text-sm font-bold shadow-sm">
                Save Attendance
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
