const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4ip7zr9.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true, } });

async function run() {
    try {

        await client.connect();

        const topFoodCollection = client.db("craveDB").collection("topSellingFoods")
        const foodsCollection = client.db("craveDB").collection("foods")
        const ordersCollection = client.db("craveDB").collection("orders")

        app.get('/foods/top/v1', async (req, res) => {
            const cursor = await topFoodCollection.find().toArray()
            res.send(cursor)
        });

        app.get('/top-food/v1/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await topFoodCollection.findOne(query);
            res.send(result);
        });

        app.get('/foods/v1', async (req, res) => {
            const cursor = await foodsCollection.find().toArray();
            res.send(cursor);
        });

        app.get('/food/v1/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await foodsCollection.findOne(query);
            res.send(result)
        });

        app.get('/top-food/v1/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await topFoodCollection.findOne(query);
            res.send(result)
        });

        app.post('/food/order/v1', async (req, res) => {
            const orderData = req.body;
            const result = await ordersCollection.insertOne(orderData);
            res.send(result)
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', async (req, res) => res.send('CraveCrafter Server is Running'));

app.listen(port, () => console.log('CraveCrafter Server is Running On PORT:', port));