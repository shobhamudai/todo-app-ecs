import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const API_URL = '/api/todos';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: [],
      newTask: ''
    };
  }

  componentDidMount() {
    this.fetchTodos();
  }

  fetchTodos = async () => {
    try {
      const response = await fetch(API_URL);
      const todos = await response.json();
      this.setState({ todos });
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  handleInputChange = (event) => {
    this.setState({ newTask: event.target.value });
  };

  addTodo = async (event) => {
    event.preventDefault();
    if (!this.state.newTask.trim()) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: this.state.newTask })
      });
      const newTodo = await response.json();
      this.setState(prevState => ({
        todos: [...prevState.todos, newTodo],
        newTask: ''
      }));
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  toggleTodo = async (id) => {
    const todoToUpdate = this.state.todos.find(todo => todo.id === id);
    if (!todoToUpdate) return;

    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...todoToUpdate, completed: !todoToUpdate.completed })
      });
      this.setState(prevState => ({
        todos: prevState.todos.map(todo =>
          todo.id === id ? { ...todo, completed: !todoToUpdate.completed } : todo
        )
      }));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  deleteTodo = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      this.setState(prevState => ({
        todos: prevState.todos.filter(todo => todo.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  formatTimestamp = (epoch) => {
    if (!epoch) return null;
    return new Date(epoch).toLocaleString();
  };

  render() {
    return (
      <div className="container mt-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h1 className="card-title text-center mb-4">To-Do List</h1>
            <form onSubmit={this.addTodo}>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  value={this.state.newTask}
                  onChange={this.handleInputChange}
                  placeholder="Add a new task"
                  onKeyPress={(e) => e.key === 'Enter' && this.addTodo(e)}
                />
                <button className="btn btn-primary" type="submit">Add Task</button>
              </div>
            </form>
            <ul className="list-group">
              {this.state.todos.map(todo => (
                <li key={todo.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div onClick={() => this.toggleTodo(todo.id)} style={{ cursor: 'pointer' }}>
                    <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                      {todo.task}
                    </span>
                    {todo.createdAt && (
                      <div className="text-muted small mt-1">{this.formatTimestamp(todo.createdAt)}</div>
                    )}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); this.deleteTodo(todo.id); }}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
