import React from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import { useContext } from 'react'
import axios from "axios"
import { useNavigate } from 'react-router-dom'
import { toast }  from "react-toastify"
import { useEffect } from 'react'

const EmailVerify = () => {
    
   axios.defaults.withCredentials = true;
  const {backendUrl, isLoggedin, userData, getUserData} = useContext(AppContext)

  const navigate = useNavigate()

  const inputRefs = React.useRef([])      //store the value we access the inputRefs.current

  //focus on next element
  const handleInput = (e,index) => {
    if(e.target.value.length > 0 && inputRefs.current.length - 1){
      inputRefs.current[index + 1].focus()      //  Focus the second input box manually => custom behavior like focusing the next input on type.
    }  
  }

  //handle delete by backspace
  const handleKeyDown = (e, index) => {
    if(e.key === "Backspace" && e.target.value === "" && index > 0){  //index > 0 → to make sure there's a previous input to go back to.
      inputRefs.current[index -1].focus()     //shifts focus to the previous input.
    }
  }

  //paste the otp
  const handlePaste = (e) =>{
    const paste = e.clipboardData.getData("text");  //gets the text from the clipboard. you copied 123456 -> paste would now contain "123456".
    const pasteArray = paste.split("");     //Converts the string ("123456") into an array => "123456" → ["1", "2", "3", "4", "5", "6"]
    pasteArray.forEach((char, index)=>{     
      if(inputRefs.current[index]){         //Checks if there is an input at the current position.
        inputRefs.current[index].value = char;
      }
    })
  }
  const onSubmitHandler = async (e) => {
    //we add the try-catch , we add the api call
    try {
      e.preventDefault();      //it will not reload the page when we sumit the form
      const otpArray = inputRefs.current.map(e => e.value)  //store the value of inputRefs.current in otpArray
      const otp = otpArray.join("")   //return string

      //send the otp in our backend call
      const {data } = await axios.post(backendUrl + "/api/auth/verify-account",{otp})
      if(data.success){
        toast.success(data.message)
        getUserData()  //setUserData
        navigate("/")
      }
      else{
        toast.error(data.message)
      }
       } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (!userData) {
    getUserData(); // make sure data is fetched
  }
 if (isLoggedin && userData && userData.isAccountVerified) {
    navigate("/");
  }
  },[isLoggedin, userData])

  return (
    <div  className='flex items-center justify-center min-h-screen  bg-gradient-to-br from-blue-200 to-purple-400'>
       <img onClick={() => navigate("/") } src={assets.logo} alt="" className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer' />
       <form onSubmit= {onSubmitHandler} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
        <h1 className='text-white text-2xl font-semibold text-center mb-4'>Email verify OTP</h1>
        <p className='text-center mb-6 text-indigo-300'>Enter the 6-digit code sent to your email id.</p>
        <div className='flex justify-between mb-8' onPaste={handlePaste}>
         {Array(6).fill(0).map((_, index)=>(    //Ignores the value (_) and uses the index for key/logic
           <input ref={e => inputRefs.current[index] = e} onInput = {(e) => handleInput(e, index)}  onKeyDown={(e) => handleKeyDown(e, index)}
            type="text" maxLength="1" key={index} required className='w-10 h-10 bg-[#333A5C] text-white text-center text-xl rounded-md ' />
          ))}
          </div>
          <button className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full'>Verify email</button>
       </form>
    </div>
  )
}

export default EmailVerify
