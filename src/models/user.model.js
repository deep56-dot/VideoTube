import mongoose,{Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const UserSchema= new Schema(
{
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    fullname:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        index:true
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    avatar:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String,
    },
    refreshToken:{
        type:String
    }
    
},
{timestamps:true}
)

UserSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password= await bcrypt.hash(this.password,10)
    next()

})

UserSchema.methods.isPasswordCorrect= async function(password) {
    return await bcrypt.compare(password,this.password)
}

UserSchema.method.generateAcessToken= function() {
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

UserSchema.method.generateRefreshToken= function() {
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User",UserSchema)