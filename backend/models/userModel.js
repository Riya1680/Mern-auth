import { verify } from "crypto";
import mongoose from "mongoose";

//create the structure
const userSchema = new mongoose.Schema({
   name:{
    type: "String",
    required : true,
   },
   email:{
    type:"String",
    required: true,
    unique: true   //means of multiple user not create the  same email
   },
   password:{
    type:"String",
    required: true
   },

   //these are default value , it will automatically added in new user
   verifyOtp:{
    type:"String",
    default : " "   
   },
   verifyOtpExpireAt :{
    type:Number,
    default: 0
   },
   isAccountVerified :{
    type: Boolean,
    default : false
   },
   resetOtp:{
    type:String, 
    default:""
   },
   resetOtpExpireAt:{
    type:Number,
    default : 0
   }
});


//if  mongoose.models.user is not available ,it will create the mongoose.model('user', userSchema)
const userModel = mongoose.models.user ||  mongoose.model('user', userSchema)

export default userModel;