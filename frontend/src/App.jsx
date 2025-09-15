import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function App() {
  const [users, setUsers] = useState([]);
  const [health, setHealth] = useState(null);
  const [email, setEmail] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [error, setError] = useState("");

   const fetchUsers = async () => {
    try {
      const r = await fetch(`${API_URL}/api/users`);
      const data = await r.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchHealth = async () => {
    try {
      const r = await fetch(`${API_URL}/api/health`);
      const data = await r.json();
      setHealth(data);
    } catch (error) {
      console.error("Error fetching health:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchHealth();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();

    if (!trimmed) {
      setError('Ingresa un email');
      return;
    }

    setLoadingCreate(true);
    try {
      const r = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed })
      });

      if (r.status === 201) {
        setEmail('');
        await fetchUsers();
      } else {
        const err = await r.json().catch(() => ({}));
        setError(err?.error || `Error ${r.status}`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingCreate(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm(`¿Eliminar usuario #${id}?`)) return;
    try {
      const r = await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
      if (r.status === 204) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        const err = await r.json().catch(() => ({}));
        alert(err?.error || `Error ${r.status}`);
      }
    } catch (e) {
      alert(e.message);
    }
  };
  return (
    <div style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>Mini proyecto: React + Node + Postgres (Docker Dev)</h1>
      <p><b>API_URL:</b> {API_URL}</p>

      <section>
        <h2>Health</h2>
        <pre>{JSON.stringify(health, null, 2)}</pre>
      </section>

      <section>
        <h2>Crear usuario</h2>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ flex: 1, padding: 8 }}
            required
          />
          <button type="submit" disabled={loadingCreate} style={{ padding: '8px 16px' }}>
            {loadingCreate ? 'Creando…' : 'Crear'}
          </button>
        </form>
        {error && <p style={{ color: 'crimson', marginTop: 8 }}>{error}</p>}
      </section>

      <section>
        <h2>Usuarios</h2>
        {users.length === 0 ? (
          <p><i>Sin usuarios todavía.</i></p>
        ) : (
          <ul>
            {users.map((u) => (
              <li key={u.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ minWidth: 48 }}>#{u.id}</span>
                <span style={{ flex: 1 }}>{u.email}</span>
                <small style={{ opacity: 0.7 }}>
                  {new Date(u.created_at).toLocaleString()}
                </small>
                <button onClick={() => onDelete(u.id)} style={{ marginLeft: 12 }}>
                  borrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
