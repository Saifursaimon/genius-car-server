const express = require('express');
const cors = require('cors');
const jwt = require("jsonwebtoken")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config()

app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster3.gnebokp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

function verify(req,res,next){
  const authHeader = req.headers.authorization
  if(!authHeader){
   return res.status(401).send({message:"unauthorized access"})
  }
  const token = authHeader.split(" ")[1]
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,function(err,decoded){
    if(err){
     return res.status(401).send({message:'unauthorized access'})
    }
    req.decoded = decoded
    next()
  })
  
}

async function run() {
  try {
    const serviceCollection = client.db('GeniusCar').collection("services")
    const orderCollection = client.db('GeniusCar').collection('orders')

    app.get('/services', async(req,res) => {
        const query = {}
        const cursor = serviceCollection.find(query);
        const result = await cursor.toArray();
        res.send(result)
    })

    app.post('/jwt', (req,res)=> {
      const user = req.body
      console.log(user)
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:"1h"})
      res.send({token})
    })

    app.get('/services/:id', async(req,res)=> {
        const id = req.params.id
        const query = {_id: new ObjectId(id)};
        const service = await serviceCollection.findOne(query)
        res.send(service)
    })
   
    app.get('/orders', verify, async(req,res) => {
      const decoded = req.decoded
      if(decoded.email !== req.query.email){
        return res.status(403).send({message:'unauthorized access'})
      }
      let query = {}
      if(req.query.email){
        query = {
          email : req.query.email
        }
      }
      const cursor = orderCollection.find(query)
      const orders = await cursor.toArray()
      res.send(orders)
    })

    app.post('/orders', async(req,res) => {
      const order = req.body
      const result = await orderCollection.insertOne(order)
      res.send(result)
    })

app.patch('/orders/:id', async(req,res) => {
  const id = req.params.id
  const query = {_id: new ObjectId(id)}
  const status= req.body.status
  const updatedDoc = {
    $set:{
      status:status
    }
  }
  const result = await orderCollection.updateOne(query,updatedDoc)
  res.send(result)
})

    app.delete('/orders/:id', async(req,res) => {
      const id = req.params.id
      const query = { _id : new ObjectId(id)}
      const result = await orderCollection.deleteOne(query)
      res.send(result)
    })

  } finally {
  
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Genius car server')
})

app.listen(port, ()=> {
    console.log(`genius car server running on port ${port}`)
})