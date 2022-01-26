import * as express from 'express'
import { Request, Response } from 'express'
import * as cors from 'cors'
import { createConnection } from "typeorm";
import * as amqp from 'amqplib/callback_api';
import { User } from './entity/user';
import { Product } from "./entity/product";
import axios from 'axios';

createConnection().then(db => {
    const productRepository = db.getMongoRepository(Product)
    const userRepository = db.getMongoRepository(User)

    amqp.connect('amqps://vhmeuklw:A2l_ngGZuZ85zhbykeiu0pbeRHb9lXov@roedeer.rmq.cloudamqp.com/vhmeuklw', (error0, connection) => {
        if (error0) {
            throw error0
        }

        connection.createChannel((error1, channel) => {
            if (error1) {
                throw error1
            }

            channel.assertQueue('product_created', { durable: false })
            channel.assertQueue('product_updated', { durable: false })
            channel.assertQueue('product_deleted', { durable: false })

            channel.assertQueue('user_created', { durable: false })
            channel.assertQueue('user_updated', { durable: false })
            channel.assertQueue('user_deleted', { durable: false })

            const app = express()

            app.use(cors({
                origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4200']
            }))

            app.use(express.json())

            channel.consume('product_created', async (msg) => {
                const eventProduct: Product = JSON.parse(msg.content.toString())
                const product = new Product()
                product.admin_id = parseInt(eventProduct.id)
                product.title = eventProduct.title
                product.image = eventProduct.image
                product.likes = eventProduct.likes
                product.price = eventProduct.price
                await productRepository.save(product)
                console.log('product created')
            }, { noAck: true })

            channel.consume('product_updated', async (msg) => {
                const eventProduct: Product = JSON.parse(msg.content.toString())
                const product = await productRepository.findOne({ admin_id: parseInt(eventProduct.id) })
                productRepository.merge(product, {
                    title: eventProduct.title,
                    image: eventProduct.image,
                    likes: eventProduct.likes,
                    price: eventProduct.price

                })
                await productRepository.save(product)
                console.log('product updated')
            }, { noAck: true })

            channel.consume('product_deleted', async (msg) => {
                const admin_id = parseInt(msg.content.toString())
                await productRepository.deleteOne({ admin_id })
                console.log('product deleted')
            })

            app.get('/api/products', async (req: Request, res: Response) => {
                const products = await productRepository.find()
                return res.send(products)
            })

            app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                const product = await productRepository.findOne(req.params.id)
                await axios.post(`http://localhost:8000/api/products/${product.admin_id}/like`, {})
                product.likes++
                await productRepository.save(product)
                return res.send(product)
            });

            /* User End Point */
            channel.consume('user_created', async (msg) => {
                const eventUser: User = JSON.parse(msg.content.toString())
                const user = new User()
                user.uid = eventUser.uid
                user.first_name = eventUser.first_name
                user.last_name = eventUser.last_name
                user.email = eventUser.email
                user.age = eventUser.age
                await userRepository.save(user)
                console.log('user created')
            }, { noAck: true })


            channel.consume('user_updated', async (msg) => {
                const eventUser: User = JSON.parse(msg.content.toString())
                const user = await userRepository.findOne({ uid: eventUser.uid })
                userRepository.merge(user, {
                    first_name: eventUser.first_name,
                    last_name: eventUser.last_name,
                    email: eventUser.email,
                    age: eventUser.age

                })
                await userRepository.save(user)
                console.log('user updated')
            }, { noAck: true })

            channel.consume('user_deleted', async (msg) => {
                const uid = parseInt(msg.content.toString())
                await userRepository.deleteOne({ uid })
                console.log('user deleted')
            })

            /*********************************************************/

            console.log('Listening to port: 8001')
            app.listen(8001)
            process.on('beforeExit', () => {
                console.log('closing')
                connection.close()
            })
        })
    })
})

