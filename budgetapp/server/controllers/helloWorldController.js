import asyncHandler from 'express-async-handler'
// useful requires
/*
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler"); helpful for asynchronous functions 
const multer = require("multer"); // helpful for uploading files
const createDOMPurify = require("dompurify"); // purifies pure HTML request.body
const { JSDOM } = require("jsdom"); // helper for dompurify
*/

export const helloWorld = asyncHandler(async (req, res) => {

    const {userName} = req.body;
    return res.status(200).json({ message: `Hello ${userName}! From the server!` })
})