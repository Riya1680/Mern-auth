import React from 'react'
import {Routes, Route} from "react-router-dom"
import Login from './Pages/Login'
import Home from './Pages/Home'
import EmailVerify from './Pages/EmailVerify'
import ResetPassword from './Pages/ResetPassword'
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <div>
      {/* ToastContainer is the component that displays toasts.You only need one ToastContainer in your app, usually in App.js or index.js. */}
    <ToastContainer/>  
    <Routes>
      <Route path = "/" element={<Home/>}/>
      <Route path = "/login" element={<Login/>}/>
      <Route path="/email-verify" element={<EmailVerify/>} />
      <Route path="/reset-password" element = {<ResetPassword/>} />
    </Routes>
    </div>
  )
}

export default App
