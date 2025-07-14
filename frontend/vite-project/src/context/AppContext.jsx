import { createContext, useEffect } from "react";
import { useState } from "react";
import { toast }  from "react-toastify"
import axios from "axios";

export const AppContext = createContext();

export const AppContextProvider = (props) =>{

    axios.defaults.withCredentials = true; //send the cookies

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [isLoggedin, setIsLoggedin] = useState(false)
    const [userData, setUserData] = useState(null)


   const getAuthState = async () =>{
    try {
       const {data} = await axios.post(backendUrl + "/api/auth/is-auth")
       if(data.success){
        setIsLoggedin(true)
        await getUserData()
       } 
       else { 
      setIsLoggedin(false);
      setUserData(null);
       }
    } catch (error) {
        toast.error(error.message)
    }
   }

   const getUserData = async () => {   //fist login or signup karege then uske baad getuserdata ko call karenge phir data aayega
    try {
        const { data } = await axios.get(backendUrl + "/api/user/data");
            console.log("User Data API response:", data); 
        if (data.success) {
            setUserData(data.userData);
        } else {
            toast.error(data.message);
            return ;
        }
    } catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
    }
};

useEffect(() =>{
   getAuthState();
},[])

    const value = {
     backendUrl,
     isLoggedin,
     setIsLoggedin,
     userData,
     setUserData,
     getUserData,
    }


    return(
        <AppContext.Provider value= {value}>
          {props.children}
        </AppContext.Provider>
    )
}



// App starts → AppContextProvider mounts

// useEffect(() => getAuthState(), []) runs once on mount

// getAuthState() calls /api/auth/is-auth

// If success → sets isLoggedin = true and calls getUserData()

// getUserData() calls /api/user/data → sets userData

