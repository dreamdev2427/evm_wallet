const db = require("../../db");

const MoralisApiKeys = db.MoralisApiKeys;

var ObjectId = require('mongodb').ObjectID;

exports.set = (req, res) => {
    var email = req.body.email;
    var apiKey = req.body.apiKey;

    var newPrice = new MoralisApiKeys({
        email,
        apiKey,
    });

    MoralisApiKeys.find({ 
        email
    })
    .then(async (docs) =>{
        if(docs.length>0)
        {
            try {
                await MoralisApiKeys.updateOne(
                    {_id: docs[0]._id},
                    {
                        $set: {
                            apiKey
                        },
                        $currentDate: {
                            ends: true,
                        }
                    },
                    { upsert: true }
                );
               return res.send({ code: 0, data:{}, message: "" });
            } catch (err) {
                return res.send({ code: -1, data:{}, message: "" });
            }
        }else{            
            newPrice.save().then((data) => {
                return res.send({ code: 0, data, message:"" });
            }).catch((err) => {
                return res.send({ code: -1, data:{}, message: "" });
            });
        }        
    }).catch((err) => {    
        return res.send({ code: -1, data:{}, message: "" });      
    })
    
}

exports.getAll = (req, res) => {
    MoralisApiKeys.find({})
    .then((docs) => {
            return res.send({ code:0, data: docs, message: "" });
    }).catch((err) => {        
        return res.send({ code: -1, data:[], message: "" });   
    });
}

exports.delete = (req, res) => {
    var idArray = req.body.idArray;

    for(let idx=0; idx<idArray.length; idx++)
    {
        MoralisApiKeys.deleteOne({ _id: idArray[idx] }, function (err) {
        });
    }
    return res.send({ code:0, message: "" });
}
