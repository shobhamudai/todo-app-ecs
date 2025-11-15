import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Import the configuration from your new config file
import { cognitoConfig } from './config';

// Configure Amplify with your Cognito details
Amplify.configure({
    Auth: {
        Cognito: cognitoConfig,
    }
});

const API_URL = '/api/todos';

const App = ({ signOut, user }) => {
    const [publicTodos, setPublicTodos] = useState([]);
    const [myTodos, setMyTodos] = useState([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        // Fetch public todos for all users
        fetchPublicTodos();
        // If a user is logged in, fetch their private todos
        if (user) {
            fetchMyTodos();
        }
    }, [user]); // Re-run this effect when the user logs in or out

    // Helper function to get the current user's JWT for API calls
    const getAuthHeader = async () => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            return { 'Authorization': `Bearer ${token}` };
        } catch (error) {
            console.error('Error getting auth session:', error);
            return {};
        }
    };

    const fetchPublicTodos = async () => {
        try {
            const response = await fetch(`${API_URL}/public`);
            const data = await response.json();
            setPublicTodos(data);
        } catch (error) {
            console.error('Error fetching public todos:', error);
        }
    };

    const fetchMyTodos = async () => {
        try {
            const headers = await getAuthHeader();
            const response = await fetch(`${API_URL}/mine`, { headers });
            const data = await response.json();
            setMyTodos(data);
        } catch (error) {
            console.error('Error fetching my todos:', error);
        }
    };

    const addTodo = async (event) => {
        event.preventDefault();
        if (!newTask.trim()) return;

        try {
            const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) };
            const response = await fetch(API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify({ task: newTask })
            });
            const newTodo = await response.json();
            setMyTodos(prev => [...prev, newTodo]);
            setNewTask('');
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    };

    const deleteTodo = async (id) => {
        try {
            const headers = await getAuthHeader();
            await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers });
            setMyTodos(prev => prev.filter(todo => todo.id !== id));
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const toggleTodo = async (id) => {
        const todo = myTodos.find(t => t.id === id);
        if (!todo) return;

        try {
            const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) };
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ ...todo, completed: !todo.completed })
            });
            setMyTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const formatTimestamp = (epoch) => epoch ? new Date(epoch).toLocaleString() : null;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>Todo App</h1>
                {/* The signOut button is provided by the withAuthenticator HOC */}
                {user && <button className="btn btn-secondary" onClick={signOut}>Sign Out</button>}
            </div>

            {/* My Todos Section (only for logged-in users) */}
            {user && (
                <div className="card shadow-sm mb-4">
                    <div className="card-body">
                        <h2 className="card-title">My Todos</h2>
                        <form onSubmit={addTodo}>
                            <div className="input-group mb-3">
                                <input type="text" className="form-control" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a new private task" />
                                <button className="btn btn-primary" type="submit">Add</button>
                            </div>
                        </form>
                        <ul className="list-group">
                            {myTodos.map(todo => (
                                <li key={todo.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    <div onClick={() => toggleTodo(todo.id)} style={{ cursor: 'pointer' }}>
                                        <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.task}</span>
                                        {todo.createdAt && <div className="text-muted small mt-1">{formatTimestamp(todo.createdAt)}</div>}
                                    </div>
                                    <button className="btn btn-danger btn-sm" onClick={() => deleteTodo(todo.id)}>Delete</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Public Todos Section (shown to everyone) */}
            <div className="card">
                <div className="card-body">
                    <h2 className="card-title">Public Todos</h2>
                    <ul className="list-group">
                        {publicTodos.map(todo => (
                            <li key={todo.id} className="list-group-item">
                                <span>{todo.task}</span>
                                {todo.createdAt && <div className="text-muted small mt-1">{formatTimestamp(todo.createdAt)}</div>}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

// FIX: Configure the Authenticator to include 'email' in the sign-up form.
export default withAuthenticator(App, {
    signUpAttributes: ['email'],
});
