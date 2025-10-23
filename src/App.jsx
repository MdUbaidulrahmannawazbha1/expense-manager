import React, { useState } from 'react';
import { PlusCircle, Home, FileText, Users, Trash2, DollarSign, Bell, X } from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [expenses, setExpenses] = useState([]);
  const [people, setPeople] = useState([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [reminderPerson, setReminderPerson] = useState('');
  const [showPersonDetails, setShowPersonDetails] = useState(false);
  const [selectedPersonForDetails, setSelectedPersonForDetails] = useState('');
  
  const defaultCategories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Other'];
  const [categories, setCategories] = useState(defaultCategories);
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

  const addExpense = () => {
    if (!description || !amount || splitWith.length === 0) {
      alert('Please fill in all fields and select at least one person');
      return;
    }

    let splitAmounts = {};
    const totalAmount = parseFloat(amount);

    if (splitMode === 'equal') {
      const perPersonAmount = totalAmount / splitWith.length;
      splitWith.forEach(person => {
        splitAmounts[person] = perPersonAmount;
      });
    } else if (splitMode === 'custom') {
      const totalCustom = splitWith.reduce((sum, person) => sum + (parseFloat(customAmounts[person]) || 0), 0);
      if (Math.abs(totalCustom - totalAmount) > 0.01) {
        alert('Custom amounts must add up to the total amount');
        return;
      }
      splitAmounts = { ...customAmounts };
    } else if (splitMode === 'fixed-plus-equal') {
      const totalFixed = Object.values(multiFixedAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
      
      if (totalFixed >= totalAmount) {
        alert('Total fixed amounts must be less than total amount');
        return;
      }
      
      const fixedPeople = Object.keys(multiFixedAmounts).filter(person => 
        multiFixedAmounts[person] && parseFloat(multiFixedAmounts[person]) > 0
      );
      
      if (fixedPeople.length === 0) {
        alert('Please assign fixed amounts to at least one person');
        return;
      }
      
      const remaining = totalAmount - totalFixed;
      const otherPeople = splitWith.filter(p => !fixedPeople.includes(p));
      
      if (otherPeople.length === 0) {
        alert('At least one person must split the remaining amount equally');
        return;
      }
      
      const perPersonAmount = remaining / otherPeople.length;
      
      fixedPeople.forEach(person => {
        splitAmounts[person] = parseFloat(multiFixedAmounts[person]);
      });
      
      otherPeople.forEach(person => {
        splitAmounts[person] = perPersonAmount;
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
    if (window.confirm('Delete entire expense log?')) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  const settlePersonFromExpense = (expenseId, person) => {
    if (window.confirm(`Mark ${person} as settled for this expense?`)) {
      setExpenses(expenses.map(exp => {
        if (exp.id === expenseId) {
          const newSplitWith = exp.splitWith.filter(p => p !== person);
          const newSplitAmounts = { ...exp.splitAmounts };
          delete newSplitAmounts[person];
          
          if (newSplitWith.length === 0) return null;
          
          return {
            ...exp,
            splitWith: newSplitWith,
            splitAmounts: newSplitAmounts
          };
        }
        return exp;
      }).filter(exp => exp !== null));
    }
  };

  const toggleSplitWith = (person) => {
    if (splitWith.includes(person)) {
      setSplitWith(splitWith.filter(p => p !== person));
      const newCustomAmounts = { ...customAmounts };
      delete newCustomAmounts[person];
      setCustomAmounts(newCustomAmounts);
      const newMultiFixed = { ...multiFixedAmounts };
      delete newMultiFixed[person];
      setMultiFixedAmounts(newMultiFixed);
    } else {
      setSplitWith([...splitWith, person]);
    }
  };

  const selectAllPeople = () => {
    setSplitWith([...people]);
    if (splitMode === 'custom' && amount) {
      const perPerson = parseFloat(amount) / people.length;
      const newCustomAmounts = {};
      people.forEach(person => {
        newCustomAmounts[person] = perPerson.toFixed(2);
      });
      setCustomAmounts(newCustomAmounts);
    }
  };

  const deselectAllPeople = () => {
    setSplitWith([]);
    setCustomAmounts({});
    setMultiFixedAmounts({});
  };

  const updateCustomAmount = (person, value) => {
    setCustomAmounts({
      ...customAmounts,
      [person]: value
    });
  };

  const updateMultiFixedAmount = (person, value) => {
    setMultiFixedAmounts({
      ...multiFixedAmounts,
      [person]: value
    });
  };

  const calculateBalances = () => {
    const balances = {};
    people.forEach(person => {
      balances[person] = 0;
    });
    balances['Me'] = 0;

    expenses.forEach(expense => {
      balances['Me'] += expense.amount;
      
      Object.entries(expense.splitAmounts).forEach(([person, amt]) => {
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
    const amountOwed = Math.abs(balances[reminderPerson]);
    const message = `Hi ${reminderPerson}! 👋\n\nFriendly reminder: You owe me $${amountOwed.toFixed(2)} for shared expenses.\n\nPlease settle up when you can. Thanks! 😊`;
    
    navigator.clipboard.writeText(message).then(() => {
      alert('Reminder message copied! You can paste it in WhatsApp, Messages, etc.');
      setShowReminder(false);
    });
  };

  const getMonthlyExpenses = () => {
    const now = new Date();
    const thisMonth = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });
    
    return thisMonth.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getExpensesByCategory = () => {
    const categoryTotals = {};
    categories.forEach(cat => {
      categoryTotals[cat] = 0;
    });
    
    expenses.forEach(expense => {
      categoryTotals[expense.category] += expense.amount;
    });
    
    return categoryTotals;
  };

  const getSettlements = () => {
    const balances = calculateBalances();
    const settlements = [];
    
    const creditors = [];
    const debtors = [];
    
    Object.entries(balances).forEach(([person, balance]) => {
      if (balance > 0.01) {
        creditors.push({ person, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ person, amount: Math.abs(balance) });
      }
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const settlementAmount = Math.min(creditor.amount, debtor.amount);

      settlements.push({
        from: debtor.person,
        to: creditor.person,
        amount: settlementAmount
      });

      creditor.amount -= settlementAmount;
      debtor.amount -= settlementAmount;

      if (creditor.amount < 0.01) i++;
      if (debtor.amount < 0.01) j++;
    }

    return settlements;
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setSelectedCategory(newCategory.trim());
      setNewCategory('');
      setShowAddCategory(false);
    } else if (categories.includes(newCategory.trim())) {
      alert('Category already exists!');
    }
  };

  const deleteCategory = (categoryToDelete) => {
    if (defaultCategories.includes(categoryToDelete)) {
      alert('Cannot delete default categories!');
      return;
    }
    if (window.confirm(`Delete category "${categoryToDelete}"?`)) {
      setCategories(categories.filter(c => c !== categoryToDelete));
      if (selectedCategory === categoryToDelete) {
        setSelectedCategory('Other');
      }
    }
  };

  const getRemainingAmount = () => {
    if (splitMode === 'fixed-plus-equal' && amount) {
      const totalFixed = Object.values(multiFixedAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
      const remaining = parseFloat(amount) - totalFixed;
      return remaining > 0 ? remaining.toFixed(2) : '0.00';
    }
    return '0.00';
  };

  const getOtherPeopleCount = () => {
    const fixedPeople = Object.keys(multiFixedAmounts).filter(person => 
      multiFixedAmounts[person] && parseFloat(multiFixedAmounts[person]) > 0
    );
    return splitWith.filter(p => !fixedPeople.includes(p)).length;
  };

  const getTotalFixedAmount = () => {
    return Object.values(multiFixedAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0).toFixed(2);
  };

  const getPersonExpenseDetails = (person) => {
    const personExpenses = expenses.filter(exp => exp.splitWith.includes(person));
    return personExpenses.map(exp => ({
      id: exp.id,
      description: exp.description,
      category: exp.category,
      totalAmount: exp.amount,
      personOwes: exp.splitAmounts[person],
      date: exp.date,
      notes: exp.notes
    }));
  };

  const viewPersonDetails = (person) => {
    setSelectedPersonForDetails(person);
    setShowPersonDetails(true);
  };

  const perPersonAmount = splitWith.length > 0 && amount && splitMode === 'equal' 
    ? (parseFloat(amount) / splitWith.length).toFixed(2) 
    : '0.00';
  
  const totalAssigned = splitWith.length > 0 && splitMode === 'custom'
    ? splitWith.reduce((sum, person) => sum + (parseFloat(customAmounts[person]) || 0), 0).toFixed(2)
    : '0.00';

  if (!setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6 pt-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Expense Splitter</h1>
            <p className="text-gray-600">Track and split expenses with friends</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Users className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
                <p className="text-gray-600">Add the people who will be splitting expenses</p>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Add Person</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPerson();
                      }
                    }}
                    placeholder="Enter name"
                    autoFocus
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addPerson}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
              {people.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    People ({people.length})
                  </label>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {people.map(person => (
                      <div key={person} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-800 font-medium">{person}</span>
                        <button
                          type="button"
                          onClick={() => removePerson(person)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {people.length >= 2 && (
                <button
                  type="button"
                  onClick={completeSetup}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Start Splitting Expenses
                </button>
              )}
              {people.length === 1 && (
                <p className="text-sm text-amber-600 text-center">Add at least one more person to continue</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 pt-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Expense Splitter</h1>
          <p className="text-gray-600">Track and split expenses with friends</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {currentPage === 'home' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Expense Logs</h2>
                <div className="text-sm text-gray-600">
                  Total: ${expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                </div>
              </div>

              {expenses.length > 0 && (
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg shadow-lg mb-4">
                  <div className="text-sm opacity-90 mb-1">This Month's Expenses</div>
                  <div className="text-3xl font-bold">${getMonthlyExpenses().toFixed(2)}</div>
                </div>
              )}

              {expenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No expense logs yet. Add your first expense!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map(expense => (
                    <div key={expense.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-gray-800">{expense.description}</h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {expense.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(expense.date).toLocaleDateString()} at {new Date(expense.date).toLocaleTimeString()}
                          </p>
                          {expense.notes && (
                            <p className="text-sm text-gray-600 mt-1 italic">Note: {expense.notes}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteExpense(expense.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete entire expense"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="ml-2 font-semibold text-green-600">${expense.amount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Split Type:</span>
                          <span className="ml-2 font-semibold capitalize">
                            {expense.splitMode === 'fixed-plus-equal' ? 'Fixed + Equal' : expense.splitMode}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm">
                        <span className="text-gray-600">Paid by:</span>
                        <span className="ml-2 font-semibold text-blue-600">Me</span>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600 mb-2 block">Split between:</span>
                        <div className="space-y-2">
                          {Object.entries(expense.splitAmounts).map(([person, splitAmount]) => (
                            <div key={person} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded hover:bg-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{person}</span>
                                <span className="text-gray-400">•</span>
                                <span className="font-semibold text-green-600">${splitAmount.toFixed(2)}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => settlePersonFromExpense(expense.id, person)}
                                className="text-green-600 hover:text-green-800 text-xs flex items-center gap-1 bg-green-50 px-2 py-1 rounded"
                                title="Mark as settled"
                              >
                                <X className="w-4 h-4" />
                                <span>Settle</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentPage === 'add' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Expense</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Dinner at restaurant"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    title="Add custom category"
                  >
                    +
                  </button>
                </div>
                {categories.length > defaultCategories.length && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.filter(cat => !defaultCategories.includes(cat)).map(cat => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs"
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() => deleteCategory(cat)}
                          className="hover:text-purple-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this expense..."
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Split Mode</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="equal"
                      checked={splitMode === 'equal'}
                      onChange={(e) => setSplitMode(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Split Equally - Everyone pays the same</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="fixed-plus-equal"
                      checked={splitMode === 'fixed-plus-equal'}
                      onChange={(e) => setSplitMode(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Fixed + Equal - Some pay fixed, others split remaining</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="custom"
                      checked={splitMode === 'custom'}
                      onChange={(e) => setSplitMode(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Custom Amounts - Enter specific amounts for each person</span>
                  </label>
                </div>
              </div>

              {splitMode === 'fixed-plus-equal' && splitWith.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-gray-800">Fixed Amounts Setup</h4>
                  <p className="text-sm text-gray-600">Check people who pay fixed amounts. Others will split the remaining equally.</p>
                  
                  <div className="space-y-2">
                    {splitWith.map(person => (
                      <div key={person} className="flex items-center gap-2">
                        <label className="flex-1 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={multiFixedAmounts.hasOwnProperty(person)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateMultiFixedAmount(person, '');
                              } else {
                                const newMultiFixed = { ...multiFixedAmounts };
                                delete newMultiFixed[person];
                                setMultiFixedAmounts(newMultiFixed);
                              }
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="font-medium text-gray-700">{person}</span>
                        </label>
                        {multiFixedAmounts.hasOwnProperty(person) && (
                          <input
                            type="number"
                            step="0.01"
                            value={multiFixedAmounts[person] || ''}
                            onChange={(e) => updateMultiFixedAmount(person, e.target.value)}
                            placeholder="Fixed amount"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {amount && splitWith.length > 0 && (
                    <div className="text-sm text-gray-700 mt-3 p-3 bg-white rounded border border-blue-200">
                      <div className="space-y-1">
                        <p><strong>Total Amount:</strong> ${parseFloat(amount).toFixed(2)}</p>
                        <p><strong>Total Fixed Amounts:</strong> ${getTotalFixedAmount()}</p>
                        <p><strong>Remaining to Split:</strong> ${getRemainingAmount()}</p>
                        <p><strong>People Splitting Equally:</strong> {getOtherPeopleCount()}</p>
                        {getOtherPeopleCount() > 0 && parseFloat(getRemainingAmount()) > 0 && (
                          <p className="font-semibold text-blue-700 mt-2">
                            Each pays: ${(parseFloat(getRemainingAmount()) / getOtherPeopleCount()).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Split Between</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllPeople}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={deselectAllPeople}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {people.map(person => (
                    <div key={person}>
                      <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={splitWith.includes(person)}
                          onChange={() => toggleSplitWith(person)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 flex-1">{person}</span>
                        {splitMode === 'custom' && splitWith.includes(person) && (
                          <input
                            type="number"
                            step="0.01"
                            value={customAmounts[person] || ''}
                            onChange={(e) => updateCustomAmount(person, e.target.value)}
                            placeholder="0.00"
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                {splitWith.length > 0 && splitMode === 'equal' && amount && (
                  <p className="text-sm text-gray-600 mt-2">
                    Each person pays: ${perPersonAmount}
                  </p>
                )}
                {splitWith.length > 0 && splitMode === 'custom' && (
                  <p className="text-sm text-gray-600 mt-2">
                    Total assigned: ${totalAssigned} / ${amount || '0.00'}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={addExpense}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Add Expense
              </button>
            </div>
          )}

          {currentPage === 'summary' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Summary</h2>

              {expenses.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Spending by Category</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(getExpensesByCategory()).map(([category, total]) => (
                      total > 0 && (
                        <div key={category} className="bg-white p-3 rounded-lg shadow border border-gray-200">
                          <div className="text-xs text-gray-600">{category}</div>
                          <div className="text-lg font-bold text-blue-600">${total.toFixed(2)}</div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Individual Balances</h3>
                <div className="space-y-2">
                  {Object.entries(calculateBalances()).map(([person, balance]) => (
                    person !== 'Me' && (
                      <div key={person} className="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{person}</span>
                          <span className={`ml-3 font-semibold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {balance < 0 ? `Owes ${Math.abs(balance).toFixed(2)}` : balance > 0 ? `Overpaid ${balance.toFixed(2)}` : 'Settled'}
                          </span>
                        </div>
                        {balance < -0.01 && (
                          <button
                            type="button"
                            onClick={() => sendReminder(person)}
                            className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center gap-1"
                          >
                            <Bell className="w-4 h-4" />
                            Remind
                          </button>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Summary</h3>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg shadow-lg">
                  <div className="text-sm opacity-90 mb-1">Total You're Owed</div>
                  <div className="text-3xl font-bold">${Math.abs(calculateBalances()['Me'] || 0).toFixed(2)}</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Suggested Settlements</h3>
                {getSettlements().length === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                    All settled up! No payments needed.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getSettlements().map((settlement, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                        <p className="text-gray-800">
                          <span className="font-semibold text-red-600">{settlement.from}</span>
                          {' pays '}
                          <span className="font-semibold text-green-600">{settlement.to}</span>
                          {' '}
                          <span className="font-bold text-blue-600">${settlement.amount.toFixed(2)}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-2 flex justify-around">
          <button
            type="button"
            onClick={() => setCurrentPage('home')}
            className={`flex flex-col items-center p-3 rounded-lg flex-1 ${
              currentPage === 'home' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Logs</span>
          </button>
          
          <button
            type="button"
            onClick={() => setCurrentPage('add')}
            className={`flex flex-col items-center p-3 rounded-lg flex-1 ${
              currentPage === 'add' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <PlusCircle className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Add</span>
          </button>
          
          <button
            type="button"
            onClick={() => setCurrentPage('summary')}
            className={`flex flex-col items-center p-3 rounded-lg flex-1 ${
              currentPage === 'summary' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Summary</span>
          </button>
        </div>
      </div>

      {showReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Send Reminder to {reminderPerson}</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                Hi {reminderPerson}! 👋{'\n\n'}
                Friendly reminder: You owe me ${Math.abs(calculateBalances()[reminderPerson] || 0).toFixed(2)} for shared expenses.{'\n\n'}
                Please settle up when you can. Thanks! 😊
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={copyReminderMessage}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
              >
                Copy Message
              </button>
              <button
                type="button"
                onClick={() => setShowReminder(false)}
                className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Custom Category</h3>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="Enter category name"
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={addCategory}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                Add Category
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategory('');
                }}
                className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPersonDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800">Expense Details: {selectedPersonForDetails}</h3>
              <button
                type="button"
                onClick={() => setShowPersonDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg">
              <div className="text-sm opacity-90 mb-1">Total Amount Owed</div>
              <div className="text-3xl font-bold">
                ${Math.abs(calculateBalances()[selectedPersonForDetails] || 0).toFixed(2)}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getPersonExpenseDetails(selectedPersonForDetails).length === 0 ? (
                <p className="text-center text-gray-500 py-8">No expenses found for this person</p>
              ) : (
                getPersonExpenseDetails(selectedPersonForDetails).map(detail => (
                  <div key={detail.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800">{detail.description}</h4>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {detail.category}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Date:</span>{' '}
                            {new Date(detail.date).toLocaleDateString()} at{' '}
                            {new Date(detail.date).toLocaleTimeString()}
                          </p>
                          <p>
                            <span className="font-medium">Total Expense:</span>{' '}
                            <span className="text-gray-700">${detail.totalAmount.toFixed(2)}</span>
                          </p>
                          <p>
                            <span className="font-medium">{selectedPersonForDetails}'s Share:</span>{' '}
                            <span className="font-bold text-red-600">${detail.personOwes.toFixed(2)}</span>
                          </p>
                          {detail.notes && (
                            <p className="italic text-gray-500">Note: {detail.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {calculateBalances()[selectedPersonForDetails] < -0.01 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPersonDetails(false);
                    sendReminder(selectedPersonForDetails);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Bell className="w-5 h-5" />
                  Send Payment Reminder
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPersonDetails(false)}
                className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
              >
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