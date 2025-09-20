const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');


router.post('/register', async(req,res) => {
    const {email,password} = req.body;
    if(!email || !password) return res.status(400).json({message:'Missing fields'});
    try{
        const existing = await User.findOne({email});
        if(existing) return res.status(400).json({message: 'Missing fields'});
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password,salt);
        const user = new User({email, passwordHash});
        await user.save();

        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET,{expiresIn:'7d'});
        res.json({token,user:{id:user._id,email:user.email}});
    }catch(err){
        console.error(err);
        res.status(500).json({message:'Server error'});
    }
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;