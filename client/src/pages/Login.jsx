
import { useState } from 'react';
import API from '../api';

export default function Login() {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [err,setErr]=useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      window.location.href = '/';
    } catch (e) {
      setErr(e.response?.data?.message || 'Błąd logowania');
    }
  };

  return (
    <div>
      <h2>Logowanie</h2>
      <form onSubmit={submit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Hasło" />
        <button type="submit">Zaloguj</button>
      </form>
      {err && <p style={{color:'red'}}>{err}</p>}
      <p>Nie masz konta? <a href="/register">Zarejestruj się</a></p>
    </div>
  );
}
