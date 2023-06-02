For the backend project of moralis APIs, we can change MongoDB collection name and port.


To change MongoDB collection name, go to src/db/config.js , we can see following code.

module.exports = {
    url: "mongodb://0.0.0.0:27017/iglooWallet"
}

MongoDB collection name is "iglooWallet" on the above code. You can rename it.



To change port, go to src/index.js 

const port = 2083;
 
We can set port number as we want.