import * as express from 'express'
import { Request, Response } from 'express'
import * as cors from 'cors'
import { createConnection } from 'typeorm'
import { User } from "../entity/user";
import * as amqp from 'amqplib/callback_api';


const app = express.Router();
 
// Creating the Database connection to the MySQL 
createConnection().then(db => {
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
        })
    })
})
export const usersApi = app;