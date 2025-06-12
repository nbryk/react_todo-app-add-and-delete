/* eslint-disable max-len */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState, useRef } from 'react';
import { UserWarning } from './UserWarning';
import { addTodo, deleteTodo, getTodos } from './api/todos';
import { Todo } from './types/Todo';
import { FilterStatus } from './types/FilterStatus';
import { USER_ID } from './constants';
import classNames from 'classnames';
import { ErrorNotification } from './components/ErrorNotification';

export const App: React.FC = () => {
  const [todosFromServer, setTodosFromServer] = useState<Todo[]>([]);
  const [todosErrorMessage, setTodosErrorMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(
    FilterStatus.All,
  );

  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [deletingTodoIds, setDeletingTodoIds] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    setTodosErrorMessage('');

    getTodos()
      .then(setTodosFromServer)
      .catch(() => {
        setTodosErrorMessage('Unable to load todos');
      });
  }, []);

  useEffect(() => {
    if (todosErrorMessage) {
      const timer = setTimeout(() => {
        setTodosErrorMessage('');
      }, 3000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [todosErrorMessage]);

  const getFilteredTodos = (todos: Todo[], filter: FilterStatus): Todo[] => {
    return todos.filter(todo => {
      if (filter === FilterStatus.Active) {
        return !todo.completed;
      }

      if (filter === FilterStatus.Completed) {
        return todo.completed;
      }

      return true;
    });
  };

  const filteredTodos = getFilteredTodos(todosFromServer, filterStatus);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const title = newTodoTitle.trim();

    if (!title) {
      setTodosErrorMessage('Title should not be empty');

      return;
    }

    const newTempTodo: Todo = {
      id: 0,
      userId: USER_ID,
      title: title,
      completed: false,
    };

    setTempTodo(newTempTodo);
    setIsAdding(true);

    addTodo(newTempTodo)
      .then(createdTodo => {
        setTodosFromServer(currentTodo => [...currentTodo, createdTodo]);
        setNewTodoTitle('');
      })
      .catch(() => {
        setTodosErrorMessage('Unable to add a todo');
      })
      .finally(() => {
        setIsAdding(false);
        setTempTodo(null);
      });
  };

  const handleNewTodoTitleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setNewTodoTitle(event.target.value);
  };

  const handleDeleteTodo = (todoId: number) => {
    setDeletingTodoIds(currrentIds => [...currrentIds, todoId]);

    deleteTodo(todoId)
      .then(() => {
        setTodosFromServer(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        );
      })
      .catch(() => {
        setTodosErrorMessage('Unable to delete a todo');
      })
      .finally(() => {
        setDeletingTodoIds(ids => ids.filter(id => id !== todoId));
        inputRef.current?.focus();
      });
  };

  const completedTodos = todosFromServer.some(todo => todo.completed);

  const handleClearCompleted = () => {
    const idsToDelete = todosFromServer
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    setDeletingTodoIds(currentIds => [...currentIds, ...idsToDelete]);

    Promise.allSettled(idsToDelete.map(id => deleteTodo(id)))
      .then(results => {
        const successfulIds: number[] = [];

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successfulIds.push(idsToDelete[index]);
          } else {
            setTodosErrorMessage('Unable to delete a todo');
          }
        });

        setTodosFromServer(current =>
          current.filter(todo => !successfulIds.includes(todo.id)),
        );
      })
      .finally(() => {
        setDeletingTodoIds(ids => ids.filter(id => !idsToDelete.includes(id)));
        inputRef.current?.focus();
      });
  };

  const activeTodosCount = todosFromServer.filter(
    todo => !todo.completed,
  ).length;

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className="todoapp__toggle-all"
            data-cy="ToggleAllButton"
          />

          {/* Add a todo on form submit */}
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={newTodoTitle}
              onChange={handleNewTodoTitleChange}
              disabled={isAdding}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {filteredTodos.map(todo => (
            <div
              key={todo.id}
              data-cy="Todo"
              className={classNames('todo', { completed: todo.completed })}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todo.completed}
                  aria-label="Toggle todo completion"
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {todo.title}
              </span>

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                onClick={() => handleDeleteTodo(todo.id)}
                disabled={deletingTodoIds.includes(todo.id)}
              >
                ×
              </button>
              {deletingTodoIds.includes(todo.id) && (
                <div data-cy="TodoLoader" className="modal overlay is-active">
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              )}
              <div data-cy="TodoLoader" className="modal overlay">
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          ))}

          {tempTodo && (
            <div key="temp" data-cy="Todo" className="todo">
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={tempTodo.completed}
                  aria-label="Toggle todo completion"
                  disabled
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {tempTodo.title}
              </span>

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                disabled
              >
                ×
              </button>

              <div data-cy="TodoLoader" className="modal overlay is-active">
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          )}
        </section>

        {/* Hide the footer if there are no todos */}
        {todosFromServer.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {activeTodosCount} items left
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={classNames('filter__link', {
                  selected: filterStatus === FilterStatus.All,
                })}
                data-cy="FilterLinkAll"
                onClick={() => setFilterStatus(FilterStatus.All)}
              >
                All
              </a>

              <a
                href="#/active"
                className={classNames('filter__link', {
                  selected: filterStatus === FilterStatus.Active,
                })}
                data-cy="FilterLinkActive"
                onClick={() => setFilterStatus(FilterStatus.Active)}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={classNames('filter__link', {
                  selected: filterStatus === FilterStatus.Completed,
                })}
                data-cy="FilterLinkCompleted"
                onClick={() => setFilterStatus(FilterStatus.Completed)}
              >
                Completed
              </a>
            </nav>

            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={handleClearCompleted}
              disabled={!completedTodos}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      <ErrorNotification
        message={todosErrorMessage}
        onClose={() => setTodosErrorMessage('')}
      />
    </div>
  );
};
