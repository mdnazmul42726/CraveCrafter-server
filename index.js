const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express());

app.get('/', async (req, res) => res.send('CraveCrafter Server is Running'))
app.listen(port, () => console.log('CraveCrafter Server is Running On PORT:', port));