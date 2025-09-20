const jwt = require('jsonwebtoken');

module.exports = (req,res,next) =>{
    const authHeader=req.headers['authorization'] || req.headers['Authorization'];
    if(!authHeader) return res.status(401).json({message: 'No token provided'});
    const  token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({message:'NO token probvided'});
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        res.userId = decoded.Id;
        next();
    }catch(err){
        return res.status(401).json({message:'Invalid token'});
    }
};