import mongoose from "mongoose";

const connectDB = async () =>{
    mongoose.connection.on('connected', () => console.log("Database connected"));
   await mongoose.connect(`${process.env.MONGO_URI}/mern-auth`)
};

export default connectDB;

//mongoose.connection is the default connection object provided by Mongoose.
//When Mongoose successfully connects to the database, this 'connected' event is emitted, and the callback function is executed.