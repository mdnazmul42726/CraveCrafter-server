const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4ip7zr9.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true, } });

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized 1' })
    };

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Unauthorized 2');
        }
        req.user = decoded;
        next();
    })
}

async function run() {
    try {

        await client.connect();

        const userCollection = client.db("craveDB").collection("user");
        const topFoodCollection = client.db("craveDB").collection("topSellingFoods");
        const foodsCollection = client.db("craveDB").collection("foods");
        const ordersCollection = client.db("craveDB").collection("orders");
        const blogsCollection = client.db("craveDB").collection("blogs");

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' }).send({ success: true });
        });

        app.get('/jwt/logout', async (req, res) => {
            res.clearCookie('token').send({ success: true });
        });

        app.post('/user/v1', async (req, res) => {
            const user = req.body;
            const result = userCollection.insertOne(user);
            res.send(result)
        })

        app.get('/food/count/v1', async (req, res) => {
            const count = await foodsCollection.estimatedDocumentCount();
            res.send(count);
        })

        app.get('/foods/top/v1', async (req, res) => {
            const cursor = await topFoodCollection.find().toArray()
            res.send(cursor)
        });

        app.get('/search/v1', async (req, res) => {
            const query = { food_name: req.query.title };
            const result = await foodsCollection.find(query).toArray();
            res.send(result)
        });

        app.get('/top-food/v1/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await topFoodCollection.findOne(query);
            res.send(result);
        });

        app.get('/foods/v1', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            // console.log('page', page, 'size', size);
            const result = await foodsCollection.find().skip(page * size).limit(size).toArray();
            res.send(result);
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

        app.get('/blogs/v1', async (req, res) => {
            const cursor = await blogsCollection.find().toArray();
            res.send(cursor)
        });

        app.get('/blog/v1/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await blogsCollection.findOne(query);
            res.send(result);
        });

        app.get('/orders/v2', verifyToken, async (req, res) => {
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'Invalid Access' });
            };

            let query = {}

            if (req.query?.email) {
                query = { buyerEmail: req.query.email }
            };

            const result = await ordersCollection.find(query).toArray();
            res.send(result)
        });

        app.get('/foods/added/v1', verifyToken, async (req, res) => {
            if (req.query.email !== req.user.email) {
                return res.status(403).send({ message: 'Invalid User' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            };

            const result = await foodsCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/food/order/v1', async (req, res) => {
            const orderData = req.body;

            const result = await ordersCollection.insertOne(orderData);
            res.send(result)
        });

        app.post('/add-food', async (req, res) => {
            const newFood = req.body;
            const result = await foodsCollection.insertOne(newFood);
            res.send(result);
        });

        app.patch('/quantity/v1/:id', async (req, res) => {
            const id = req.params.id;
            const newQuantity = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: { quantity: newQuantity.quantity }
            };

            const result = await foodsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);

        });

        app.patch('/food/update/:id', async (req, res) => {
            const id = req.params.id;
            const doc = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: { food_category: doc.food_category, food_img_url: doc.food_img_url, food_name: doc.food_name, quantity: doc.quantity, origin: doc.origin, description: doc.description, price: doc.price }
            };

            const result = await foodsCollection.updateOne(filter, updatedDoc, options);
            res.send(result)
        })

        app.delete('/orders/delete/v1/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        })

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