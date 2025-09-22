// client/src/pages/Notes.jsx
import { useEffect, useState } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';

export default function Notes() {
  const [notes, setNotes] = useState([]);

  const fetchNotes = async () => {
    try {
      const { data } = await API.get('/notes');
      setNotes(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(()=>{ fetchNotes(); }, []);

  const remove = async (id) => {
    if (!confirm('Usunąć notatkę?')) return;
    await API.delete(`/notes/${id}`);
    setNotes(notes.filter(n=>n._id !== id));
  };

  return (
    <div>
      <h2>Moje notatki</h2>
      <Link to="/new">+ Nowa notatka</Link>
      <ul>
        {notes.map(n => (
          <li key={n._id}>
            <Link to={`/note/${n._id}`}>{n.title || 'Bez tytułu'}</Link>
            {' '}<button onClick={()=>remove(n._id)}>Usuń</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
