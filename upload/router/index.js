const express = require('express');
const router = express.Router();

const mainRouter = require('./router');
router.use('/', mainRouter);


module.exports = router;