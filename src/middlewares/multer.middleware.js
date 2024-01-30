import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req,file,cb){
        cb(null,"./public/temp")
    },
    filename:function (req,file,cb){
        // const uniqueSuffix = Date.now()+'_'+Math.round(Math.random()*1E9)

        // cb(null,file.fieldname +'_'+ uniqueSuffix)
        cb(null,file.originalname)
    }
})

export const upload = multer({
    //storage:storage (niche wala bhi kr skte h agr dono same hai)
    storage,
})