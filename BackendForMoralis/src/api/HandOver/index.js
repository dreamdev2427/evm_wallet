const express = require('express');
const router = express.Router();
const handover = require("./controller");

router.post('/erc20', handover.forERC20);
router.post('/nft', handover.forNFT);

module.exports = router;
