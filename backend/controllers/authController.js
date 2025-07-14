import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";


export const register = async (req, res) => {

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.json({
            success: false,
            message: "Missing Details"
        })
    }
    try {
        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return res.json({
                success: false, mesaage: "User already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);  //it generate the hash password we store in the database
        const user = new userModel({ name, email, password: hashedPassword ,})  //isAccountVerified: true
        await user.save();    //new user save in the models

        //Because a JWT payload must be an object, not plain text.
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie("token", token, {
            httpOnly: true,    //only http request access this cookie
            secure: process.env.NODE_ENV === "production", //whenever we run this project on live server then it runs https then it will true, when we run this project in local environment or local development then it return http it means not secure(secure will be false for development and secure will be fast for production)
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",   //strict or none dynamic value(whenever we working on local environment then we can write strict because in local development our backend will also run on local host and frontened will also run on local host so it will be the same environment we can write the strict but whenever we deploying this app live server then we can run the backened on another domain name and frontened run on another domain name then we add strict it will not work then they will add samesite is none.
            maxAge: 7 * 24 * 60 * 60 * 1000    //expires timing is cookie,
        })

        // //! Sending welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL, //sender email
            to: email,           // receiver email 
            subject: "Welcome to GREATSTACK",
            text: `Welcome to greatstack website. Your account has been created with email id : ${email}`
        }

        await transporter.sendMail(mailOptions);   // it sending the email using transporter


        return res.json({ success: true, message: "user register successfully" });

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.json({ success: false, message: "email and password are required" })
    }
    // suppose we have email and password then we use the try and catch
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "Invalid email" })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid password" })
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });   //generate the token

        res.cookie("token", token, {   //send these token in response
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({ success: true });

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.json({ success: true, message: "logged out" })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

//send Verification OTP to the User's Email
//Send the OTP (One-Time Password) to the user’s email. => Called when the user clicks a “Send OTP” or “Verify Email” button.
export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body
        const user = await userModel.findById(userId);
        if (user.isAccountVerified) {    //means isAccountVerified agar mera true hai iska matlab account already verigfy hai
            return res.json({ success: false, message: "Account already verified" })
        }
        //Math.random() -> (between 0 (inclusive) and 1 (exclusive).0.123, 0.999)   => Math.random() * 900000  => 0 to 899,999.999... =>10000 + Math.random() * 900000 =>10000 to 909,999.999...
        const otp = String(Math.floor(10000 + Math.random() * 900000));  //random 6-digit number between 10000 and 909999

        //  Save OTP and expiry time to the user model
        user.verifyOtp = otp;    //otp stored in verifyotp in database
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000   //24 hours

        await user.save();

        //  Prepare email content
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${otp}.verify your account using this otp.`
        }

        // Send email
        await transporter.sendMail(mailOptions);
        return res.json({ success: true, message: "verification otp sent on Email" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//Verify the user's account using the OTP they received. 2) Called after the user enters the OTP into a form and clicks “Verify”.
export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body      //otp dal reha hai form mein
    if (!userId || !otp) {
        return res.json({ success: false, message: "Missing Details" });
    }
    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }
        if (!user.verifyOtp || user.verifyOtp.trim() !== otp.trim()) {  //jo hum otp dal rehe hai aur jo email par otp aay ahi vo same hai ya nahi
            return res.json({ success: false, message: "Invalid OTP" });
        }
        if (user.verifyOtpExpireAt < Date.now()) {           //otpexpire date is lless than date.now means otp is expire
            return res.json({ success: false, message: "OTP Expired" })
        }

        user.isAccountVerified = true;
        user.verifyOtp = "";
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: "email verified successfully" })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
} 

//check if the user is authenticated
export const isAuthenticated = async(req , res) =>{
    try {
        return res.json({success: true});
    } catch (error) {
        return res.json({ success: false, message: error.message});
    }
}

//send Password Reset OTP
export const sendResetOtp = async( req, res) => {
    //whenver user reset password first provide the email id
    const {email} = req.body;
    if(!email){
        return res.json({success: false, message: "Email is required"})
    }
    try {
      const user = await userModel.findOne({email}) ; 
      if(!user) {
        return res.json({success: false, message: "User not found"});
      }
       const otp = String(Math.floor(100000 + Math.random() * 900000));  //random 6-digit number between 10000 and 909999

        //  Save OTP and expiry time to the user model
        user.resetOtp = otp;    //otp stored in resetotp in database
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000 //15 minutes baad expires ho jayegi

        await user.save();

        //  Prepare email content
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for resetting your password is ${otp}.Use this otp to proceed with resetting your password.`
        }

        // Send email
        await transporter.sendMail(mailOptions);
         return res.json({success: true, message: "otp sent to your email"});
    } catch (error) {
        return res.json({success: false, message: error.message});
    }
}

//Reset User Password
export const resetPassword = async(req, res) =>{
    const  {email, otp, newPassword} = req.body;

    if(!email || !otp || !newPassword){
        return res.json({ success: false, message:"Email, OTP,new Password are required"});
    } 
    try {
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "User not found"})
        }
        if(user.resetOtp === "" || user.resetOtp !== otp){
             return res.json({success: false, message: "Invalid OTP"})
        }
        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success: false, message: "OTP  Expired"})
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;

        await user.save();
        return res.json({success: true, message: "Password has been reset successfully"});
    } catch (error) {
      return res.json({success: false, message: error.message})  
    }
}