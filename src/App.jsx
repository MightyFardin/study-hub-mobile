import React, { Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { 
  BookOpen, 
  LayoutDashboard, 
  LogOut, 
  Menu,
  CheckSquare,
  Calendar,
  Calculator,
  Timer,
  Layers,
  Settings as SettingsIcon,
  Lock,
  Cloud,
  CloudOff,
  RefreshCw,
  Search,
  Moon,
  Sun,
  Bell,
  FileText,
  ChevronRight,
  Plus,
  Megaphone,
  X,
  Clock
} from 'lucide-react';
import CustomSelect from './components/CustomSelect';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Courses = lazy(() => import('./pages/Courses'));
const Notes = lazy(() => import('./pages/Notes'));
const Assignments = lazy(() => import('./pages/Assignments'));
const Timetable = lazy(() => import('./pages/Timetable'));
const GradeCalculator = lazy(() => import('./pages/Calculator'));
const Pomodoro = lazy(() => import('./pages/Pomodoro'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
// Loading component for Suspense
const PageLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
    <RefreshCw size={24} className="animate-spin text-indigo-500/50 mb-4" />
    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</span>
  </div>
);

// Quick Setup Modal Component
function QuickSetupModal() {
  const { globalYear, setGlobalYear, globalSemester, setGlobalSemester, courses, setCourses, settings, setSettings } = useAuth();
  const [step, setStep] = React.useState(1);
  const [courseCode, setCourseCode] = React.useState('');
  const [courseName, setCourseName] = React.useState('');
  const [driveLink, setDriveLink] = React.useState('');

  const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const SEMESTERS = ['1st Semester', '2nd Semester'];

  const completeSetup = () => {
    if (courseCode && courseName) {
      setCourses([...courses, {
        id: Date.now().toString(),
        code: courseCode,
        name: courseName,
        year: globalYear,
        semester: globalSemester,
        credits: 3,
        createdAt: new Date().toISOString()
      }]);
    }
    setSettings({ ...settings, onboardingCompleted: true });
  };

  return (
    typeof document !== 'undefined' ? createPortal(<div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="card-minimal w-full max-w-md bg-white dark:bg-[#111] p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
        {step === 1 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-indigo-500/20 border border-indigo-100 dark:border-indigo-500/30">
              <span className="text-4xl animate-bounce mt-2">👋</span>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Welcome to Study Hub!</h2>
              <div className="text-slate-500 text-sm font-medium px-2 text-left space-y-2 mt-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                 <p>📚 <b>Courses & Notes:</b> Track attendance and store study materials.</p>
                 <p>⏰ <b>Timetable:</b> Set your class routine and get alerts.</p>
                 <p>🧮 <b>CGPA Calculator:</b> Automatically calculate your GPA.</p>
                 <p>Let's get your workspace set up in just 2 quick steps!</p>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={() => setStep(2)} className="btn-primary w-full py-3.5 text-base shadow-lg shadow-indigo-500/20">Let's Get Started</button>
              <button onClick={() => setSettings({ ...settings, onboardingCompleted: true })} className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest transition-colors py-2">Skip Setup</button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-6">
            <div>
               <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Academic Term</h2>
               <p className="text-sm text-slate-500 font-medium">What's your current academic term?</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Select Year</label>
              <div className="grid grid-cols-2 gap-2">
                {YEARS.map(y => (
                  <button key={y} onClick={() => setGlobalYear(y)} className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${globalYear === y ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'}`}>{y}</button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Select Semester</label>
              <div className="grid grid-cols-2 gap-2">
                {SEMESTERS.map(s => (
                  <button key={s} onClick={() => setGlobalSemester(s)} className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${globalSemester === s ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-sm' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'}`}>{s}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
               <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">Back</button>
               <button onClick={() => setStep(3)} className="btn-primary flex-1 py-3">Next Step</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
               <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Add your courses</h2>
               <p className="text-sm text-slate-500 font-medium">Add a course manually or import from your University's Google Drive link.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Quick Import</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Paste Google Drive folder link..." 
                  className="input-field h-12 flex-1 text-sm" 
                  value={driveLink} 
                  onChange={e => setDriveLink(e.target.value)} 
                />
                <button 
                  onClick={() => {
                    if(!driveLink) return;
                    setSettings({ ...settings, onboardingCompleted: true });
                    localStorage.setItem('sh2_trigger_import', 'true');
                    localStorage.setItem('sh2_import_url', driveLink);
                    window.location.href = '/courses';
                  }} 
                  disabled={!driveLink}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Cloud size={18} /> Import
                </button>
              </div>
            </div>

            <div className="relative flex py-2 items-center">
               <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
               <span className="shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Or add manually</span>
               <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Course Code</label>
                <input type="text" placeholder="e.g. CSE 101" className="input-field h-12 font-bold" value={courseCode} onChange={e => setCourseCode(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Course Name <span className="text-slate-400 font-normal lowercase">(Optional)</span></label>
                <input type="text" placeholder="e.g. Intro to Programming" className="input-field h-12" value={courseName} onChange={e => setCourseName(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
               <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">Back</button>
               <button onClick={completeSetup} disabled={!courseCode} className="btn-primary flex-1 py-3 shadow-lg shadow-indigo-500/20">Finish Setup</button>
            </div>
            
            <div className="text-center">
               <button onClick={completeSetup} className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest mt-2 transition-colors">Skip for now</button>
            </div>
          </div>
        )}
      </div>
    </div>, document.body) : null
  );
}

function GlobalSystemListener() {
  const { user } = useAuth();
  const [announcement, setAnnouncement] = React.useState(null);

  // Global Error Logger only
  React.useEffect(() => {
    const handleError = (msg, url, lineNo, columnNo, error) => {
      try {
        if (!user || user.email === 'mdfardin6118@gmail.com') return;
        addDoc(collection(db, 'errorLogs'), {
          message: typeof msg === 'string' ? msg : 'Unknown Error',
          url: url || '',
          lineNo: lineNo || 0,
          stack: error?.stack || '',
          userId: user?.id || 'anonymous',
          email: user?.email || 'anonymous',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }).catch(() => {});
      } catch(e) {}
    };

    const handleRejection = (e) => {
      try {
        if (!user || user.email === 'mdfardin6118@gmail.com') return;
        addDoc(collection(db, 'errorLogs'), {
          message: e.reason?.message || String(e.reason),
          stack: e.reason?.stack || '',
          userId: user?.id || 'anonymous',
          email: user?.email || 'anonymous',
          timestamp: new Date().toISOString(),
          type: 'unhandledRejection'
        }).catch(() => {});
      } catch(err) {}
    };

    window.addEventListener('error', (e) => handleError(e.message, e.filename, e.lineno, e.colno, e.error));
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [user]);

  return null;
}

function DashboardLayout({ children }) {
  const { user, logout, globalYear, setGlobalYear, globalSemester, setGlobalSemester, syncStatus, settings, setSettings, notes, assignments, activeCourses, timetable, isFirebaseLoaded } = useAuth();
  console.log("DEBUG QUICK SETUP:", { isFirebaseLoaded, settings });  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [upcomingClass, setUpcomingClass] = React.useState(null);
  
  // Notifications State
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [announcementsList, setAnnouncementsList] = React.useState([]);
  const [dismissedAnns, setDismissedAnns] = React.useState([]);

  const location = useLocation();

  // Load dismissed announcements from storage
  React.useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sh2_dismissed_anns') || '[]');
      setDismissedAnns(stored);
    } catch(e) {}
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const anns = [];
      snapshot.forEach(doc => {
         if (doc.data().active !== false) {
           anns.push({ id: doc.id, ...doc.data() });
         }
      });
      setAnnouncementsList(anns);
    });
    return () => unsubscribe();
  }, [user]);

  const dismissAnnouncement = (id) => {
    const updated = [...dismissedAnns, id];
    setDismissedAnns(updated);
    localStorage.setItem('sh2_dismissed_anns', JSON.stringify(updated));
  };

  React.useEffect(() => {
    setSidebarOpen(false);
    setSearchOpen(false);
  }, [location]);

  // Close Search Modal on Escape
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Upcoming Class Notification Alert Logic
  React.useEffect(() => {
    if (!timetable || timetable.length === 0) return;
    
    const checkUpcoming = () => {
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayStr = days[now.getDay()];
      
      const todaysClasses = timetable.filter(t => t.day === todayStr);
      if (todaysClasses.length === 0) return;

      const toMinutes = (timeStr) => {
         if (!timeStr) return 0;
         const [time, modifier] = timeStr.split(' ');
         let [hours, minutes] = time.split(':');
         hours = parseInt(hours, 10);
         if (hours === 12) hours = 0;
         if (modifier === 'PM') hours += 12;
         return hours * 60 + parseInt(minutes, 10);
      };

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      
      let nextClass = null;
      for (let cls of todaysClasses) {
         const clsMins = toMinutes(cls.startTime);
         const diff = clsMins - nowMinutes;
         // Alert if class is within 45 minutes
         if (diff > 0 && diff <= 45) {
            nextClass = { ...cls, startsIn: diff };
            break; 
         }
      }
      setUpcomingClass(nextClass);
    };

    checkUpcoming();
    const interval = setInterval(checkUpcoming, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [timetable]);

  const toggleTheme = () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setSettings({ ...settings, theme: isCurrentlyDark ? 'light' : 'dark' });
  };

  const isDark = settings?.theme === 'dark' || (settings?.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const SEMESTERS = ['1st Semester', '2nd Semester'];
  const yearOptions = YEARS.map(y => ({ value: y, label: y }));
  const semesterOptions = SEMESTERS.map(s => ({ value: s, label: s }));

  const SyncIndicator = ({ status, isMobile }) => {
    const textClass = isMobile ? "hidden sm:inline" : "";
    if (status === 'syncing') {
      return <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50"><RefreshCw size={14} className="animate-spin" /> <span className={textClass}>Syncing...</span></div>;
    }
    if (status === 'error') {
      return <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50"><CloudOff size={14} /> <span className={textClass}>Sync Error</span></div>;
    }
    return <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50"><Cloud size={14} /> <span className={textClass}>Saved</span></div>;
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/courses', label: 'Courses & Attendance', icon: <BookOpen size={20} /> },
    { path: '/notes', label: 'Course Notes', icon: <FileText size={20} /> },
    { path: '/assignments', label: 'Assignments', icon: <CheckSquare size={20} /> },
    { path: '/timetable', label: 'Timetable', icon: <Calendar size={20} /> },
    { path: '/calculator', label: 'CGPA Calculator', icon: <Calculator size={20} /> },
    { path: '/pomodoro', label: 'Pomodoro Timer', icon: <Timer size={20} /> },
    { path: '/flashcards', label: 'Flashcards', icon: <Layers size={20} /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  // Compute Search Results with Memoization for Performance
  const searchResults = React.useMemo(() => {
    const results = [];
    if (searchQuery.length > 1) {
      const q = searchQuery.toLowerCase();
      notes.forEach(n => {
         if (n.title?.toLowerCase().includes(q) || n.fileName?.toLowerCase().includes(q)) {
            results.push({ 
               type: 'Note', 
               icon: <FileText size={16} className="text-blue-500" />,
               title: n.title || n.fileName, 
               subtitle: `Course: ${activeCourses.find(c => c.id === n.courseId)?.name || 'Unknown'}`,
               link: '/notes' 
            });
         }
      });
      assignments.forEach(a => {
         if (a.title?.toLowerCase().includes(q)) {
            results.push({ 
               type: 'Task', 
               icon: <CheckSquare size={16} className="text-emerald-500" />,
               title: a.title, 
               subtitle: a.dueDate ? `Due: ${new Date(a.dueDate).toLocaleDateString()}` : 'No due date',
               link: '/assignments' 
            });
         }
      });
      activeCourses.forEach(c => {
         if (c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q)) {
            results.push({ 
               type: 'Course', 
               icon: <BookOpen size={16} className="text-purple-500" />,
               title: c.name, 
               subtitle: c.teacherName || 'No instructor assigned',
               link: '/courses' 
            });
         }
      });
    }
    return results;
  }, [searchQuery, notes, assignments, activeCourses]);

  const QuickAddFAB = () => {
    const [open, setOpen] = React.useState(false);
    if (location.pathname !== '/') return null;
    return (
      <div className="absolute bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
        {open && (
           <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-4 zoom-in-75 duration-200 mb-1">
              <div className="flex items-center gap-3">
                <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">Add Task</span>
                <Link to="/assignments" onClick={() => setOpen(false)} className="flex items-center justify-center w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/20 transition-transform hover:scale-110">
                  <CheckSquare size={20} />
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">Add Note</span>
                <Link to="/notes" onClick={() => setOpen(false)} className="flex items-center justify-center w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/20 transition-transform hover:scale-110">
                  <FileText size={20} />
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">Add Course</span>
                <Link to="/courses" onClick={() => setOpen(false)} className="flex items-center justify-center w-12 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg shadow-purple-500/20 transition-transform hover:scale-110">
                  <BookOpen size={20} />
                </Link>
              </div>
           </div>
        )}
        <button 
          onClick={() => setOpen(!open)}
          className={`bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 p-4 rounded-full shadow-2xl transition-all duration-300 ${open ? 'rotate-45 bg-slate-700 dark:bg-slate-300' : ''}`}
        >
          <Plus size={28} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[rgb(var(--bg-main))]">
      
      {/* Quick Setup Modal for new or existing users who haven't completed it */}
      {isFirebaseLoaded && (!settings || settings.onboardingCompleted !== true) && <QuickSetupModal />}
      
      {/* Search Modal */}
      {searchOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-[100] flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-200">
           <div className="card-minimal w-full max-w-2xl bg-white dark:bg-[#111] p-0 overflow-hidden flex flex-col rounded-2xl shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151515]">
                 <Search size={22} className="text-indigo-500 shrink-0" />
                 <input 
                   type="text" 
                   autoFocus 
                   value={searchQuery} 
                   onChange={e => setSearchQuery(e.target.value)} 
                   placeholder="Search notes, tasks, courses..." 
                   className="flex-1 h-14 bg-transparent px-4 text-base font-bold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 placeholder:font-medium" 
                 />
                 {searchQuery && (
                   <button onClick={() => setSearchQuery('')} className="p-1 mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0">
                     <X size={18} />
                   </button>
                 )}
                 <button onClick={() => setSearchOpen(false)} className="p-1.5 bg-slate-200 dark:bg-slate-800 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 text-xs font-bold px-3">Esc</button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                {!searchQuery || searchQuery.length <= 1 ? (
                   <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                     <Search size={48} className="mb-4 opacity-20" />
                     <p className="font-medium text-sm">Type at least 2 characters to search</p>
                   </div>
                ) : searchResults.length === 0 ? (
                   <div className="p-12 flex flex-col items-center justify-center text-slate-500">
                     <FileText size={48} className="mb-4 opacity-20 text-indigo-500" />
                     <p className="font-medium text-sm">No results found for "{searchQuery}"</p>
                   </div>
                ) : (
                   <div className="space-y-1">
                     {searchResults.map((res, i) => (
                       <Link key={i} to={res.link} onClick={() => setSearchOpen(false)} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] rounded-xl transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                         <div className="flex items-start gap-4">
                           <div className="mt-0.5 p-2 bg-white dark:bg-black rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                             {res.icon}
                           </div>
                           <div>
                             <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{res.title}</h4>
                             <p className="text-xs font-medium text-slate-500">{res.subtitle}</p>
                           </div>
                         </div>
                         <ChevronRight size={18} className="text-slate-300 dark:text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                       </Link>
                     ))}
                   </div>
                )}
               </div>
           </div>
        </div>, document.body)
      }

      {/* Mobile overlay */}
      {sidebarOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />,
        document.body
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#111] border-r border-slate-200 dark:border-slate-800 
        transform transition-transform duration-200 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Study Hub</span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          
          <div className="mb-6 px-2 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Context</h3>
            <div className="space-y-2">
              <CustomSelect 
                value={globalYear} 
                onChange={setGlobalYear}
                options={yearOptions}
                className="py-2.5 text-sm font-bold bg-slate-50 dark:bg-[#1a1a1a]"
              />
              <CustomSelect 
                value={globalSemester} 
                onChange={setGlobalSemester}
                options={semesterOptions}
                className="py-2.5 text-sm font-bold bg-slate-50 dark:bg-[#1a1a1a]"
              />
            </div>
          </div>

          <div className="space-y-1">

            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
                    ${isActive 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex justify-center mb-3">
            <SyncIndicator status={syncStatus} />
          </div>
          <div className="mb-4 px-2 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Logged in as</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:text-white hover:bg-red-500 dark:hover:bg-red-600 transition-colors rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

        {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">
        
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md z-40 sticky top-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors active:scale-95 lg:hidden"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
            <div className="flex flex-col lg:hidden">
              <span className="font-black text-slate-900 dark:text-white text-lg leading-none tracking-tight">Study Hub<span className="text-indigo-500">.</span></span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Workspace</span>
            </div>
            <div className="hidden lg:flex flex-col">
               <span className="text-sm font-black text-slate-800 dark:text-slate-200">{user?.name}'s Workspace</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSearchOpen(true)} 
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors active:scale-95"
            >
              <Search size={20} strokeWidth={2.5} />
            </button>
            
            <button 
              onClick={() => setNotificationsOpen(true)} 
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors active:scale-95 relative"
            >
              <Bell size={20} strokeWidth={2.5} />
              {(upcomingClass || announcementsList.some(a => !dismissedAnns.includes(a.id))) && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-[#0a0a0a] rounded-full animate-pulse"></span>
              )}
            </button>

            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors active:scale-95"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={20} strokeWidth={2.5} /> : <Moon size={20} strokeWidth={2.5} />}
            </button>
            <div className="pl-2 border-l border-slate-200 dark:border-slate-800 ml-1">
               <SyncIndicator status={syncStatus} isMobile={true} />
            </div>
          </div>
          {upcomingClass && (
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-[60] animate-in slide-in-from-top-4 fade-in">
              <div className="bg-white dark:bg-[#111] border border-indigo-200 dark:border-indigo-500/30 shadow-lg shadow-indigo-500/10 rounded-2xl p-3 pr-4 flex items-center gap-3 max-w-sm">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500 shrink-0">
                  <Bell size={18} className="animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{upcomingClass.subject}</h4>
                  <p className="text-xs font-medium text-slate-500">Starts in <span className="text-indigo-500 font-bold">{upcomingClass.startsIn} mins</span> {upcomingClass.room && `• ${upcomingClass.room}`}</p>
                </div>
                <button onClick={() => setUpcomingClass(null)} className="ml-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"><X size={16}/></button>
              </div>
            </div>
          )}
        </header>

        {/* Notifications Dropdown/Modal */}
        {notificationsOpen && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-[100] flex items-start justify-end sm:pt-16 p-4 sm:pr-8 animate-in fade-in duration-200" onClick={() => setNotificationsOpen(false)}>
            <div className="card-minimal w-full sm:w-[400px] bg-white dark:bg-[#111] p-0 overflow-hidden flex flex-col rounded-2xl shadow-2xl animate-in slide-in-from-top-10 sm:slide-in-from-top-4 border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151515]">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-indigo-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Notification Center</h3>
                </div>
                <button onClick={() => setNotificationsOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-md transition-colors"><X size={18}/></button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {(!upcomingClass && announcementsList.length === 0) ? (
                  <div className="p-10 flex flex-col items-center text-center text-slate-400">
                    <CheckSquare size={40} className="mb-3 opacity-20 text-emerald-500" />
                    <p className="text-sm font-bold">You're all caught up!</p>
                    <p className="text-xs mt-1">No new notifications at the moment.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {upcomingClass && (
                      <div className="p-4 hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                        <div className="flex gap-3">
                          <div className="mt-1 p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                            <Clock size={16} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Upcoming Class: {upcomingClass.subject}</h4>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">Starts in <span className="text-indigo-500 font-bold">{upcomingClass.startsIn} mins</span> {upcomingClass.room && `in ${upcomingClass.room}`}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {announcementsList.map(ann => {
                      const isUnread = !dismissedAnns.includes(ann.id);
                      return (
                        <div key={ann.id} className={`p-4 transition-colors relative ${isUnread ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'}`}>
                          {isUnread && <div className="absolute right-4 top-4 w-2 h-2 rounded-full bg-indigo-500"></div>}
                          <div className="flex gap-3">
                            <div className={`mt-1 p-2 rounded-lg shrink-0 ${ann.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'}`}>
                              <Megaphone size={16} />
                            </div>
                            <div className="pr-4">
                              <h4 className={`font-bold text-sm ${ann.type === 'warning' ? 'text-amber-700 dark:text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                                {ann.type === 'warning' ? 'System Warning' : 'Announcement'}
                              </h4>
                              <p className="text-xs text-slate-400 font-medium mt-0.5 mb-1.5">{new Date(ann.createdAt).toLocaleString()}</p>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{ann.message}</p>
                              {isUnread && (
                                <button onClick={() => dismissAnnouncement(ann.id)} className="mt-3 text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors">
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>, document.body
        )}

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col relative custom-scrollbar">
          <div className="flex-1">
            {children}
          </div>
          
          <footer className="mt-12 pt-6 pb-2 border-t border-slate-200 dark:border-slate-800 text-center shrink-0">
            <p className="text-sm text-slate-500 font-medium">Designed and Developed by <span className="font-bold text-slate-800 dark:text-slate-200">Ashadul Alam Fardin</span></p>
            <div className="text-xs text-slate-400 font-medium mt-2 flex items-center justify-center gap-3 flex-wrap">
              <a href="tel:01853108102" className="hover:text-indigo-500 transition-colors">📞 01853108102</a>
              <span className="hidden sm:inline">&bull;</span>
              <a href="mailto:mdfardin6118@gmail.com" className="hover:text-indigo-500 transition-colors">✉️ mdfardin6118@gmail.com</a>
            </div>
          </footer>
        </div>
        
        <QuickAddFAB />
      </main>
    </div>
  );
}

import AppUpdater from './components/AppUpdater';

function App() {
  const { user, settings } = useAuth();
  const [isUnlocked, setIsUnlocked] = React.useState(() => {
    return sessionStorage.getItem('sh2_unlocked') === 'true';
  });
  const [pinInput, setPinInput] = React.useState('');
  const [pinError, setPinError] = React.useState('');

  if (user && settings?.twoFactor && !isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <div className="card-minimal w-full max-w-sm p-8 text-center animate-in zoom-in-95 bg-white dark:bg-[#111]">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">App Locked</h2>
          <p className="text-sm text-slate-500 mb-8">Enter your 4-digit PIN to continue</p>
          
          <input 
            type="password"
            maxLength="4"
            value={pinInput}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setPinInput(val);
              setPinError('');
              if (val.length === 4) {
                if (val === settings.pinCode) {
                  sessionStorage.setItem('sh2_unlocked', 'true');
                  setIsUnlocked(true);
                } else {
                  setPinError('Incorrect PIN');
                  setPinInput('');
                }
              }
            }}
            autoFocus
            className="input-field text-center text-3xl tracking-[0.5em] font-mono h-16 w-full mb-2" 
            placeholder="••••"
          />
          {pinError && <p className="text-xs font-bold text-red-500">{pinError}</p>}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <GlobalSystemListener />
      <AppUpdater />
      <Routes>
        <Route path="/" element={
          !user ? <Suspense fallback={<PageLoader />}><Login /></Suspense> : <Navigate to="/dashboard" replace />
        } />

        <Route path="/dashboard" element={
          user ? <DashboardLayout><Suspense fallback={<PageLoader />}><Dashboard /></Suspense></DashboardLayout> : <Navigate to="/" replace />
        } />

        <Route path="/courses" element={
          user ? <DashboardLayout><Suspense fallback={<PageLoader />}><Courses /></Suspense></DashboardLayout> : <Navigate to="/" replace />
        } />

        <Route path="/notes" element={
          user ? <DashboardLayout><Suspense fallback={<PageLoader />}><Notes /></Suspense></DashboardLayout> : <Navigate to="/" replace />
        } />
        
        <Route path="/assignments" element={
          user ? <DashboardLayout><Suspense fallback={<PageLoader />}><Assignments /></Suspense></DashboardLayout> : <Navigate to="/" replace />
        } />

        <Route path="/timetable" element={
          user ? <DashboardLayout><Suspense fallback={<PageLoader />}><Timetable /></Suspense></DashboardLayout> : <Navigate to="/" replace />
        } />

        <Route path="/calculator" element={
          user ? <DashboardLayout><Suspense fallback={<PageLoader />}><GradeCalculator /></Suspense></DashboardLayout> : <Navigate to="/" replace />
        } />

        <Route path="/pomodoro" element={
          user ? <DashboardLayout><Suspense fallback={<PageLoader />}><Pomodoro /></Suspense></DashboardLayout> : <Navigate to="/" replace />
        } />

        <Route path="/flashcards" element={
          user ? <DashboardLayout><Suspense fallback={<PageLoader />}><Flashcards /></Suspense></DashboardLayout> : <Navigate to="/" replace />
        } />

        <Route path="/settings" element={
          user ? <DashboardLayout><Suspense fallback={<PageLoader />}><Settings /></Suspense></DashboardLayout> : <Navigate to="/" replace />
        } />

        <Route path="/admin" element={
          user && user.email === 'mdfardin6118@gmail.com' ? <DashboardLayout><Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense></DashboardLayout> : <Navigate to="/" replace />
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
