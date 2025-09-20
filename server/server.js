const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(PORT, () => console.log(`Server running on ${PORT}`)))
  .catch(err => { console.error('Mongo connection error', err); process.exit(1); });

  app.get('/', (req, res) => {
  res.send('Serwer działa 👍');
});