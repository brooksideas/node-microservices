import * as express from 'express'
import { Request, Response } from 'express'
import * as cors from 'cors'
import { createConnection } from 'typeorm'
import { User } from "./entity/user";
import { Product } from "./entity/product";
import * as amqp from 'amqplib/callback_api';
import { usersApi } from './api/users-api';

// Creating the Database connection to the MySQL 
createConnection().then(db => {
    const productRepository = db.getRepository(Product);
    const userRepository = db.getRepository(User);

    // Unique AMQP URL to connect to
    amqp.connect('amqps://vhmeuklw:A2l_ngGZuZ85zhbykeiu0pbeRHb9lXov@roedeer.rmq.cloudamqp.com/vhmeuklw', (error0, connection) => {
        if (error0) {
            throw error0
        }
        // Create the Messaging Channel
        connection.createChannel((error1, channel) => {
            if (error1) {
                throw error1
            }

            const app = express()

            app.use(cors({
                origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4200']
            }))

            app.use(express.json())


            app.get('/api/products', async (req: Request, res: Response) => {
                const products = await productRepository.find()
                res.json(products)
            })

            app.post('/api/products', async (req: Request, res: Response) => {
                const product = await productRepository.create(req.body);
                const result = await productRepository.save(product)
                channel.sendToQueue('product_created', Buffer.from(JSON.stringify(result)))
                return res.send(result)
            })

            app.get('/api/products/:id', async (req: Request, res: Response) => {
                const product = await productRepository.findOne(req.params.id)
                return res.send(product)
            })

            app.put('/api/products/:id', async (req: Request, res: Response) => {
                const product = await productRepository.findOne(req.params.id)
                productRepository.merge(product, req.body)
                const result = await productRepository.save(product)
                channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(result)))
                return res.send(result)
            });

            app.delete('/api/products/:id', async (req: Request, res: Response) => {
                const result = await productRepository.delete(req.params.id)
                channel.sendToQueue('product_deleted', Buffer.from(req.params.id))
                return res.send(result)
            })

            app.post('/api/products/:id/like', async (req: Request, res: Response) => {
                const product = await productRepository.findOne(req.params.id)
                product.likes++
                const result = await productRepository.save(product)
                return res.send(result)
            })


            //* USERS END POINTS */

            app.get('/api/users', async (req: Request, res: Response) => {
                const users = await userRepository.find()
                res.json(users)
            })

            app.post('/api/users', async (req: Request, res: Response) => {
                const user = await userRepository.create(req.body);
                const result = await userRepository.save(user)
                channel.sendToQueue('user_created', Buffer.from(JSON.stringify(result)))
                return res.send(result)
            })


            app.get('/api/users/:id', async (req: Request, res: Response) => {
                const user = await userRepository.findOne(req.params.id)
                return res.send(user)
            })

            app.put('/api/users/:id', async (req: Request, res: Response) => {
                const user = await userRepository.findOne(req.params.id)
                userRepository.merge(user, req.body)
                const result = await userRepository.save(user)
                channel.sendToQueue('user_updated', Buffer.from(JSON.stringify(result)))
                return res.send(result)
            });

            app.delete('/api/users/:id', async (req: Request, res: Response) => {
                const result = await userRepository.delete(req.params.id)
                channel.sendToQueue('user_deleted', Buffer.from(req.params.id))
                return res.send(result)
            })


            /*********************************************************/


            console.log('Listening to port: 8000')
            app.listen(8000)
            process.on('beforeExit', () => {
                console.log('closing')
                connection.close()
            })
        })
    })
})
