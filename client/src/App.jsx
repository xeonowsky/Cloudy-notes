import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Notes from './pages/Notes.jsx'
import NoteEditor from './pages/NoteEditor'
import './App.css'

function Protected({children}){
  const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login"/>;
  }


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Register />} /> {/* Domyślnie rejestracja */}
      </Routes>
    </Router>
  );
}