import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { cognitoConfig } from './config';

Amplify.configure({
    Auth: {
        Cognito: cognitoConfig,
    }
});

// The API URL now points to the base todos endpoint
const API_URL = '/api/todos';

const App = ({ signOut, user }) => {
    const [todos, setTodos] = useState([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        // Only fetch todos if a user is logged in
        if (user) {
            fetchTodos();
        }
    }, [user]);

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

    const fetchTodos = async () => {
        try {
            const headers = await getAuthHeader();
            // FIX: Fetch from the main GET endpoint, which is now protected
            const response = await fetch(API_URL, { headers });
            const data = await response.json();
            setTodos(data);
        } catch (error) {
            console.error('Error fetching todos:', error);
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
            setTodos(prev => [...prev, newTodo]);
            setNewTask('');
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    };

    const deleteTodo = async (id) => {
        try {
            const headers = await getAuthHeader();
            await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers });
            setTodos(prev => prev.filter(todo => todo.id !== id));
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const toggleTodo = async (id) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;

        try {
            const headers = { 'Content-Type': 'application/json', ...(await getAuthHeader()) };
            await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ ...todo, completed: !todo.completed })
            });
            setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const formatTimestamp = (epoch) => epoch ? new Date(epoch).toLocaleString() : null;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>My Todo List</h1>
                {user && <button className="btn btn-secondary" onClick={signOut}>Sign Out</button>}
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <form onSubmit={addTodo}>
                        <div className="input-group mb-3">
                            <input type="text" className="form-control" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a new task" />
                            <button className="btn btn-primary" type="submit">Add</button>
                        </div>
                    </form>
                    <ul className="list-group">
                        {todos.map(todo => (
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
        </div>
    );
};

export default withAuthenticator(App, {
    signUpAttributes: ['email'],
});
