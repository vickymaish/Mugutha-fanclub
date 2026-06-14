const express = require('express');
const cors = require('cors');
const bodyParser = require('express').json;
require('./config/supabase');
const memberRoutes = require('./routes/memberRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const internalRoutes = require('./routes/internalRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
app.use(cors());
app.use(bodyParser());

app.use('/api/members', memberRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/internal', internalRoutes);
app.use('/webhook', webhookRoutes);

app.use(errorMiddleware);

module.exports = app;
