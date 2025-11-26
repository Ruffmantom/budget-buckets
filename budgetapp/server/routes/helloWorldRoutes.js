import express from 'express'
const router = express.Router();

import {
    helloWorld
} from '../controllers/helloWorldController.js'

router.post('/helloworld', helloWorld);

export default router