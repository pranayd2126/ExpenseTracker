
import express from 'express'

import {
  register,
  login,
  logout,
  changePassword,
  getAllUsers,
} from "../controllers/user-api.js";

const exp=express.Router()

//
exp.post('/register',register)
exp.post('/login', login)
exp.post('/logout', logout)
exp.post('/changePassword', changePassword)
exp.get('/getAllUsers', getAllUsers)



export default exp