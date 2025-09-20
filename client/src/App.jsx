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


function App(){
  return(
<BrowserRouter>
<Routes>
  <Route path="/login" element={<Login/>}/>
  <Route path="/register" element={<Register/>}/>
  <Route path="/" element={<Protected> <Notes/></Protected>}/>
  <Route path="/new" element={<Login/>}/>
  <Route path="/note/:id" element={<Login/>}/>
</Routes>
</BrowserRouter>
  );
}
