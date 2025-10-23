import React, { useState, useEffect } from 'react';
import { PlusCircle, Home, FileText, Users, Trash2, DollarSign, Bell, X, Download, Upload, Moon, Sun } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.error('Error loading darkMode:', error);
      return false;
    }
  });
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('expenses');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading expenses:', error);
      return [];
    }
  });
  const [people, setPeople] = useState(() => {
    try {
      const saved = localStorage.getItem('people');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading people:', error);
      return [];
    }
  });
  const [setupComplete, setSetupComplete] = useState(() => {
    try {
      const saved = localStorage.getItem('setupComplete');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.error('Error loading setupComplete:', error);
      return false;
    }
  });
  const [newPersonName, setNewPersonName] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [reminderPerson, setReminderPerson] = useState('');
  const [showPersonDetails, setShowPersonDetails] = useState(false);
  const [selectedPersonForDetails, setSelectedPersonForDetails] = useState('');
  const [showBackupRestore, setShowBackupRestore] = useState(false);
  
  const defaultCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Other'];
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('categories');
      return saved ? JSON.parse(saved) : defaultCategories;
    } catch (error) {
      console.error('Error loading categories:', error);
      return defaultCategories;
    }
  });
  const [selectedCategory, setSelectedCategory] = useState('Other');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitWith, setSplitWith] = useState([]);
  const [splitMode, setSplitMode] = useState('equal');
  const [customAmounts, setCustomAmounts] = useState({});
  const [notes, setNotes] = useState('');
  const [multiFixedAmounts, setMultiFixedAmounts] = useState({});

  // Save to localStorage with error handling
  useEffect(() => {
    try {
      localStorage.setItem('expenses', JSON.stringify(expenses));
      console.log('✅ Saved expenses:', expenses.length, 'items');
    } catch (error) {
      console.error('❌ Error saving expenses:', error);
      alert('Failed to save expenses! Storage may be full or disabled.');
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('people', JSON.stringify(people));
      console.log('✅ Saved people:', people.length, 'items');
    } catch (error) {
      console.error('❌ Error saving people:', error);
    }
  }, [people]);

  useEffect(() => {
    try {
      localStorage.setItem('setupComplete', JSON.stringify(setupComplete));
      console.log('✅ Saved setupComplete:', setupComplete);
    } catch (error) {
      console.error('❌ Error saving setupComplete:', error);
    }
  }, [setupComplete]);

  useEffect(() => {
    try {
      localStorage.setItem('categories', JSON.stringify(categories));
      console.log('✅ Saved categories:', categories.length, 'items');
    } catch (error) {
      console.error('❌ Error saving categories:', error);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
      console.log('✅ Saved darkMode:', darkMode);
    } catch (error) {
      console.error('❌ Error saving darkMode:', error);
    }
  }, [darkMode]);

  const addPerson = () => {
    if (newPersonName.trim() && !people.includes(newPersonName.trim())) {
      setPeople([...people, newPersonName.trim()]);
      setNewPersonName('');
    }
  };

  const removePerson = (personToRemove) => {
    setPeople(people.filter(p => p !== personToRemove));
  };

  const completeSetup = () => {
    if (people.length < 2) {
      alert('Please add at least 2 people');
      return;
    }
    setSetupComplete(true);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ This will delete ALL data. Are you sure?')) {
      localStorage.clear();
      setExpenses([]);
      setPeople([]);
      setCategories(defaultCategories);
      setSetupComplete(false);
      setDarkMode(false);
      setCurrentPage('home');
      alert('All data cleared!');
    }
  };

  const exportToCSV = () => {
    if (expenses.length === 0) {
      alert('No expenses to export!');
      return;
    }

    const headers = ['Date', 'Time', 'Description', 'Category', 'Total', 'Person', 'Amount', 'Notes'];
    const rows = [];

    expenses.forEach(expense => {
      const date = new Date(expense.date);
      Object.entries(expense.splitAmounts).forEach(([person, amt]) => {
        rows.push([
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          expense.description,
          expense.category,
          expense.amount.toFixed(2),
          person,
          amt.toFixed(2),
          expense.notes || ''
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    alert('CSV exported successfully!');
  };

  const exportBackup = () => {
    const backupData = {
      expenses,
      people,
      categories,
      setupComplete,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    alert('Backup downloaded!');
  };

  const importBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.expenses && data.people) {
          if (window.confirm('Replace all current data?')) {
            setExpenses(data.expenses || []);
            setPeople(data.people || []);
            setCategories(data.categories || defaultCategories);
            setSetupComplete(data.setupComplete || false);
            alert('Backup restored!');
            setShowBackupRestore(false);
          }
        } else {
          alert('Invalid backup file!');
        }
      } catch {
        alert('Error reading file!');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const addExpense = () => {
    if (!description || !amount || splitWith.length === 0) {
      alert('Please fill all fields');
      return;
    }

    let splitAmounts = {};
    const totalAmount = parseFloat(amount);

    if (splitMode === 'equal') {
      const perPerson = totalAmount / splitWith.length;
      splitWith.forEach(person => {
        splitAmounts[person] = perPerson;
      });
    } else if (splitMode === 'custom') {
      const totalCustom = splitWith.reduce((sum, person) => sum + (parseFloat(customAmounts[person]) || 0), 0);
      if (Math.abs(totalCustom - totalAmount) > 0.01) {
        alert('Custom amounts must equal total!');
        return;
      }
      splitAmounts = { ...customAmounts };
    } else if (splitMode === 'fixed-plus-equal') {
      const totalFixed = Object.values(multiFixedAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
      if (totalFixed >= totalAmount) {
        alert('Fixed amounts too high!');
        return;
      }
      const fixedPeople = Object.keys(multiFixedAmounts).filter(p => multiFixedAmounts[p] && parseFloat(multiFixedAmounts[p]) > 0);
      if (fixedPeople.length === 0) {
        alert('Assign at least one fixed amount!');
        return;
      }
      const remaining = totalAmount - totalFixed;
      const otherPeople = splitWith.filter(p => !fixedPeople.includes(p));
      if (otherPeople.length === 0) {
        alert('Need people to split remaining!');
        return;
      }
      const perPerson = remaining / otherPeople.length;
      fixedPeople.forEach(p => {
        splitAmounts[p] = parseFloat(multiFixedAmounts[p]);
      });
      otherPeople.forEach(p => {
        splitAmounts[p] = perPerson;
      });
    }

    const newExpense = {
      id: Date.now(),
      description,
      amount: totalAmount,
      splitWith: [...splitWith],
      splitAmounts,
      splitMode,
      date: new Date().toISOString(),
      category: selectedCategory,
      notes: notes.trim()
    };

    setExpenses([...expenses, newExpense]);
    setDescription('');
    setAmount('');
    setSplitWith([]);
    setSplitMode('equal');
    setCustomAmounts({});
    setSelectedCategory('Other');
    setNotes('');
    setMultiFixedAmounts({});
    setCurrentPage('home');
  };

  const deleteExpense = (id) => {
    if (window.confirm('Delete this expense?')) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  const settlePersonFromExpense = (expenseId, person) => {
    if (window.confirm(`Mark ${person} as settled?`)) {
      setExpenses(expenses.map(exp => {
        if (exp.id === expenseId) {
          const newSplitWith = exp.splitWith.filter(p => p !== person);
          const newSplitAmounts = { ...exp.splitAmounts };
          delete newSplitAmounts[person];
          if (newSplitWith.length === 0) return null;
          return { ...exp, splitWith: newSplitWith, splitAmounts: newSplitAmounts };
        }
        return exp;
      }).filter(exp => exp !== null));
    }
  };

  const toggleSplitWith = (person) => {
    if (splitWith.includes(person)) {
      setSplitWith(splitWith.filter(p => p !== person));
      const newCustom = { ...customAmounts };
      delete newCustom[person];
      setCustomAmounts(newCustom);
      const newFixed = { ...multiFixedAmounts };
      delete newFixed[person];
      setMultiFixedAmounts(newFixed);
    } else {
      setSplitWith([...splitWith, person]);
    }
  };

  const selectAllPeople = () => {
    setSplitWith([...people]);
    if (splitMode === 'custom' && amount) {
      const perPerson = parseFloat(amount) / people.length;
      const newCustom = {};
      people.forEach(p => {
        newCustom[p] = perPerson.toFixed(2);
      });
      setCustomAmounts(newCustom);
    }
  };

  const calculateBalances = () => {
    const balances = { Me: 0 };
    people.forEach(p => {
      balances[p] = 0;
    });

    expenses.forEach(exp => {
      balances['Me'] += exp.amount;
      Object.entries(exp.splitAmounts).forEach(([person, amt]) => {
        balances[person] -= amt;
      });
    });

    return balances;
  };

  const sendReminder = (person) => {
    setReminderPerson(person);
    setShowReminder(true);
  };

  const copyReminderMessage = () => {
    const balances = calculateBalances();
    const owed = Math.abs(balances[reminderPerson]);
    const msg = `Hi ${reminderPerson}! 👋\n\nFriendly reminder: You owe me $${owed.toFixed(2)} for shared expenses.\n\nPlease settle up when you can. Thanks! 😊`;
    navigator.clipboard.writeText(msg).then(() => {
      alert('Message copied!');
      setShowReminder(false);
    });
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setSelectedCategory(newCategory.trim());
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const deleteCategory = (cat) => {
    if (defaultCategories.includes(cat)) {
      alert('Cannot delete default categories!');
      return;
    }
    if (window.confirm(`Delete category "${cat}"?`)) {
      setCategories(categories.filter(c => c !== cat));
      if (selectedCategory === cat) setSelectedCategory('Other');
    }
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-800';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-600' : 'border-gray-300';
  const inputBg = darkMode ? 'bg-gray-700 text-white' : 'bg-white';

  if (!setupComplete) {
    return (
      <div className={`min-h-screen ${bgClass} p-4`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6 pt-4">
            <div className="flex-1"></div>
            <div className="text-center">
              <h1 className={`text-3xl font-bold ${textPrimary} mb-2`}>Expense Splitter</h1>
              <p className={textSecondary}>Track and split expenses</p>
            </div>
            <div className="flex-1 flex justify-end">
              <button onClick={toggleDarkMode} className={`p-2 rounded-lg ${cardBg} shadow-lg`}>
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className={`${cardBg} rounded-xl shadow-lg p-6`}>
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>Welcome!</h2>
                <p className={textSecondary}>Add people to split expenses with</p>
              </div>

              <div className="space-y-3">
                <label className={`block text-sm font-medium ${textPrimary}`}>Add Person</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                    placeholder="Enter name"
                    className={`flex-1 px-4 py-2 border ${borderColor} ${inputBg} rounded-lg focus:ring-2 focus:ring-blue-500`}
                  />
                  <button onClick={addPerson} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Add
                  </button>
                </div>
              </div>

              {people.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-3`}>
                    People ({people.length})
                  </label>
                  <div className="space-y-2">
                    {people.map(person => (
                      <div key={person} className={`flex justify-between items-center ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg`}>
                        <span className={`font-medium ${textPrimary}`}>{person}</span>
                        <button onClick={() => removePerson(person)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {people.length >= 2 && (
                <button onClick={completeSetup} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
                  Start Splitting Expenses
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} p-4`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6 pt-4">
          <div className="flex-1"></div>
          <div className="text-center">
            <h1 className={`text-3xl font-bold ${textPrimary} mb-2`}>Expense Splitter</h1>
            <p className={textSecondary}>Track and split expenses</p>
          </div>
          <div className="flex-1 flex justify-end">
            <button onClick={toggleDarkMode} className={`p-2 rounded-lg ${cardBg} shadow-lg`}>
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className={`${cardBg} rounded-xl shadow-lg p-6 mb-6`}>
          {currentPage === 'home' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${textPrimary}`}>Expense Logs</h2>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => {
                      console.log('Testing localStorage...');
                      console.log('Expenses:', localStorage.getItem('expenses'));
                      console.log('People:', localStorage.getItem('people'));
                      alert('Check browser console (F12) for localStorage data');
                    }}
                    className="text-xs bg-gray-500 text-white px-2 py-1 rounded"
                  >
                    Test Storage
                  </button>
                  <div className={`text-sm ${textSecondary}`}>
                    Total: ${expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {expenses.length === 0 ? (
                <div className={`text-center py-12 ${textSecondary}`}>
                  <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No expenses yet. Add your first one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map(exp => (
                    <div key={exp.id} className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg shadow border ${borderColor}`}>
                      <div className="flex justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold text-lg ${textPrimary}`}>{exp.description}</h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{exp.category}</span>
                          </div>
                          <p className={`text-sm ${textSecondary}`}>
                            {new Date(exp.date).toLocaleDateString()} at {new Date(exp.date).toLocaleTimeString()}
                          </p>
                          {exp.notes && <p className={`text-sm ${textSecondary} italic mt-1`}>Note: {exp.notes}</p>}
                        </div>
                        <button onClick={() => deleteExpense(exp.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className={textSecondary}>Total:</span>
                          <span className="ml-2 font-semibold text-green-600">${exp.amount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className={textSecondary}>Split:</span>
                          <span className="ml-2 font-semibold capitalize">
                            {exp.splitMode === 'fixed-plus-equal' ? 'Fixed + Equal' : exp.splitMode}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {Object.entries(exp.splitAmounts).map(([person, amt]) => (
                          <div key={person} className={`flex justify-between items-center ${darkMode ? 'bg-gray-600' : 'bg-gray-50'} px-3 py-2 rounded`}>
                            <div>
                              <span className={`font-medium ${textPrimary}`}>{person}</span>
                              <span className={`ml-2 font-semibold text-green-600`}>${amt.toFixed(2)}</span>
                            </div>
                            <button
                              onClick={() => settlePersonFromExpense(exp.id, person)}
                              className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                            >
                              Settle
                            </button>
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
              <h2 className={`text-2xl font-bold ${textPrimary} mb-6`}>Add Expense</h2>

              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Dinner"
                  className={`w-full px-4 py-2 border ${borderColor} ${inputBg} rounded-lg`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Category</label>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={`flex-1 px-4 py-2 border ${borderColor} ${inputBg} rounded-lg`}
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <button onClick={() => setShowAddCategory(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg">+</button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-4 py-2 border ${borderColor} ${inputBg} rounded-lg`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  rows="2"
                  className={`w-full px-4 py-2 border ${borderColor} ${inputBg} rounded-lg`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Split Mode</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="equal"
                      checked={splitMode === 'equal'}
                      onChange={(e) => setSplitMode(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className={textPrimary}>Equal Split</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="custom"
                      checked={splitMode === 'custom'}
                      onChange={(e) => setSplitMode(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className={textPrimary}>Custom Amounts</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="fixed-plus-equal"
                      checked={splitMode === 'fixed-plus-equal'}
                      onChange={(e) => setSplitMode(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className={textPrimary}>Fixed + Equal</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className={`text-sm font-medium ${textPrimary}`}>Split Between</label>
                  <div className="flex gap-2">
                    <button onClick={selectAllPeople} className="text-xs text-blue-600">Select All</button>
                    <button onClick={() => setSplitWith([])} className="text-xs text-red-600">Clear</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {people.map(person => (
                    <label key={person} className={`flex items-center gap-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg cursor-pointer`}>
                      <input
                        type="checkbox"
                        checked={splitWith.includes(person)}
                        onChange={() => toggleSplitWith(person)}
                        className="w-5 h-5"
                      />
                      <span className={`flex-1 ${textPrimary}`}>{person}</span>
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
              </div>

              <button onClick={addExpense} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                Add Expense
              </button>
            </div>
          )}

          {currentPage === 'summary' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${textPrimary}`}>Summary</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowBackupRestore(true)} className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg flex items-center gap-1">
                    <Upload className="w-4 h-4" />
                    Backup
                  </button>
                  <button onClick={exportToCSV} className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button onClick={clearAllData} className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg flex items-center gap-1">
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>

              <div>
                <h3 className={`text-lg font-semibold ${textPrimary} mb-3`}>Balances</h3>
                <div className="space-y-2">
                  {Object.entries(calculateBalances()).map(([person, balance]) => (
                    person !== 'Me' && (
                      <div key={person} className={`${darkMode ? 'bg-gray-700' : 'bg-white'} p-4 rounded-lg shadow border ${borderColor}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <span className={`font-medium ${textPrimary}`}>{person}</span>
                            <span className={`ml-3 font-semibold ${balance < 0 ? 'text-red-600' : balance > 0 ? 'text-green-600' : textSecondary}`}>
                              {balance < 0 ? `Owes $${Math.abs(balance).toFixed(2)}` : balance > 0 ? `Overpaid $${balance.toFixed(2)}` : 'Settled'}
                            </span>
                          </div>
                          {balance < -0.01 && (
                            <button onClick={() => sendReminder(person)} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg flex items-center gap-1">
                              <Bell className="w-4 h-4" />
                              Remind
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg shadow-lg">
                <div className="text-sm opacity-90 mb-1">Total You're Owed</div>
                <div className="text-3xl font-bold">${Math.abs(calculateBalances()['Me'] || 0).toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        <div className={`${cardBg} rounded-xl shadow-lg p-2 flex justify-around`}>
          <button
            onClick={() => setCurrentPage('home')}
            className={`flex flex-col items-center p-3 rounded-lg flex-1 ${currentPage === 'home' ? 'bg-blue-100 text-blue-600' : `${textSecondary} hover:bg-gray-100`}`}
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Logs</span>
          </button>
          <button
            onClick={() => setCurrentPage('add')}
            className={`flex flex-col items-center p-3 rounded-lg flex-1 ${currentPage === 'add' ? 'bg-blue-100 text-blue-600' : `${textSecondary} hover:bg-gray-100`}`}
          >
            <PlusCircle className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Add</span>
          </button>
          <button
            onClick={() => setCurrentPage('summary')}
            className={`flex flex-col items-center p-3 rounded-lg flex-1 ${currentPage === 'summary' ? 'bg-blue-100 text-blue-600' : `${textSecondary} hover:bg-gray-100`}`}
          >
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Summary</span>
          </button>
        </div>
      </div>

      {showReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${cardBg} rounded-xl shadow-2xl p-6 max-w-md w-full`}>
            <h3 className={`text-xl font-bold ${textPrimary} mb-4`}>Send Reminder to {reminderPerson}</h3>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg mb-4`}>
              <p className={`text-sm ${textPrimary} whitespace-pre-line`}>
                Hi {reminderPerson}! 👋{'\n\n'}
                Friendly reminder: You owe me ${Math.abs(calculateBalances()[reminderPerson] || 0).toFixed(2)} for shared expenses.{'\n\n'}
                Please settle up when you can. Thanks! 😊
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={copyReminderMessage} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Copy Message
              </button>
              <button onClick={() => setShowReminder(false)} className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${cardBg} rounded-xl shadow-2xl p-6 max-w-md w-full`}>
            <h3 className={`text-xl font-bold ${textPrimary} mb-4`}>Add Custom Category</h3>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder="Enter category name"
              className={`w-full px-4 py-2 border ${borderColor} ${inputBg} rounded-lg mb-4`}
            />
            <div className="flex gap-3">
              <button onClick={addCategory} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                Add Category
              </button>
              <button onClick={() => { setShowAddCategory(false); setNewCategory(''); }} className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showBackupRestore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${cardBg} rounded-xl shadow-2xl p-6 max-w-md w-full`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${textPrimary}`}>Backup & Restore</h3>
              <button onClick={() => setShowBackupRestore(false)} className={textSecondary}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} p-4 rounded-lg`}>
                <h4 className={`font-semibold ${textPrimary} mb-2`}>Export Backup</h4>
                <p className={`text-sm ${textSecondary} mb-3`}>
                  Download all your data as a backup file.
                </p>
                <button onClick={exportBackup} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Backup
                </button>
              </div>

              <div className={`${darkMode ? 'bg-gray-700' : 'bg-green-50'} p-4 rounded-lg`}>
                <h4 className={`font-semibold ${textPrimary} mb-2`}>Import Backup</h4>
                <p className={`text-sm ${textSecondary} mb-3`}>
                  Restore data from a backup file.
                </p>
                <label className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  Upload Backup
                  <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                </label>
              </div>

              <button onClick={() => setShowBackupRestore(false)} className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-700'} py-2 rounded-lg hover:bg-gray-400`}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;