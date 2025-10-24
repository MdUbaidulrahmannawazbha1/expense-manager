import React, { useState, useEffect } from 'react';
import { PlusCircle, Home, FileText, Trash2, DollarSign, Bell, X, Download, Upload, Moon, Sun, Calendar, Eye, Settings, List, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

function App() {
  const loadData = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [page, setPage] = useState('home');
  const [userName, setUserName] = useState(() => loadData('userName', ''));
  const [darkMode, setDarkMode] = useState(() => loadData('darkMode', false));
  const [expenses, setExpenses] = useState(() => loadData('expenses', []));
  const [people, setPeople] = useState(() => loadData('people', []));
  const [setup, setSetup] = useState(() => loadData('setup', false));
  const [categories, setCategories] = useState(() => loadData('categories', ['Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Other']));
  const [activityLog, setActivityLog] = useState(() => loadData('activityLog', []));
  
  const [newPerson, setNewPerson] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [reminderPerson, setReminderPerson] = useState('');
  const [showBackup, setShowBackup] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showPersonDetail, setShowPersonDetail] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState('Other');
  const [note, setNote] = useState('');
  const [paidBy, setPaidBy] = useState('Me');
  const [split, setSplit] = useState([]);
  const [includeMe, setIncludeMe] = useState(false);
  const [splitType, setSplitType] = useState('equal');
  const [customAmounts, setCustomAmounts] = useState({});
  const [fixedAmounts, setFixedAmounts] = useState({});
  const [useFixed, setUseFixed] = useState({});

  useEffect(() => { localStorage.setItem('userName', JSON.stringify(userName)); }, [userName]);
  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('people', JSON.stringify(people)); }, [people]);
  useEffect(() => { localStorage.setItem('setup', JSON.stringify(setup)); }, [setup]);
  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('activityLog', JSON.stringify(activityLog)); }, [activityLog]);

  const addLog = (action, details) => {
    const log = { id: Date.now(), action, details, timestamp: new Date().toISOString() };
    setActivityLog([log, ...activityLog]);
  };

  const addPerson = () => {
    if (newPerson.trim() && !people.includes(newPerson.trim())) {
      setPeople([...people, newPerson.trim()]);
      setNewPerson('');
    }
  };

  const removePerson = (p) => setPeople(people.filter(x => x !== p));

  const finishSetup = () => {
    if (!userName.trim()) return alert('Enter your name');
    if (people.length < 1) return alert('Add at least 1 person');
    setSetup(true);
  };

  const addExpense = () => {
    if (!desc || !amt) return alert('Fill description and amount');
    
    let finalSplit = [...split];
    if (includeMe && !split.includes(userName)) finalSplit.push(userName);
    
    if (finalSplit.length === 0) {
      setExpenses([...expenses, {
        id: Date.now(), desc, amt: parseFloat(amt), split: [userName],
        amounts: { [userName]: parseFloat(amt) }, date: new Date().toISOString(),
        cat, note: note.trim(), paidBy, splitType: 'personal', settled: {}
      }]);
      addLog('added', `Added expense "${desc}" - $${parseFloat(amt).toFixed(2)}`);
      resetForm();
      return;
    }

    const total = parseFloat(amt);
    let amounts = {};

    if (splitType === 'equal') {
      const perPerson = total / finalSplit.length;
      finalSplit.forEach(p => { amounts[p] = perPerson; });
    } else if (splitType === 'exact') {
      const totalCustom = Object.values(customAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      if (Math.abs(totalCustom - total) > 0.01) return alert(`Amounts must total $${total.toFixed(2)}`);
      finalSplit.forEach(p => { amounts[p] = parseFloat(customAmounts[p]) || 0; });
    } else if (splitType === 'fixed-equal') {
      let fixedTotal = 0;
      const equalPeople = [];
      finalSplit.forEach(p => {
        if (useFixed[p]) {
          fixedTotal += parseFloat(fixedAmounts[p]) || 0;
          amounts[p] = parseFloat(fixedAmounts[p]) || 0;
        } else {
          equalPeople.push(p);
        }
      });
      if (fixedTotal >= total) return alert('Fixed amounts must be less than total');
      const remaining = total - fixedTotal;
      const perPerson = equalPeople.length > 0 ? remaining / equalPeople.length : 0;
      equalPeople.forEach(p => { amounts[p] = perPerson; });
    }

    setExpenses([...expenses, {
      id: Date.now(), desc, amt: total, split: finalSplit, amounts,
      date: new Date().toISOString(), cat, note: note.trim(), paidBy, splitType, settled: {}
    }]);
    addLog('added', `Added expense "${desc}" - $${total.toFixed(2)}`);
    resetForm();
  };

  const resetForm = () => {
    setDesc(''); setAmt(''); setSplit([]); setCat('Other'); setNote('');
    setPaidBy('Me'); setIncludeMe(false); setSplitType('equal');
    setCustomAmounts({}); setFixedAmounts({}); setUseFixed({});
    setPage('home');
  };

  const deleteExpense = (id) => {
    const expense = expenses.find(e => e.id === id);
    if (window.confirm('Delete this expense?')) {
      setExpenses(expenses.filter(e => e.id !== id));
      addLog('deleted', `Deleted expense "${expense.desc}" - $${expense.amt.toFixed(2)}`);
    }
  };

  const settlePersonFromExpense = (expenseId, person) => {
    const expense = expenses.find(e => e.id === expenseId);
    setExpenses(expenses.map(e => {
      if (e.id === expenseId) {
        return { ...e, settled: { ...e.settled, [person]: true } };
      }
      return e;
    }));
    addLog('settled', `${person} settled $${expense.amounts[person].toFixed(2)} for "${expense.desc}"`);
  };

  const calcBalances = () => {
    const bal = { [userName]: 0 };
    people.forEach(p => { bal[p] = 0; });
    expenses.forEach(exp => {
      const payer = exp.paidBy === 'Me' ? userName : exp.paidBy;
      bal[payer] = (bal[payer] || 0) + exp.amt;
      Object.entries(exp.amounts).forEach(([person, amount]) => {
        if (!exp.settled || !exp.settled[person]) {
          bal[person] = (bal[person] || 0) - amount;
        }
      });
    });
    return bal;
  };

  const sendReminder = (p) => { setReminderPerson(p); setShowReminder(true); };

  const copyMsg = () => {
    const bal = calcBalances()[reminderPerson];
    const msg = `Hi ${reminderPerson}!\n\nYou owe me $${Math.abs(bal).toFixed(2)}.\n\nThanks!`;
    navigator.clipboard.writeText(msg);
    alert('Copied to clipboard!');
    setShowReminder(false);
  };

  const exportCSV = () => {
    if (expenses.length === 0) return alert('No expenses to export');
    const headers = 'Date,Description,Category,Amount,Paid By,Person,Share,Settled\n';
    const rows = expenses.flatMap(e => 
      Object.entries(e.amounts).map(([p, a]) => 
        `${new Date(e.date).toLocaleDateString()},${e.desc},${e.cat},${e.amt},${e.paidBy},${p},${a.toFixed(2)},${e.settled && e.settled[p] ? 'Yes' : 'No'}`
      )
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses-${Date.now()}.csv`;
    link.click();
  };

  const exportBackup = () => {
    const data = { userName, expenses, people, setup, categories, activityLog };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup-${Date.now()}.json`;
    link.click();
  };

  const importBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (window.confirm('Replace all data with backup?')) {
          setUserName(data.userName || '');
          setExpenses(data.expenses || []);
          setPeople(data.people || []);
          setSetup(data.setup || false);
          setCategories(data.categories || ['Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Other']);
          setActivityLog(data.activityLog || []);
          setShowBackup(false);
        }
      } catch {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (window.confirm('Delete everything? This cannot be undone!')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const clearLogs = () => {
    if (window.confirm('Clear all activity logs?')) {
      setActivityLog([]);
    }
  };

  const toggle = (p) => {
    if (split.includes(p)) {
      setSplit(split.filter(x => x !== p));
    } else {
      setSplit([...split, p]);
    }
  };

  const selectAll = () => { setSplit([...people]); setIncludeMe(true); };
  const clearAllSelection = () => { setSplit([]); setIncludeMe(false); };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const deleteCategory = (c) => {
    if (window.confirm(`Delete category "${c}"?`)) {
      setCategories(categories.filter(x => x !== c));
    }
  };

  const viewPersonDetail = (person) => { setSelectedPerson(person); setShowPersonDetail(true); };

  const getMonthlyExpenses = () => expenses.filter(e => e.date.slice(0, 7) === selectedMonth);
  const getMonthlyTotal = () => getMonthlyExpenses().reduce((sum, e) => sum + e.amt, 0);
  const getPersonExpenses = (person) => expenses.filter(e => 
    e.split.includes(person) || e.paidBy === person || (e.paidBy === 'Me' && person === userName)
  );

  const getLogIcon = (action) => {
    switch(action) {
      case 'added': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'deleted': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'settled': return <DollarSign className="w-5 h-5 text-blue-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const bg = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100';
  const card = darkMode ? 'bg-gray-800' : 'bg-white';
  const txt = darkMode ? 'text-white' : 'text-gray-800';
  const txt2 = darkMode ? 'text-gray-400' : 'text-gray-600';
  const bdr = darkMode ? 'border-gray-600' : 'border-gray-300';
  const inp = darkMode ? 'bg-gray-700 text-white' : 'bg-white';

  if (!setup) {
    return (
      <div className={`min-h-screen ${bg} p-4`}>
        <div className="max-w-2xl mx-auto pt-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1"></div>
            <div className="text-center">
              <h1 className={`text-3xl font-bold ${txt}`}>Expense Splitter</h1>
            </div>
            <div className="flex-1 flex justify-end">
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${card} shadow`}>
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className={`${card} rounded-xl shadow-lg p-6`}>
            <h2 className={`text-2xl font-bold ${txt} mb-4 text-center`}>Setup</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${txt} mb-2`}>Your Name</label>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name" className={`w-full px-4 py-2 border ${bdr} ${inp} rounded-lg`} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${txt} mb-2`}>Add People</label>
                <div className="flex gap-2">
                  <input type="text" value={newPerson} onChange={(e) => setNewPerson(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPerson()} placeholder="Friend's name"
                    className={`flex-1 px-4 py-2 border ${bdr} ${inp} rounded-lg`} />
                  <button onClick={addPerson} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Add</button>
                </div>
              </div>
              {people.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {people.map(p => (
                    <div key={p} className={`flex justify-between items-center ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
                      <span className={txt}>{p}</span>
                      <button onClick={() => removePerson(p)} className="text-red-500">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {userName && people.length >= 1 && (
                <button onClick={finishSetup} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold">
                  Start Using App
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} p-4`}>
      <div className="max-w-2xl mx-auto pt-4 pb-24">
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1"></div>
          <div className="text-center">
            <h1 className={`text-3xl font-bold ${txt}`}>Expense Splitter</h1>
            <p className={txt2}>{userName}</p>
          </div>
          <div className="flex-1 flex justify-end gap-2">
            <button onClick={() => setShowCategories(true)} className={`p-2 rounded-lg ${card} shadow`}>
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${card} shadow`}>
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {page !== 'logs' && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-4 mb-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm opacity-90">Monthly Expenses</span>
              </div>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-lg text-sm" />
            </div>
            <div className="text-3xl font-bold">${getMonthlyTotal().toFixed(2)}</div>
            <div className="text-sm opacity-90">{getMonthlyExpenses().length} expenses this month</div>
          </div>
        )}

        <div className={`${card} rounded-xl shadow-lg p-6 mb-6`}>
          {page === 'home' && (
            <div className="space-y-4">
              <h2 className={`text-2xl font-bold ${txt}`}>Expenses</h2>
              {getMonthlyExpenses().length === 0 ? (
                <div className={`text-center py-12 ${txt2}`}>
                  <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No expenses this month</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getMonthlyExpenses().map(e => (
                    <div key={e.id} className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg border ${bdr}`}>
                      <div className="flex justify-between mb-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${txt}`}>{e.desc}</h3>
                          <p className={`text-sm ${txt2}`}>
                            {new Date(e.date).toLocaleDateString()} •
                            <span className={`ml-1 ${darkMode ? 'bg-gray-600' : 'bg-blue-100'} text-blue-600 px-2 py-0.5 rounded text-xs`}>
                              {e.cat}
                            </span>
                          </p>
                        </div>
                        <button onClick={() => deleteExpense(e.id)} className="text-red-500">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="text-sm space-y-1 mb-2">
                        <p><span className={txt2}>Amount:</span> <span className="font-semibold text-green-600">${e.amt.toFixed(2)}</span></p>
                        <p><span className={txt2}>Paid by:</span> <span className="font-semibold text-blue-600">{e.paidBy === 'Me' ? userName : e.paidBy}</span></p>
                        {e.note && <p className={`text-xs ${txt2} italic`}>Note: {e.note}</p>}
                      </div>
                      <div className="mt-2 space-y-1">
                        {Object.entries(e.amounts).map(([p, a]) => (
                          <div key={p} className={`flex justify-between items-center text-sm ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} px-3 py-2 rounded`}>
                            <span className={txt}>
                              {p}
                              {e.settled && e.settled[p] && <span className="text-green-500 text-xs ml-2">✓ Settled</span>}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-green-600">${a.toFixed(2)}</span>
                              {!e.settled?.[p] && p !== (e.paidBy === 'Me' ? userName : e.paidBy) && (
                                <button onClick={() => settlePersonFromExpense(e.id, p)}
                                  className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                                  Settle
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {page === 'add' && (
            <div className="space-y-4">
              <h2 className={`text-2xl font-bold ${txt}`}>Add Expense</h2>
              <div>
                <label className={`block text-sm ${txt} mb-2`}>Who Paid?</label>
                <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className={`w-full px-4 py-2 border ${bdr} ${inp} rounded-lg`}>
                  <option value="Me">{userName}</option>
                  {people.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm ${txt} mb-2`}>Description</label>
                <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder="e.g., Dinner at restaurant" className={`w-full px-4 py-2 border ${bdr} ${inp} rounded-lg`} />
              </div>
              <div>
                <label className={`block text-sm ${txt} mb-2`}>Category</label>
                <select value={cat} onChange={(e) => setCat(e.target.value)} className={`w-full px-4 py-2 border ${bdr} ${inp} rounded-lg`}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm ${txt} mb-2`}>Amount ($)</label>
                <input type="number" step="0.01" value={amt} onChange={(e) => setAmt(e.target.value)}
                  placeholder="0.00" className={`w-full px-4 py-2 border ${bdr} ${inp} rounded-lg`} />
              </div>
              <div>
                <label className={`block text-sm ${txt} mb-2`}>Notes (Optional)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows="2"
                  placeholder="Add any notes..." className={`w-full px-4 py-2 border ${bdr} ${inp} rounded-lg`} />
              </div>
              <div>
                <label className={`block text-sm ${txt} mb-2`}>Split Type</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button onClick={() => setSplitType('equal')}
                    className={`p-3 rounded-lg border-2 ${splitType === 'equal' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : bdr}`}>
                    <div className={`font-semibold ${txt} text-sm`}>= Equal</div>
                    <div className={`text-xs ${txt2}`}>Split evenly</div>
                  </button>
                  <button onClick={() => setSplitType('exact')}
                    className={`p-3 rounded-lg border-2 ${splitType === 'exact' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : bdr}`}>
                    <div className={`font-semibold ${txt} text-sm`}>$ Custom</div>
                    <div className={`text-xs ${txt2}`}>Custom amounts</div>
                  </button>
                  <button onClick={() => setSplitType('fixed-equal')}
                    className={`p-3 rounded-lg border-2 col-span-2 ${splitType === 'fixed-equal' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : bdr}`}>
                    <div className={`font-semibold ${txt} text-sm`}>🔀 Fixed + Equal</div>
                    <div className={`text-xs ${txt2}`}>Some pay fixed, others split remaining</div>
                  </button>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-sm ${txt}`}>Split Between</label>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Select All</button>
                    <button onClick={clearAllSelection} className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">Clear All</button>
                  </div>
                </div>
                <div className={`mb-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg`}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={includeMe} onChange={(e) => setIncludeMe(e.target.checked)} className="w-5 h-5" />
                    <span className={`font-medium ${txt}`}>Include me ({userName})</span>
                  </label>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {people.map(p => (
                    <div key={p}>
                      <div className={`flex items-center gap-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                        <input type="checkbox" checked={split.includes(p)} onChange={() => toggle(p)} className="w-5 h-5" />
                        <span className={`flex-1 ${txt}`}>{p}</span>
                        {splitType === 'fixed-equal' && split.includes(p) && (
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={useFixed[p] || false}
                              onChange={(e) => setUseFixed({...useFixed, [p]: e.target.checked})} className="w-4 h-4" />
                            <span className="text-xs">Fixed</span>
                          </div>
                        )}
                      </div>
                      {split.includes(p) && splitType === 'exact' && (
                        <div className="mt-2 ml-8">
                          <input type="number" step="0.01" value={customAmounts[p] || ''}
                            onChange={(e) => setCustomAmounts({...customAmounts, [p]: e.target.value})}
                            placeholder="Amount" className={`w-full px-3 py-2 text-sm border ${bdr} ${inp} rounded-lg`} />
                        </div>
                      )}
                      {split.includes(p) && splitType === 'fixed-equal' && useFixed[p] && (
                        <div className="mt-2 ml-8">
                          <input type="number" step="0.01" value={fixedAmounts[p] || ''}
                            onChange={(e) => setFixedAmounts({...fixedAmounts, [p]: e.target.value})}
                            placeholder="Fixed amount" className={`w-full px-3 py-2 text-sm border ${bdr} ${inp} rounded-lg`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {includeMe && splitType === 'exact' && (
                  <div className="mt-2">
                    <label className={`text-sm ${txt} mb-1 block`}>Your amount</label>
                    <input type="number" step="0.01" value={customAmounts[userName] || ''}
                      onChange={(e) => setCustomAmounts({...customAmounts, [userName]: e.target.value})}
                      placeholder="Amount" className={`w-full px-3 py-2 text-sm border ${bdr} ${inp} rounded-lg`} />
                  </div>
                )}
                {includeMe && splitType === 'fixed-equal' && (
                  <div className="mt-2">
                    <label className="flex items-center gap-2 mb-2">
                      <input type="checkbox" checked={useFixed[userName] || false}
                        onChange={(e) => setUseFixed({...useFixed, [userName]: e.target.checked})} className="w-4 h-4" />
                      <span className={`text-sm ${txt}`}>Fixed amount for you</span>
                    </label>
                    {useFixed[userName] && (
                      <input type="number" step="0.01" value={fixedAmounts[userName] || ''}
                        onChange={(e) => setFixedAmounts({...fixedAmounts, [userName]: e.target.value})}
                        placeholder="Fixed amount" className={`w-full px-3 py-2 text-sm border ${bdr} ${inp} rounded-lg`} />
                    )}
                  </div>
                )}
                {split.length === 0 && !includeMe && (
                  <p className={`text-xs ${txt2} mt-2 p-2 ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'} rounded`}>
                    💡 No one selected = Personal expense
                  </p>
                )}
                {splitType === 'exact' && amt && (split.length > 0 || includeMe) && (
                  <div className={`mt-2 p-2 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded text-xs ${txt2}`}>
                    Total: ${Object.values(customAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)} (must be ${parseFloat(amt).toFixed(2)})
                  </div>
                )}
                {splitType === 'fixed-equal' && amt && (split.length > 0 || includeMe) && (
                  <div className={`mt-2 p-2 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded text-xs ${txt2}`}>
                    Fixed: ${Object.values(fixedAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)} | Remaining: ${(parseFloat(amt) - Object.values(fixedAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)).toFixed(2)}
                  </div>
                )}
              </div>
              <button onClick={addExpense} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                Add Expense
              </button>
            </div>
          )}

          {page === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-bold ${txt}`}>Activity Logs</h2>
                {activityLog.length > 0 && (
                  <button onClick={clearLogs} className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">
                    Clear Logs
                  </button>
                )}
              </div>
              {activityLog.length === 0 ? (
                <div className={`text-center py-12 ${txt2}`}>
                  <List className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} p-3 rounded-lg mb-4`}>
                    <h3 className={`font-semibold ${txt} mb-2`}>Activity Timeline</h3>
                    <p className={`text-xs ${txt2}`}>{activityLog.length} total activities</p>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {activityLog.map((log) => (
                      <div key={log.id} className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg border ${bdr}`}>
                        <div className="flex items-start gap-3">
                          {getLogIcon(log.action)}
                          <div className="flex-1">
                            <p className={`text-sm ${txt} font-medium capitalize`}>{log.action}</p>
                            <p className={`text-sm ${txt2}`}>{log.details}</p>
                            <p className={`text-xs ${txt2} mt-1`}>
                              {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg mt-4`}>
                    <h3 className={`font-semibold ${txt} mb-2`}>All Expenses History</h3>
                    <p className={`text-xs ${txt2} mb-3`}>Complete expense history across all months</p>
                    {expenses.length === 0 ? (
                      <p className={`text-center ${txt2} py-4`}>No expenses recorded</p>
                    ) : (
                      <div className="space-y-2">
                        {expenses.map(e => (
                          <div key={e.id} className={`${darkMode ? 'bg-gray-600' : 'bg-white'} p-3 rounded-lg`}>
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h4 className={`font-semibold ${txt} text-sm`}>{e.desc}</h4>
                                <p className={`text-xs ${txt2}`}>{new Date(e.date).toLocaleDateString()} • {e.cat}</p>
                              </div>
                              <span className="font-semibold text-green-600 text-sm">${e.amt.toFixed(2)}</span>
                            </div>
                            <div className="text-xs">
                              <p className={txt2}>Paid by: <span className="text-blue-600">{e.paidBy === 'Me' ? userName : e.paidBy}</span></p>
                              <p className={txt2}>Split: {Object.keys(e.amounts).join(', ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {page === 'summary' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-bold ${txt}`}>Summary</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowBackup(true)} className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600">
                    <Upload className="w-4 h-4" />
                  </button>
                  <button onClick={exportCSV} className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={clearAll} className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(calcBalances()).map(([p, bal]) => (
                  p !== userName && (
                    <div key={p} className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg border ${bdr}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <span className={`font-medium ${txt}`}>{p}</span>
                          <span className={`ml-3 font-semibold ${bal < 0 ? 'text-red-600' : bal > 0 ? 'text-green-600' : txt2}`}>
                            {bal < 0 ? `Owes ${Math.abs(bal).toFixed(2)}` : bal > 0 ? `You owe ${bal.toFixed(2)}` : 'Settled'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => viewPersonDetail(p)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">
                            <Eye className="w-4 h-4" />
                          </button>
                          {bal < -0.01 && (
                            <button onClick={() => sendReminder(p)} className="px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600">
                              <Bell className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg shadow-lg">
                <div className="text-sm opacity-90">Your Balance</div>
                <div className="text-3xl font-bold">
                  {calcBalances()[userName] >= 0 ? '+' : '-'}${Math.abs(calcBalances()[userName] || 0).toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`fixed bottom-0 left-0 right-0 ${card} shadow-lg p-2 flex justify-around border-t ${bdr}`}>
          <button onClick={() => setPage('home')} className={`flex flex-col items-center p-3 rounded-lg flex-1 ${page === 'home' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900' : txt2}`}>
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button onClick={() => setPage('add')} className={`flex flex-col items-center p-3 rounded-lg flex-1 ${page === 'add' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900' : txt2}`}>
            <PlusCircle className="w-6 h-6" />
            <span className="text-xs mt-1">Add</span>
          </button>
          <button onClick={() => setPage('logs')} className={`flex flex-col items-center p-3 rounded-lg flex-1 ${page === 'logs' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900' : txt2}`}>
            <List className="w-6 h-6" />
            <span className="text-xs mt-1">Logs</span>
          </button>
          <button onClick={() => setPage('summary')} className={`flex flex-col items-center p-3 rounded-lg flex-1 ${page === 'summary' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900' : txt2}`}>
            <FileText className="w-6 h-6" />
            <span className="text-xs mt-1">Summary</span>
          </button>
        </div>
      </div>

      {showReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${card} rounded-xl p-6 max-w-md w-full`}>
            <h3 className={`text-xl font-bold ${txt} mb-4`}>Send Reminder</h3>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg mb-4`}>
              <p className={`text-sm ${txt} whitespace-pre-line`}>
                Hi {reminderPerson}!{'\n\n'}You owe me ${Math.abs(calcBalances()[reminderPerson] || 0).toFixed(2)}.{'\n\n'}Thanks!
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={copyMsg} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Copy Message</button>
              <button onClick={() => setShowReminder(false)} className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${card} rounded-xl p-6 max-w-md w-full`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${txt}`}>Backup & Restore</h3>
              <button onClick={() => setShowBackup(false)} className={txt2}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} p-4 rounded-lg`}>
                <h4 className={`font-semibold ${txt} mb-2`}>Export Backup</h4>
                <button onClick={exportBackup} className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700">
                  <Download className="w-5 h-5" />Download JSON
                </button>
              </div>
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-green-50'} p-4 rounded-lg`}>
                <h4 className={`font-semibold ${txt} mb-2`}>Import Backup</h4>
                <label className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-green-700">
                  <Upload className="w-5 h-5" />Upload JSON
                  <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCategories && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${card} rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${txt}`}>Manage Categories</h3>
              <button onClick={() => setShowCategories(false)} className={txt2}><X className="w-6 h-6" /></button>
            </div>
            <div className="mb-4">
              <div className="flex gap-2">
                <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()} placeholder="New category"
                  className={`flex-1 px-4 py-2 border ${bdr} ${inp} rounded-lg`} />
                <button onClick={addCategory} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
              </div>
            </div>
            <div className="space-y-2">
              {categories.map(c => (
                <div key={c} className={`flex justify-between items-center ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
                  <span className={txt}>{c}</span>
                  <button onClick={() => deleteCategory(c)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPersonDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${card} rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${txt}`}>{selectedPerson}'s Expenses</h3>
              <button onClick={() => setShowPersonDetail(false)} className={txt2}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-3">
              {getPersonExpenses(selectedPerson).length === 0 ? (
                <p className={`text-center ${txt2} py-8`}>No expenses found</p>
              ) : (
                getPersonExpenses(selectedPerson).map(e => (
                  <div key={e.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className={`font-semibold ${txt}`}>{e.desc}</h4>
                        <p className={`text-xs ${txt2}`}>{new Date(e.date).toLocaleDateString()} • {e.cat}</p>
                      </div>
                      <span className="font-semibold text-green-600">${e.amt.toFixed(2)}</span>
                    </div>
                    <div className="text-sm">
                      <p className={txt2}>Paid by: <span className="text-blue-600">{e.paidBy === 'Me' ? userName : e.paidBy}</span></p>
                      {e.amounts[selectedPerson] && (
                        <p className={txt2}>
                          {selectedPerson}'s share: <span className="text-green-600">${e.amounts[selectedPerson].toFixed(2)}</span>
                          {e.settled && e.settled[selectedPerson] && <span className="text-green-500 ml-2">✓ Settled</span>}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;