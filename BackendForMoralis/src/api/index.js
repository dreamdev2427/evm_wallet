const express = require('express');

const moralisApiKeys = require("./MoralisApiKeys");
const handover = require("./HandOver");

const router = express.Router();

router.use("/moralisApiKeys",  moralisApiKeys);
router.use("/handover",  handover);

module.exports = router;
