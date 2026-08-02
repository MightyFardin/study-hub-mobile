import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Activity, Globe, Search, RefreshCw, AlertTriangle, Edit2, Trash2, X, BookOpen, Megaphone, FileText, Bug, Send, Server, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'announcements', 'logs'
  
  // Data States
  const [usersList, setUsersList] = useState([]);
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state for Users
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToWipe, setUserToWipe] = useState(null);

  // Announcement Form State
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (activeTab === 'users') {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const fetchedUsers = [];
        querySnapshot.forEach((document) => {
          fetchedUsers.push({ id: document.id, ...document.data() });
        });
        fetchedUsers.sort((a, b) => {
          const dateA = new Date(a.profile?.createdAt || a.createdAt || 0);
          const dateB = new Date(b.profile?.createdAt || b.createdAt || 0);
          return dateB - dateA;
        });
        setUsersList(fetchedUsers);
      } else if (activeTab === 'announcements') {
        const querySnapshot = await getDocs(collection(db, 'announcements'));
        const fetchedAnns = [];
        querySnapshot.forEach((document) => {
          fetchedAnns.push({ id: document.id, ...document.data() });
        });
        fetchedAnns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAnnouncementsList(fetchedAnns);
      } else if (activeTab === 'logs') {
        const querySnapshot = await getDocs(collection(db, 'errorLogs'));
        const fetchedLogs = [];
        querySnapshot.forEach((document) => {
          fetchedLogs.push({ id: document.id, ...document.data() });
        });
        fetchedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setErrorLogs(fetchedLogs);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data. Ensure Firestore rules allow admin read access to collections.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // User Actions
  const handleDeleteUser = async () => {
    if(!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', userToDelete));
      setUsersList(usersList.filter(u => u.id !== userToDelete));
      setUserToDelete(null);
    } catch(err) {
      alert("Failed to delete user document.");
    }
  };

  const handleWipeUser = async () => {
    if(!userToWipe) return;
    try {
      const userObj = usersList.find(u => u.id === userToWipe);
      if(!userObj) return;
      const newDoc = { profile: userObj.profile || {} };
      if(userObj.email) newDoc.email = userObj.email;
      if(userObj.name) newDoc.name = userObj.name;
      
      await setDoc(doc(db, 'users', userToWipe), newDoc); 
      setUsersList(usersList.map(u => u.id === userToWipe ? { id: u.id, ...newDoc } : u));
      setUserToWipe(null);
    } catch(err) {
      alert("Failed to wipe user data.");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if(!editingUser) return;
    try {
      await setDoc(doc(db, 'users', editingUser.id), {
        profile: { fullName: editingUser.fullName, email: editingUser.email }
      }, { merge: true });
      
      setUsersList(usersList.map(u => u.id === editingUser.id ? { ...u, profile: { ...u.profile, fullName: editingUser.fullName, email: editingUser.email } } : u));
      setEditingUser(null);
    } catch(err) {
      alert("Failed to update user.");
    }
  };

  // Announcement Actions
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if(!announcementMsg.trim()) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        message: announcementMsg,
        type: announcementType, // 'info', 'warning'
        active: true,
        createdAt: new Date().toISOString()
      });
      setAnnouncementMsg('');
      fetchData();
    } catch (err) {
      alert("Failed to send announcement.");
    }
  };
  
  const handleDeleteAnnouncement = async (id) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncementsList(announcementsList.filter(a => a.id !== id));
    } catch(err) {
      alert("Failed to delete announcement");
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter(u => {
    const name = u.profile?.fullName || u.name || '';
    const email = u.profile?.email || u.email || '';
    const search = searchQuery.toLowerCase();
    return name.toLowerCase().includes(search) || email.toLowerCase().includes(search) || u.id.toLowerCase().includes(search);
  });

  // Calculate Analytics
  let activeUsers = 0; let totalCourses = 0; let totalNotes = 0;
  usersList.forEach(u => {
    let active = false;
    if(u.lastSync) {
      if(((new Date() - new Date(u.lastSync)) / (1000 * 60 * 60 * 24)) <= 7) active = true;
    } 
    if (!active && (u.profile?.createdAt || u.createdAt)) {
      if(((new Date() - new Date(u.profile?.createdAt || u.createdAt)) / (1000 * 60 * 60 * 24)) <= 7) active = true;
    }
    if (active) activeUsers++;
    if(u.courses && Array.isArray(u.courses)) totalCourses += u.courses.length;
    if(u.notes && Array.isArray(u.notes)) totalNotes += u.notes.length;
  });

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="text-indigo-500" size={32} />
            Control Room
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Comprehensive app analytics, logs, and user management.</p>
        </div>
        <button 
          onClick={fetchData}
          className="btn-primary text-sm py-2 px-4 flex items-center justify-center gap-2 w-full sm:w-auto"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-8 p-1 bg-slate-100 dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          { id: 'users', label: 'User Database', icon: <Users size={18} /> },
          { id: 'announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
          { id: 'logs', label: 'Error & Activity Logs', icon: <Bug size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all flex-1 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-black text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* -------------------- USERS TAB -------------------- */}
      {activeTab === 'users' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="card-minimal p-5 bg-white dark:bg-[#111]">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl"><Users size={20} /></div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Users</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                {isLoading ? <Loader2 size={24} className="animate-spin text-slate-300" /> : usersList.length}
              </h3>
            </div>
            <div className="card-minimal p-5 bg-white dark:bg-[#111]">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl"><Activity size={20} /></div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Now (7d)</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                {isLoading ? <Loader2 size={24} className="animate-spin text-slate-300" /> : activeUsers}
              </h3>
            </div>
            <div className="card-minimal p-5 bg-white dark:bg-[#111]">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl"><BookOpen size={20} /></div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Courses Tracked</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                {isLoading ? <Loader2 size={24} className="animate-spin text-slate-300" /> : totalCourses}
              </h3>
            </div>
            <div className="card-minimal p-5 bg-white dark:bg-[#111]">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl"><FileText size={20} /></div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes Created</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                {isLoading ? <Loader2 size={24} className="animate-spin text-slate-300" /> : totalNotes}
              </h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Database</h2>
              <p className="text-sm text-slate-500 mt-1">Manage all registered accounts</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search email or name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium w-full sm:w-64 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
              <p className="text-sm font-bold uppercase tracking-widest">Loading Database</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-20 card-minimal bg-white/50 dark:bg-[#111]/50 border-dashed">
              <p className="text-slate-500 font-medium">No users found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUsers.map((u, i) => {
                const email = u.profile?.email || u.email || 'N/A';
                const name = u.profile?.fullName || u.name || 'Anonymous User';
                const rawDate = u.profile?.createdAt || u.createdAt;
                const joinedDate = rawDate ? new Date(rawDate) : null;
                const joined = joinedDate ? joinedDate.toLocaleDateString() : 'Unknown';
                const isAdmin = email === 'mdfardin6118@gmail.com';
                const isNew = joinedDate && ((new Date() - joinedDate) / (1000 * 60 * 60 * 24) <= 3); 
                
                const bytes = new Blob([JSON.stringify(u)]).size;
                let sizeText = bytes + ' B';
                if (bytes > 1024 * 1024) sizeText = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
                else if (bytes > 1024) sizeText = (bytes / 1024).toFixed(1) + ' KB';

                return (
                  <div key={i} className="card-minimal p-5 bg-white dark:bg-[#111] flex flex-col relative transition-all hover:shadow-lg hover:border-indigo-500/30">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 dark:text-white truncate text-base">{name}</h3>
                          {isAdmin && <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-black shrink-0">Admin</span>}
                          {isNew && !isAdmin && <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-black shrink-0 animate-pulse">New</span>}
                        </div>
                        <p className="text-sm text-slate-500 truncate">{email}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">ID: {u.id}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
                      <div className="bg-slate-50 dark:bg-[#151515] rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Joined</p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{joined}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#151515] rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Storage</p>
                        <p className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400">{sizeText}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setEditingUser({ id: u.id, fullName: name, email: email })} className="flex-1 btn-secondary text-xs py-2 h-auto flex items-center justify-center gap-2 text-indigo-600">
                        <Edit2 size={14} /> Edit
                      </button>
                      {!isAdmin && (
                        <>
                          <button onClick={() => setUserToWipe(u.id)} className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Wipe App Data"><RefreshCw size={16} /></button>
                          <button onClick={() => setUserToDelete(u.id)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Delete User"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- ANNOUNCEMENTS TAB -------------------- */}
      {activeTab === 'announcements' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
          <div className="card-minimal bg-white dark:bg-[#111] p-6 border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Megaphone size={20} className="text-indigo-500" /> Send Global Announcement
            </h2>
            <p className="text-sm text-slate-500 mb-6">This message will instantly appear on every student's dashboard globally until they dismiss it.</p>
            
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Message</label>
                <input 
                  required 
                  type="text" 
                  value={announcementMsg} 
                  onChange={e => setAnnouncementMsg(e.target.value)}
                  placeholder="e.g. App maintenance tonight at 10 PM. Please save your work!" 
                  className="input-field h-14" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value="info" checked={announcementType === 'info'} onChange={() => setAnnouncementType('info')} className="accent-indigo-600" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Information (Blue)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value="warning" checked={announcementType === 'warning'} onChange={() => setAnnouncementType('warning')} className="accent-amber-600" />
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-500">Warning (Orange)</span>
                  </label>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="btn-primary w-full sm:w-auto px-8 gap-2 flex items-center justify-center">
                  <Send size={18} /> Send Announcement
                </button>
              </div>
            </form>
          </div>

          <div className="card-minimal p-0 bg-white dark:bg-[#111] overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151515]">
              <h3 className="font-bold text-slate-900 dark:text-white">Announcement History</h3>
            </div>
            <div className="p-5">
              {isLoading ? (
                 <Loader2 size={24} className="animate-spin text-indigo-500 mx-auto" />
              ) : announcementsList.length === 0 ? (
                 <p className="text-center text-slate-500 py-10">No announcements sent yet.</p>
              ) : (
                <div className="space-y-4">
                  {announcementsList.map(ann => (
                    <div key={ann.id} className="flex items-start justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151515]">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${ann.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {ann.type}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{new Date(ann.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{ann.message}</p>
                      </div>
                      <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- ERROR LOGS TAB -------------------- */}
      {activeTab === 'logs' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
           <div className="card-minimal p-0 bg-white dark:bg-[#111] overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151515] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">App Error & Crash Logs</h3>
                <p className="text-xs text-slate-500 mt-1">Real-time reports of crashes experienced by users.</p>
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#151515] border-b border-slate-100 dark:border-slate-800">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Error Message</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Email</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="3" className="p-8 text-center"><Loader2 size={24} className="animate-spin text-indigo-500 mx-auto" /></td></tr>
                  ) : errorLogs.length === 0 ? (
                    <tr><td colSpan="3" className="p-12 text-center text-slate-500 font-medium"><ShieldCheck size={48} className="mx-auto mb-4 text-emerald-500 opacity-50" /> No errors logged! The app is perfectly stable.</td></tr>
                  ) : (
                    errorLogs.map((log, i) => (
                      <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-[#151515]">
                        <td className="p-4 text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-4 text-sm font-bold text-red-500 max-w-xs truncate" title={log.message}>{log.message}</td>
                        <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">{log.email}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals for Users Tab */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card-minimal w-full max-w-sm p-0 animate-in zoom-in-95 bg-white dark:bg-[#111] overflow-hidden rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151515]">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit User Profile</h2>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                <input required type="text" value={editingUser.fullName} onChange={e => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <button type="submit" className="btn-primary w-full h-11 mt-2">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {userToWipe && (
        <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card-minimal w-full max-w-sm p-6 animate-in zoom-in-95 bg-white dark:bg-[#111]">
            <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Wipe App Data?</h2>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to wipe this user's data? This erases courses and notes, but keeps their account.</p>
            <div className="flex gap-3">
              <button onClick={() => setUserToWipe(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleWipeUser} className="btn-primary flex-1 bg-amber-600 hover:bg-amber-700 border-transparent text-white">Wipe</button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card-minimal w-full max-w-sm p-6 animate-in zoom-in-95 bg-white dark:bg-[#111]">
            <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Delete User?</h2>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this user's document? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setUserToDelete(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDeleteUser} className="btn-primary flex-1 bg-red-600 hover:bg-red-700 border-transparent text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Loader2 = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
  </svg>
);
