import express from 'express'
import { MongoClient } from 'mongodb';
import {cartItems as cartItemsRaw, products as productsRaw } from './temp-data'
let cartItems = cartItemsRaw;
let products = productsRaw;

async function start() {
    const url = `mongodb+srv://ansannj:2Ir1LvZTYpzb0j4i@cluster0.yl3zq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    const client = new MongoClient(url);
    await client.connect();
    const db =client.db('ShoppingCart');

    const app = express();
    app.use(express.json())

    app.get('/hello',async (req,res) => {
        const products = await db.collection('products').find({}).toArray();
        res.send(products)
    })

    app.get('/products',async (req,res) => {
        const products = await db.collection('products').find({}).toArray();
        res.send(products)
    })

    app.get('/products/:productId',async (req,res) => {
        const product = await db.collection('products').findOne({ id:req.params.productId });
        res.send(product)
    })

    async function populatedCartProducts(userId) {
        const user = await db.collection('users').findOne({ id:userId });   
        return Promise.all(user.cartItems.map(id => db.collection('products').findOne({ id })));
    }

    app.get('/users/:userId/cart',async (req,res) => {
        const userId = Number(req.params.userId);
            
        const populatedProducts = await populatedCartProducts(userId);
        res.send(populatedProducts)
    })

    app.post('/users/:userId/cart',async (req,res) => {
        const userId = Number(req.params.userId);
        const productId = req.body.id;

        await db.collection('users').updateOne({ id: userId}, {
            $addToSet: { cartItems: productId }
        });
        
        const populatedProducts = await populatedCartProducts(userId);
        res.send(populatedProducts)
    })

    app.delete('/users/:userId/cart/:productId',async (req,res) => {
        const userId = Number(req.params.userId);
        const productId = req.params.productId; 
        await db.collection('users').updateOne({ id: userId}, {
            $pull: { cartItems: productId }
        });

        const populatedProducts = await populatedCartProducts(userId);
        res.send(populatedProducts)
    })

    app.listen(8000, () => {
        console.log('Server is listening on port 8000')
    })
}

start();