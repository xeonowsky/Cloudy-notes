import {useState} from 'react';
import API from '../api';

export default function Register(){
    const [email,setEmail]=useState('');
    const [password,setPassword]=useState('');
    const [err,setErr]=('');

    const submit = async (e) =>{
        e.preventDefault();
    try{
        const {data} = await API.post('/auth/login', {email,password});
        localStorage.setItem('token', data.token);
        window.location.href='/';
    
    }catch(e){
        setErr(e.response?.data?.message || 'Blad logowania');
    }
    
};
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Rejestracja</h2>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Hasło"
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
          >
            Zarejestruj
          </button>
        </form>
        {err && <p className="text-red-500 mt-4">{err}</p>}
        <p className="mt-4 text-center">
          Masz konto? <a href="/login" className="text-blue-500 hover:underline">Zaloguj się</a>
        </p>
      </div>
    </div>
  );
}
