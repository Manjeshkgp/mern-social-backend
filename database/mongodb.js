import mongoose from "mongoose";

mongoose.set('strictQuery', false);
const connect = async () => {
  try {
  await mongoose.connect(process.env.MongoDBURI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(err);
    console.log("Could not connect to database");
  }
};

export default connect;