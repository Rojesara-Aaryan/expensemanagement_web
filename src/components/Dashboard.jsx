// Dashboard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';

// Assuming FormInput and FormButton are imported from a shared file
import { FormInput, FormButton } from './SharedComponts'; // Adjust the import path as needed

const Dashboard = ({ currentUser, setCurrentUser }) => {
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [categoryData, setCategoryData] = useState({});
  const [trendData, setTrendData] = useState({});
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    date: '',
    description: '',
    currency: '',
  });
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);

  useEffect(() => {
    const storedExpenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    const companyUsers = storedUsers.filter(u => u.companyId === currentUser.companyId);
    setUsers(companyUsers);

    let filteredExpenses = [];
    if (currentUser.role === 'admin') {
      filteredExpenses = storedExpenses.filter(exp => exp.companyId === currentUser.companyId);
    } else if (currentUser.role === 'manager') {
      const subordinates = companyUsers.filter(u => u.managerId === currentUser.id).map(u => u.id);
      filteredExpenses = storedExpenses.filter(exp => subordinates.includes(exp.employeeId));
    } else if (currentUser.role === 'employee') {
      filteredExpenses = storedExpenses.filter(exp => exp.employeeId === currentUser.id);
    }
    setExpenses(filteredExpenses);

    // Calculate category data for pie chart
    const categories = filteredExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});
    setCategoryData(categories);

    // Calculate trend data for line chart (monthly)
    const months = filteredExpenses.reduce((acc, exp) => {
      const month = new Date(exp.date).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});
    setTrendData(months);

    // Set currency for new expense
    const storedCompanies = JSON.parse(localStorage.getItem('companies')) || [];
    const company = storedCompanies.find(c => c.id === currentUser.companyId);
    const currency = company ? company.currency : 'USD';
    setNewExpense(prev => ({ ...prev, currency }));
  }, [currentUser]);

  useEffect(() => {
    if (pieChartRef.current) {
      const ctx = pieChartRef.current.getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(categoryData),
          datasets: [{
            data: Object.values(categoryData),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `${currentUser.role === 'employee' ? 'My' : 'Team'} Expenses by Category` }
          }
        }
      });
    }
  }, [categoryData, currentUser.role]);

  useEffect(() => {
    if (lineChartRef.current) {
      const ctx = lineChartRef.current.getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: Object.keys(trendData),
          datasets: [{
            label: `${currentUser.role === 'employee' ? 'My' : 'Team'} Monthly Expenses`,
            data: Object.values(trendData),
            borderColor: '#36A2EB',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `${currentUser.role === 'employee' ? 'My' : 'Team'} Expense Trend` }
          }
        }
      });
    }
  }, [trendData, currentUser.role]);

  const getEmployeeName = (employeeId) => {
    const user = users.find(u => u.id === employeeId);
    return user ? user.name : 'Unknown';
  };

  const pendingCount = expenses.filter(exp => exp.status === 'pending').length;
  const approvedCount = expenses.filter(exp => exp.status === 'approved').length;
  const rejectedCount = expenses.filter(exp => exp.status === 'rejected').length;
  const totalCount = expenses.length;
  const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    navigate('/');
  };

  const handleOverride = (expId, newStatus) => {
    const allExpenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const updatedExpenses = allExpenses.map(exp => 
      exp.id === expId ? { ...exp, status: newStatus } : exp
    );
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));

    // Update local state based on role
    let filteredExpenses = [];
    if (currentUser.role === 'admin') {
      filteredExpenses = updatedExpenses.filter(exp => exp.companyId === currentUser.companyId);
    } else if (currentUser.role === 'manager') {
      const subordinates = users.filter(u => u.managerId === currentUser.id).map(u => u.id);
      filteredExpenses = updatedExpenses.filter(exp => subordinates.includes(exp.employeeId));
    } else if (currentUser.role === 'employee') {
      filteredExpenses = updatedExpenses.filter(exp => exp.employeeId === currentUser.id);
    }
    setExpenses(filteredExpenses);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitExpense = (e) => {
    e.preventDefault();
    const allExpenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const newId = allExpenses.length + 1;
    const expense = {
      id: newId,
      ...newExpense,
      amount: parseFloat(newExpense.amount),
      employeeId: currentUser.id,
      companyId: currentUser.companyId,
      status: 'pending',
    };
    allExpenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(allExpenses));
    setExpenses(prev => [...prev, expense]);
    setNewExpense({
      amount: '',
      category: '',
      date: '',
      description: '',
      currency: newExpense.currency,
    });
    alert('Expense submitted successfully!');
  };

  return (
    <div className="dashboard creative-dashboard">
      <div className="sidebar">
        <h2>ExpenseFlow</h2>
        <ul>
          <li><a href="#">Dashboard</a></li>
          <li><a href="#">Expenses</a></li>
          {currentUser.role === 'admin' && <li><a href="#">Employees</a></li>}
          <li><a href="#">Reports</a></li>
          <li><a href="#" onClick={handleLogout}>Logout</a></li>
        </ul>
      </div>
      <div className="main-content">
        <div className="header">
          <h1>Welcome, {currentUser.name}</h1>
          {currentUser.role === 'admin' && (
            <FormButton onClick={() => navigate('/add-employee')}>Add Employee</FormButton>
          )}
        </div>
        <div className="overview-grid">
          <div className="stat-card total-expenses">
            <h3>Total Expenses</h3>
            <p>{totalCount}</p>
            <p className="amount">{totalAmount.toFixed(2)} {newExpense.currency}</p>
          </div>
          <div className="stat-card pending">
            <h3>Pending</h3>
            <p>{pendingCount}</p>
          </div>
          <div className="stat-card approved">
            <h3>Approved</h3>
            <p>{approvedCount}</p>
          </div>
          <div className="stat-card rejected">
            <h3>Rejected</h3>
            <p>{rejectedCount}</p>
          </div>
        </div>
        <div className="charts-section">
          <div className="chart-container">
            <canvas ref={pieChartRef}></canvas>
          </div>
          <div className="chart-container">
            <canvas ref={lineChartRef}></canvas>
          </div>
        </div>
        {currentUser.role === 'employee' && (
          <div className="submit-expense">
            <h2>Submit New Expense</h2>
            <form onSubmit={handleSubmitExpense}>
              <FormInput
                id="amount"
                type="number"
                placeholder="Amount"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                value={newExpense.amount}
                onChange={handleInputChange}
              />
              <div className="form-input-container">
                <div className="icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                </div>
                <select
                  id="category"
                  name="category"
                  value={newExpense.category}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="" disabled>Select Category</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <FormInput
                id="date"
                type="date"
                placeholder="Date"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                value={newExpense.date}
                onChange={handleInputChange}
              />
              <FormInput
                id="description"
                type="text"
                placeholder="Description"
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
                value={newExpense.description}
                onChange={handleInputChange}
              />
              <FormButton type="submit">Submit Expense</FormButton>
            </form>
          </div>
        )}
        <div className="expenses-list">
          <h2>{currentUser.role === 'employee' ? 'My' : 'Recent'} Expenses</h2>
          {expenses.length === 0 ? (
            <p>No expenses yet.</p>
          ) : (
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>ID</th>
                  {(currentUser.role === 'admin' || currentUser.role === 'manager') && <th>Employee</th>}
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  {(currentUser.role === 'admin' || currentUser.role === 'manager') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 5).map(exp => (
                  <tr key={exp.id}>
                    <td>{exp.id}</td>
                    {(currentUser.role === 'admin' || currentUser.role === 'manager') && <td>{getEmployeeName(exp.employeeId)}</td>}
                    <td>{exp.amount}</td>
                    <td>{exp.currency}</td>
                    <td>{exp.category}</td>
                    <td>{exp.date}</td>
                    <td className={`status-${exp.status}`}>{exp.status}</td>
                    {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                      <td>
                        <FormButton onClick={() => handleOverride(exp.id, 'approved')}>Approve</FormButton>
                        <FormButton onClick={() => handleOverride(exp.id, 'rejected')}>Reject</FormButton>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;