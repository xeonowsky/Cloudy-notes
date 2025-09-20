
const mangoose = require('mongoose');

const NoteSchema = new mangoose.Schema({
    userId:{type: mangoose.Schema.Types.ObjectId,ref:'User',required:true},
    title:{type: String, default:''},
    content:{type: String, default:''},
    createdAt:{type:Date, default: Date.now},
    updatedAt:{type:Date,default: Date.now}
})