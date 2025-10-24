import React, { useState, useEffect } from 'react';
import { PlusCircle, Home, FileText, Trash2, DollarSign, Bell, X, Download, Upload, Moon, Sun } from 'lucide-react';

function App() {
  // Load from localStorage with fallback
  const loadData = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [currentPage, setCurrentPage] = useState('home');
  const [userName, setUserName] = useState(() => loadData('userName', ''));
  const [darkMode, setDarkMode] = useState(() => loadData('darkMode', false));
  const [expenses, setExpenses] = useState(() => loadData('expenses', []));
  const [people, setPeople] = useState(() => loadData('people', []));
  const [setupComplete, setSetupComplete] = useState(() => loadData('setupComplete', false));
  
  const defaultCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Other'];
  const [categories, setCategories] = useState(() => loadData('categories', defaultCategories));
  
  const [newPersonName, setNewPersonName] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [reminderPerson, setReminderPerson] = useState('');
  const [showBackupRestore, setShowBackupRestore] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Other');
  const [notes, setNotes] = useState('');
  const [paidBy, setPaidBy] = useState('Me');
  const [splitWith, setSplitWith] = useState([]);
  const [includeMeInSplit, setIncludeMeInSplit] = useState(false);
  const [splitMode, setSplitMode] = useState('equal');
  const [customAmounts, setCustomAmounts] = useState({});

  // Save to localStorage
  useEffect(() => { localStorage.setItem('userName', JSON.stringify(userName)); }, [userName]);
  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('people', JSON.stringify(people)); }, [people]);
  useEffect(() => { localStorage.setItem('setupComplete', JSON.stringify(setupComplete)); }, [setupComplete]);
  useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);

  const addPerson = () => {
    if (newPersonName.trim() && !people.includes(newPersonName.trim())) {
      setPeople([...people, newPersonName.trim()]);
      setNewPersonName('');
    }
  };

  const removePerson = (person) => {
    setPeople(people.filter(p => p !== person));
  };

  const completeSetup = () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (people.length < 1) {
      alert('Please add at least 1 person');
      return;
    }
    setSetupComplete(true);
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const clearAllData = () => {
    if (window.confirm('Delete all data?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const exportToCSV = () => {
    if (expenses.length === 0) {
      alert('No expenses to export');
      return;
    }
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Paid By', 'Person', 'Share'];
    const rows = [];
    expenses.forEach(exp => {
      const date = new Date(exp.date).toLocaleDateString();
      Object.entries(exp.splitAmounts).forEach(([person, amt]) => {
        rows.push([date, exp.description, exp.category, exp.amount, exp.paidBy || 'Me', person, amt.toFixed(2)]);
      });
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses-${Date.now()}.csv`;
    link.click();
  };

  const exportBackup = () => {
    const data = { userName, expenses, people, categories, setupComplete };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
        if (window.confirm('Replace all data?')) {
          setUserName(data.userName || '');
          setExpenses(data.expenses || []);
          setPeople(data.people || []);
          setCategories(data.categories || defaultCategories);
          setSetupComplete(data.setupComplete || false);
          setShowBackupRestore(false);
        }
      } catch {
        alert('Invalid file');
      }
    };
    reader.readAsText(file);
  };

  const addExpense = () => {
    if (!description || !amount) {
      alert('Fill description and amount');
      return;
    }

    let finalSplitWith = [...splitWith];
    if (includeMeInSplit && !splitWith.includes(userName)) {
      finalSplitWith.push(userName);
    }

    // Personal expense
    if (finalSplitWith.length === 0) {
      const exp = {
        id: Date.now(),
        description,
        amount: parseFloat(amount),
        splitWith: [userName],
        splitAmounts: { [userName]: parseFloat(amount) },
        splitMode: 'personal',
        date: new Date().toISOString(),
        category: selectedCategory,
        notes: notes.trim(),
        paidBy: paidBy
      };
      setExpenses([...expenses, exp]);
      resetForm();
      return;
    }

    let splitAmounts = {};
    const total = parseFloat(amount);

    if (splitMode === 'equal') {
      const perPerson = total / finalSplitWith.length;
      finalSplitWith.forEach(p => { splitAmounts[p] = perPerson; });
    } else if (splitMode === 'custom') {
      const totalCustom = finalSplitWith.reduce((sum, p) => sum + (parseFloat(customAmounts[p]) || 0), 0);
      if (Math.abs(totalCustom - total) > 0.01) {
        alert('Custom amounts must equal total');
        return;
      }
      splitAmounts = { ...customAmounts };
    }

    const exp = {
      id: Date.now(),
      description,
      amount: total,
      splitWith: finalSplitWith,
      splitAmounts,
      splitMode,
      date: new Date().toISOString(),
      category: selectedCategory,
      notes: notes.trim(),
      paidBy: paidBy
    };

    setExpenses([...expenses, exp]);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setSplitWith([]);
    setSplitMode('equal');
    setCustomAmounts({});
    setSelectedCategory('Other');
    setNotes('');
    setPaidBy('Me');
    setIncludeMeInSplit(false);
    setCurrentPage('home');
  };

  const deleteExpense = (id) => {
    if (window.confirm('Delete expense?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const calculateBalances = () => {
    const balances = { [userName]: 0 };
    people.forEach(p => { balances[p] = 0; });

    expenses.forEach(exp => {
      const payer = exp.paidBy === 'Me' ? userName : exp.paidBy;
      balances[payer] = (balances[payer] || 0) + exp.amount;
      Object.entries(exp.splitAmounts).forEach(([person, amt]) => {
        balances[person] = (balances[person] || 0) - amt;
      });
    });

    return balances;
  };

  const sendReminder = (person) => {
    setReminderPerson(person);
    setShowReminder(true);
  };

  const copyReminder = () => {
    const balance = calculateBalances()[reminderPerson];
    const msg = `Hi ${reminderPerson}!\n\nYou owe me $${Math.abs(balance).toFixed(2)} for shared expenses.\n\nThanks!`;
    navigator.clipboard.writeText(msg);
    alert('Copied!');
    setShowReminder(false);
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setSelectedCategory(newCategory.trim());
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const toggleSplitWith = (person) => {
    if (splitWith.includes(person)) {
      setSplitWith(splitWith.filter(p => p !== person));
      const newCustom = { ...customAmounts };
      delete newCustom[person];
      setCustomAmounts(newCustom);
    } else {
      setSplitWith([...splitWith, person]);
    }
  };

  const bg = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100';
  const card = darkMode ? 'bg-gray-800' : 'bg-white';
  const text = darkMode ? 'text-white' : 'text-gray-800';
  const text2 = darkMode ? 'text-gray-400' : 'text-gray-600';
  const border = darkMode ? 'border-gray-600' : 'border-gray-300';
  const input = darkMode ? 'bg-gray-700 text-white' : 'bg-white';

  if (!setupComplete) {
    return (
      <div className={`min-h-screen ${bg} p-4`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6 pt-4">
            <div className="flex-1"></div>
            <div className="text-center">
              <h1 className={`text-3xl font-bold ${text}`}>Expense Splitter</h1>
              <p className={text2}>Track and split expenses</p>
            </div>
            <div className="flex-1 flex justify-end">
              <button onClick={toggleDarkMode} className={`p-2 rounded-lg ${card} shadow`}>
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className={`${card} rounded-xl shadow-lg p-6`}>
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className={`text-2xl font-bold ${text} mb-2`}>Welcome!</h2>
                <p className={text2}>Set up your expense tracker</p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${text} mb-2`}>Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className={`w-full px-4 py-2 border ${border} ${input} rounded-lg`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${text} mb-2`}>Add People</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPerson()}
                    placeholder="Friend's name"
                    className={`flex-1 px-4 py-2 border ${border} ${input} rounded-lg`}
                  />
                  <button onClick={addPerson} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Add
                  </button>
                </div>
              </div>

              {people.length > 0 && (
                <div className="space-y-2">
                  {people.map(p => (
                    <div key={p} className={`flex justify-between items-center ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
                      <span className={text}>{p}</span>
                      <button onClick={() => removePerson(p)} className="text-red-500">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {userName && people.length >= 1 && (
                <button onClick={completeSetup} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
                  Start Tracking Expenses
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
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6 pt-4">
          <div className="flex-1"></div>
          <div className="text-center">
            <h1 className={`text-3xl font-bold ${text}`}>Expense Splitter</h1>
            <p className={text2}>Welcome, {userName}</p>
          </div>
          <div className="flex-1 flex justify-end">
            <button onClick={toggleDarkMode} className={`p-2 rounded-lg ${card} shadow`}>
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className={`${card} rounded-xl shadow-lg p-6 mb-6`}>
          {currentPage === 'home' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-bold ${text}`}>Expenses</h2>
                <div className={`text-sm ${text2}`}>
                  Total: ${expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </div>
              </div>

              {expenses.length === 0 ? (
                <div className={`text-center py-12 ${text2}`}>
                  <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No expenses yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map(exp => (
                    <div key={exp.id} className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg border ${border}`}>
                      <div className="flex justify-between mb-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${text}`}>{exp.description}</h3>
                          <p className={`text-sm ${text2}`}>
                            {new Date(exp.date).toLocaleDateString()} • {exp.category}
                          </p>
                        </div>
                        <button onClick={() => deleteExpense(exp.id)} className="text-red-500">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="text-sm space-y-1">
                        <p><span className={text2}>Amount:</span> <span className="font-semibold text-green-600">${exp.amount.toFixed(2)}</span></p>
                        <p><span className={text2}>Paid by:</span> <span className="font-semibold text-blue-600">{exp.paidBy === 'Me' ? userName : exp.paidBy}</span></p>
                        {exp.notes && <p className={`italic ${text2}`}>Note: {exp.notes}</p>}
                      </div>

                      <div className="mt-2 space-y-1">
                        {Object.entries(exp.splitAmounts).map(([person, amt]) => (
                          <div key={person} className={`flex justify-between text-sm ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} px-3 py-2 rounded`}>
                            <span className={text}>{person}</span>
                            <span className="font-semibold text-green-600">${amt.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentPage === 'add' && (
            <div className="space-y-4">
              <h2 className={`text-2xl font-bold ${text} mb-4`}>Add Expense</h2>

              <div>
                <label className={`block text-sm font-medium ${text} mb-2`}>Who Paid?</label>
                <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className={`w-full px-4 py-2 border ${border} ${input} rounded-lg`}>
                  <option value="Me">{userName}</option>
                  {people.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${text} mb-2`}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Dinner"
                  className={`w-full px-4 py-2 border ${border} ${input} rounded-lg`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${text} mb-2`}>Category</label>
                <div className="flex gap-2">
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={`flex-1 px-4 py-2 border ${border} ${input} rounded-lg`}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => setShowAddCategory(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg">+</button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${text} mb-2`}>Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-4 py-2 border ${border} ${input} rounded-lg`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${text} mb-2`}>Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows="2"
                  className={`w-full px-4 py-2 border ${border} ${input} rounded-lg`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${text} mb-2`}>Split Mode</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="equal" checked={splitMode === 'equal'} onChange={(e) => setSplitMode(e.target.value)} />
                    <span className={text}>Equal Split</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" value="custom" checked={splitMode === 'custom'} onChange={(e) => setSplitMode(e.target.value)} />
                    <span className={text}>Custom Amounts</span>
                  </label>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${text} mb-2`}>Split Between</label>
                
                <div className={`mb-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg`}>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={includeMeInSplit} onChange={(e) => setIncludeMeInSplit(e.target.checked)} className="w-5 h-5" />
                    <span className={`font-medium ${text}`}>Include me ({userName})</span>
                  </label>
                  <p className={`text-xs ${text2} mt-1 ml-7`}>
                    {includeMeInSplit ? 'You will pay your share' : 'Only others will split'}
                  </p>
                </div>

                <div className="space-y-2">
                  {people.map(person => (
                    <label key={person} className={`flex items-center gap-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg cursor-pointer`}>
                      <input type="checkbox" checked={splitWith.includes(person)} onChange={() => toggleSplitWith(person)} className="w-5 h-5" />
                      <span className={`flex-1 ${text}`}>{person}</span>
                      {splitMode === 'custom' && splitWith.includes(person) && (
                        <input
                          type="number"
                          step="0.01"
                          value={customAmounts[person] || ''}
                          onChange={(e) => setCustomAmounts({...customAmounts, [person]: e.target.value})}
                          placeholder="0.00"
                          className="w-24 px-2 py-1 border rounded text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </label>
                  ))}
                </div>

                {splitWith.length === 0 && !includeMeInSplit && (
                  <p className={`text-xs ${text2} mt-2 p-2 ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'} rounded`}>
                    💡 No one selected = Personal expense
                  </p>
                )}
              </div>

              <button onClick={addExpense} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                Add Expense
              </button>
            </div>
          )}

          {currentPage === 'summary' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className={`text-2xl font-bold ${text}`}>Summary</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowBackupRestore(true)} className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg flex items-center gap-1">
                    <Upload className="w-4 h-4" />
                  </button>
                  <button onClick={exportToCSV} className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg flex items-center gap-1">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={clearAllData} className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg flex items-center gap-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {Object.entries(calculateBalances()).map(([person, balance]) => (
                  person !== userName && (
                    <div key={person} className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg border ${border}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className={`font-medium ${text}`}>{person}</span>
                          <span className={`ml-3 font-semibold ${balance < 0 ? 'text-red-600' : balance > 0 ? 'text-green-600' : text2}`}>
                            {balance < 0 ? `Owes $${Math.abs(balance).toFixed(2)}` : balance > 0 ? `You owe $${balance.toFixed(2)}` : 'Settled'}
                          </span>
                        </div>
                        {balance < -0.01 && (
                          <button onClick={() => sendReminder(person)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg flex items-center gap-1">
                            <Bell className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg">
                <div className="text-sm opacity-90">Your Balance</div>
                <div className="text-3xl font-bold">
                  {calculateBalances()[userName] >= 0 ? '+' : '-'}${Math.abs(calculateBalances()[userName] || 0).toFixed(2)}
                </div>
                <div className="text-xs opacity-90 mt-1">
                  {calculateBalances()[userName] > 0 ? 'People owe you' : calculateBalances()[userName] < 0 ? 'You owe money' : 'All settled!'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`${card} rounded-xl shadow-lg p-2 flex justify-around`}>
          <button onClick={() => setCurrentPage('home')} className={`flex flex-col items-center p-3 rounded-lg flex-1 ${currentPage === 'home' ? 'bg-blue-100 text-blue-600' : text2}`}>
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs">Home</span>
          </button>
          <button onClick={() => setCurrentPage('add')} className={`flex flex-col items-center p-3 rounded-lg flex-1 ${currentPage === 'add' ? 'bg-blue-100 text-blue-600' : text2}`}>
            <PlusCircle className="w-6 h-6 mb-1" />
            <span className="text-xs">Add</span>
          </button>
          <button onClick={() => setCurrentPage('summary')} className={`flex flex-col items-center p-3 rounded-lg flex-1 ${currentPage === 'summary' ? 'bg-blue-100 text-blue-600' : text2}`}>
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs">Summary</span>
          </button>
        </div>
      </div>

      {showReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${card} rounded-xl shadow-2xl p-6 max-w-md w-full`}>
            <h3 className={`text-xl font-bold ${text} mb-4`}>Reminder for {reminderPerson}</h3>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg mb-4`}>
              <p className={`text-sm ${text}`}>
                Hi {reminderPerson}!{'\n\n'}
                You owe me ${Math.abs(calculateBalances()[reminderPerson] || 0).toFixed(2)}.{'\n\n'}
                Thanks!
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={copyReminder} className="flex-1 bg-blue-600 text-white py-2 rounded-lg">Copy</button>
              <button onClick={() => setShowReminder(false)} className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${card} rounded-xl shadow-2xl p-6 max-w-md w-full`}>
            <h3 className={`text-xl font-bold ${text} mb-4`}>Add Category</h3>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              placeholder="Category name"
              className={`w-full px-4 py-2 border ${border} ${input} rounded-lg mb-4`}
            />
            <div className="flex gap-3">
              <button onClick={addCategory} className="flex-1 bg-green-600 text-white py-2 rounded-lg">Add</button>
              <button onClick={() => { setShowAddCategory(false); setNewCategory(''); }} className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showBackupRestore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${card} rounded-xl shadow-2xl p-6 max-w-md w-full`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${text}`}>Backup & Restore</h3>
              <button onClick={() => setShowBackupRestore(false)} className={text2}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} p-4 rounded-lg`}>
                <h4 className={`font-semibold ${text} mb-2`}>Export Backup</h4>
                <p className={`text-sm ${text2} mb-3`}>Download all your data</p>
                <button onClick={exportBackup} className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Download
                </button>
              </div>

              <div className={`${darkMode ? 'bg-gray-700' : 'bg-green-50'} p-4 rounded-lg`}>
                <h4 className={`font-semibold ${text} mb-2`}>Import Backup</h4>
                <p className={`text-sm ${text2} mb-3`}>Restore from backup file</p>
                <label className="w-full bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  Upload
                  <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;