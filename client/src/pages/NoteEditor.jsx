// client/src/pages/NoteEditor.jsx
import { useState, useEffect } from 'react';
import API from '../api';
import { useParams, useNavigate } from 'react-router-dom';

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(()=>{
    if (id) {
      API.get(`/notes/${id}`).then(res => {
        setTitle(res.data.title);
        setContent(res.data.content);
      }).catch(err => console.error(err));
    }
  }, [id]);

  const save = async () => {
    try {
      if (id) {
        await API.put(`/notes/${id}`, { title, content });
      } else {
        await API.post('/notes', { title, content });
      }
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <h2>{id ? 'Edytuj notatkę' : 'Nowa notatka'}</h2>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Tytuł" />
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Treść" rows={10} />
      <button onClick={save}>Zapisz</button>
      <button onClick={()=>navigate('/')}>Anuluj</button>
    </div>
  );
}
