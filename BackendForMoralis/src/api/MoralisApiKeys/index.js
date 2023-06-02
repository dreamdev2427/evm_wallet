const express = require('express');
const router = express.Router();
const moralisApiKeys = require("./controller");

router.post('/set', moralisApiKeys.set);
router.post('/all', moralisApiKeys.getAll);
router.post('/delete', moralisApiKeys.delete);

module.exports = router;
