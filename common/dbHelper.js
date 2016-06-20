/**
 * Created by apple on 16/6/19.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    models = require('./modules');

for (var m in models) {
    mongoose.model(m, new Schema(models[m]));
}
module.exports = {
    getModel: function (type) {
        return  _getModel(type);
    }
};

var _getModel = function (type) {
    return mongoose.model(type);
};


//var mongoose = require('mongoose');
//var Schema = mongoose.Schema;
//
//module.exports = function() {
//
//    var QuerySchema = new Schema({
//        search: String,
//        date: String
//    });
//    mongoose.model('Query', QuerySchema)
//};