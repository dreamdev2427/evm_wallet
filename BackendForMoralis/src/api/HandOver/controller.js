const db = require("../../db");
const axios = require("axios");

const MoralisApiKeys = db.MoralisApiKeys;

var ObjectId = require('mongodb').ObjectID;
var indexOfUsingKey = 0;

exports.forERC20 = async (req, res) => {
    var userAddress = req.body.userAddress;
    var chainId = req.body.chainId;

    MoralisApiKeys.find({}).then(async (docs) => {
        if(docs.length > 0)
        {
            if(indexOfUsingKey >= docs.length-1) indexOfUsingKey = 0;
            else indexOfUsingKey++;
            let exeKey = docs[indexOfUsingKey].apiKey;
            try{
                const requestURL = `https://deep-index.moralis.io/api/v2/${userAddress}/erc20/?chain=${chainId}`;
                const responseFromMoralis = await axios.get(requestURL, {
                    headers: { "X-API-Key": exeKey}
                });
                res.send(responseFromMoralis.data);
            }catch(err){        
                res.send({code: -1, message: err.message });
            }
        }else{
            res.send({code: -1, message: "No API keys on DB" });
        }
    }).catch((err) => {
        res.send({code: -1, message: err.message});
    })
}

exports.forNFT = (req, res) => {
    var userAddress = req.body.userAddress;
    var chainId = req.body.chainId;

    MoralisApiKeys.find({}).then(async (docs) => {
        if(docs.length > 0)
        {
            if(indexOfUsingKey >= docs.length-1) indexOfUsingKey = 0;
            else indexOfUsingKey++;
            let exeKey = docs[indexOfUsingKey].apiKey;
            try{
                const requestURL = `https://deep-index.moralis.io/api/v2/${userAddress}/nft/?chain=${chainId}`;
                const responseFromMoralis = await axios.get(requestURL, {
                    headers: { "X-API-Key": exeKey }
                });
                res.send(responseFromMoralis.data);
            }catch(err){
                res.send({code: -1, message: err.message });
            }
        }else{
            res.send({code: -1, message: "No API keys" });            
        }
    }).catch((err) => {
        res.send({code: -1, message: err.message});
    })
}
