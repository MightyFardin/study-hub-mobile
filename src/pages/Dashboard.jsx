import React, { useMemo, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CloudLightning, 
  CheckSquare, 
  Calendar, 
  BookOpen, 
  Flame, 
  TrendingDown,
  ArrowRight,
  FileText,
  Clock,
  ChevronUp,
  ChevronDown,
  Edit3,
  Save,
  Timer,
  CheckCircle2,
  XCircle,
  Ban
} from 'lucide-react';

export default function Dashboard() {
  const { user, assignments, timetable, activeCourses, attendanceHistory, setAttendanceHistory, notes, settings, setSettings } = useAuth();
  const navigate = useNavigate();

  const globalMinAttendance = Number(localStorage.getItem('sh2_min_attendance')) || 75;

  // Urgent Tasks
  const pendingTasks = (assignments || []).filter(a => !a.completed);
  const urgentTasks = pendingTasks.filter(a => {
    const diff = (new Date(a.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 2; 
  });

  // Today's Classes
  const todaysClasses = useMemo(() => {
    if (!timetable) return [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayStr = days[new Date().getDay()];
    
    const classesToday = timetable.filter(t => t.day === todayStr);
    
    return classesToday.map(t => {
       const course = activeCourses.find(c => c.id === t.courseId);
       return {
          ...t,
          subject: course ? course.name : 'Unknown Course'
       };
    }).sort((a, b) => {
      const toMinutes = (timeStr) => {
         if (!timeStr) return 0;
         const [hours, minutes] = timeStr.split(':');
         return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
      };
      return toMinutes(a.time) - toMinutes(b.time);
    });
  }, [timetable, activeCourses]);

  const formatTime = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  // Completed Tasks Count
  const completedTasksCount = useMemo(() => {
    return (assignments || []).filter(a => a.completed).length;
  }, [assignments]);

  // At Risk Courses
  const atRiskCourses = useMemo(() => {
    const activeCourseIds = activeCourses.map(c => c.id);
    const validHistory = (attendanceHistory || []).filter(h => activeCourseIds.includes(h.courseId));
    
    const courseStats = activeCourses.map(course => {
      const courseHist = validHistory.filter(h => h.courseId === course.id);
      const cTotal = courseHist.length;
      const cPresent = courseHist.filter(h => h.status === 'present').length;
      const cPercent = cTotal === 0 ? 100 : Math.round((cPresent / cTotal) * 100);
      return { ...course, percent: cPercent, cTotal };
    });

    return courseStats.filter(c => c.percent < globalMinAttendance && c.cTotal > 0);
  }, [activeCourses, attendanceHistory, globalMinAttendance]);

  const recentNotes = [...(notes || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 3);

  const getGreetingMessage = () => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
    const name = user?.name?.split(' ')[0] || '';
    
    if (urgentTasks.length > 0) {
      return {
         title: `Good ${timeOfDay}, ${name} 👋`,
         subtitle: `Crunch time! You have ${urgentTasks.length} urgent task${urgentTasks.length > 1 ? 's' : ''} due soon.`
      };
    } else if (todaysClasses.length > 0) {
      return {
         title: `Good ${timeOfDay}, ${name} 👋`,
         subtitle: `You have ${todaysClasses.length} class${todaysClasses.length > 1 ? 'es' : ''} today. Have a great day!`
      };
    } else {
      return {
         title: `Good ${timeOfDay}, ${name} 👋`,
         subtitle: `Here is your daily study overview. No urgent tasks!`
      };
    }
  };
  const greeting = getGreetingMessage();

  const [editMode, setEditMode] = useState(false);
  const [order, setOrder] = useState(() => settings?.dashboardOrder || ['urgentTasks', 'classes', 'atRisk', 'notes']);

  const moveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrder(newOrder);
    setSettings({...settings, dashboardOrder: newOrder});
  };

  const moveDown = (index) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    setOrder(newOrder);
    setSettings({...settings, dashboardOrder: newOrder});
  };

  const handleQuickAttendance = (courseId, status) => {
    if (!courseId) return;
    const today = new Date().toISOString().split('T')[0];
    const existingRecord = (attendanceHistory || []).find(h => h.courseId === courseId && h.date.startsWith(today));
    
    let newHistory = [...(attendanceHistory || [])];
    if (existingRecord) {
      if (existingRecord.status === status) {
        // Toggle off
        newHistory = newHistory.filter(h => h.id !== existingRecord.id);
        setAttendanceHistory(newHistory);
        return;
      }
      newHistory = newHistory.filter(h => h.id !== existingRecord.id);
    }
    
    newHistory.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      courseId,
      date: new Date().toISOString(),
      status
    });
    
    setAttendanceHistory(newHistory);
  };

  const widgetActionItems = (
    <div className="card-minimal p-0 overflow-hidden card-hover">
            <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="text-indigo-500">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-slate-200 text-base">Action Items</h2>
                </div>
              </div>
              <Link to="/assignments" className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                <ArrowRight size={18} />
              </Link>
            </div>
            
            <div className="p-5">
              {urgentTasks.length > 0 ? (
                <div className="space-y-3">
                  {urgentTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1a1a1a] shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">{task.title}</h4>
                        <p className="text-xs text-slate-500 font-medium">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {urgentTasks.length > 3 && (
                     <p className="text-center text-xs font-bold text-slate-500 mt-3">+ {urgentTasks.length - 3} more</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckSquare size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">All caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">No urgent assignments pending.</p>
                </div>
              )}
            </div>
          </div>
  );

  const widgetClasses = (
          <div className="card-minimal p-5 card-hover">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Calendar className="text-indigo-500" size={18} /> Today's Schedule
              </h2>
              <Link to="/timetable" className="text-xs font-bold text-slate-500 hover:text-indigo-500">View All</Link>
            </div>
            
            {todaysClasses.length > 0 ? (
              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {todaysClasses.map((cls, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#111] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                      <Clock size={14} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1a1a] shadow-sm group-hover:border-indigo-200 dark:group-hover:border-indigo-900/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate pr-2">{cls.subject}</h4>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded shrink-0">Class</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mb-3">{formatTime(cls.time)} {cls.room && `• ${cls.room}`}</p>
                      
                      {/* Quick Attendance */}
                      {cls.courseId && (
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800/50">
                          {(() => {
                            const today = new Date().toISOString().split('T')[0];
                            const record = (attendanceHistory || []).find(h => h.courseId === cls.courseId && h.date.startsWith(today));
                            const isPresent = record?.status === 'present';
                            const isAbsent = record?.status === 'absent';
                            const isCancelled = record?.status === 'cancelled';
                            
                            return (
                              <>
                                <button 
                                  onClick={(e) => { e.preventDefault(); handleQuickAttendance(cls.courseId, 'present'); }}
                                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-all ${isPresent ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-[#222] text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600'}`}
                                >
                                  <CheckCircle2 size={14} /> {isPresent ? 'Present' : 'Mark'}
                                </button>
                                <button 
                                  onClick={(e) => { e.preventDefault(); handleQuickAttendance(cls.courseId, 'absent'); }}
                                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-all ${isAbsent ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-[#222] text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600'}`}
                                >
                                  <XCircle size={14} /> {isAbsent ? 'Absent' : 'Miss'}
                                </button>
                                <button 
                                  onClick={(e) => { e.preventDefault(); handleQuickAttendance(cls.courseId, 'cancelled'); }}
                                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 text-[11px] sm:text-xs font-bold transition-all ${isCancelled ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-[#222] text-slate-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600'}`}
                                >
                                  <Ban size={14} /> {isCancelled ? 'No Class' : 'Cancel'}
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-500">No classes today</p>
              </div>
            )}
          </div>
  );



  const widgetAtRisk = (
          <div className="card-minimal p-5 card-hover">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <TrendingDown className="text-slate-400 dark:text-slate-500" size={18} /> At Risk
              </h2>
              <Link to="/courses" className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Track</Link>
            </div>
            
            {atRiskCourses.length > 0 ? (
              <div className="space-y-3">
                {atRiskCourses.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-3 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate pr-2">{c.name}</span>
                    <span className="text-sm font-black text-red-500 shrink-0">{c.percent}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm font-bold text-slate-500">Attendance is solid!</p>
              </div>
            )}
          </div>
  );

  const widgetNotes = (
          <div className="card-minimal p-5 card-hover">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <BookOpen className="text-indigo-500" size={18} /> Recent Notes
              </h2>
              <Link to="/notes" className="text-xs font-bold text-slate-500 hover:text-indigo-500">View All</Link>
            </div>
            
            {recentNotes.length > 0 ? (
              <div className="space-y-2">
                {recentNotes.map(note => (
                  <button 
                    key={note.id} 
                    onClick={() => navigate('/notes')}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1a1a1a] border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors text-left group"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate group-hover:text-indigo-500 transition-colors">{note.title || note.fileName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 truncate">
                        {activeCourses.find(c => c.id === note.courseId)?.name || 'Unknown'}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 dark:text-slate-700 group-hover:text-indigo-400 shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm font-medium text-slate-400">No notes created yet.</p>
              </div>
            )}
          </div>
  );

  const widgetsMap = {
    urgentTasks: widgetActionItems,
    classes: widgetClasses,
    atRisk: widgetAtRisk,
    notes: widgetNotes
  };

  const defaultLayout = (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {widgetActionItems}
          {widgetClasses}
        </div>
        <div className="space-y-6">
          {widgetAtRisk}
          {widgetNotes}
        </div>
      </div>
  );

  const customLayout = (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <button onClick={() => setEditMode(!editMode)} className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-colors ${editMode ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
          {editMode ? <><Save size={16} /> Finish Editing</> : <><Edit3 size={16} /> Customize Layout</>}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {order.map((key, i) => (
          <div key={key} className={`relative transition-all duration-300 ${editMode ? 'ring-2 ring-indigo-500 rounded-xl p-1 bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
            {editMode && (
               <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 bg-white dark:bg-black rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 p-1">
                 <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"><ChevronUp size={18} /></button>
                 <div className="w-full h-px bg-slate-200 dark:bg-slate-800"></div>
                 <button onClick={() => moveDown(i)} disabled={i === order.length - 1} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 disabled:opacity-30 transition-colors"><ChevronDown size={18} /></button>
               </div>
            )}
            <div className={`h-full ${editMode ? 'opacity-90 pointer-events-none' : ''}`}>
              {widgetsMap[key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 relative pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {greeting.title}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{greeting.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/pomodoro" className="btn-primary py-2 hidden sm:flex bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 border-none">
             <Timer size={16} /> Enter Focus Mode
          </Link>
          <div className="card-minimal px-4 py-2 border-slate-200 dark:border-slate-800 flex items-center gap-3 card-hover">
            <div className="text-emerald-500">
              <CheckSquare size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-wider">Tasks Done</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none">{completedTasksCount} <span className="text-xs font-bold text-slate-400">Total</span></p>
            </div>
          </div>
        </div>
      </div>

      {settings?.customDashboard ? customLayout : defaultLayout}
    </div>
  );
}
