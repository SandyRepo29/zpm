require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/resources', require('./routes/resources'));
app.use('/api/teams',     require('./routes/teams'));
app.use('/api/releases',  require('./routes/releases'));
app.use('/api/epics',     require('./routes/epics'));
app.use('/api/tickets',   require('./routes/tickets'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`ZPM API running on http://localhost:${PORT}`));
