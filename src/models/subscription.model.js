 import mongoose ,{Schema} from "mongoose";

 const subscriptionSchema=new Schema({
    subscribe:{
        type:Schema.Types.ObjectId,//one who is subscribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,//one to who is subscriber is subscribing
        ref:"User"
    }
 },{timestamps:true})


 export const Subscription=mongoose.model("Subscription",subscriptionSchema)