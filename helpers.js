var fs = require('fs');
var _ = require('lodash');
const request = require('request');
 
const API_HOST = 'http://api.formation.dataheroes.fr:8080/simulation';
 
exports.parseCsv = function (file) {
    var COLUMN_SEP = ';'
    var LINE_SEP = '\n';
    var obj_lines = [];
 
    var file_content = fs.readFileSync(file, 'utf-8')
 
    var lines = file_content.split(LINE_SEP);
    var columns = lines[0].split(COLUMN_SEP);
    for(var i = 1;i<lines.length;i++) {
        var line = lines[i].split(COLUMN_SEP);
        var obj_line = {};
        for(var j = 0;j<columns.length;j++) {
            obj_line[columns[j]] = line[j];
        }
        obj_lines.push(obj_line);
    }
    return obj_lines;
};
 
function toRad(degrees){
    return degrees * Math.PI / 180;
}
 
exports.send_solution = function (solution) {
    var options = {
        uri: API_HOST,
        method: 'POST',
        json: solution
      };
    request(options, function (error, response, body) {
        if(error) {
            console.log(error);
        }
    });
}
 
exports.compute_dist = function (lat_a, lng_a, lat_b, lng_b) {
    var earthRadius = 6371; // km
 
    lat_a = parseFloat(lat_a);
    lng_a = parseFloat(lng_a);
    lat_b = parseFloat(lat_b);
    lng_b = parseFloat(lng_b);
 
    var dLat = toRad(lat_b - lat_a);
    var dLon = toRad(lng_b - lng_a);
    var lat_a = toRad(lat_a);
    var lat_b = toRad(lat_b);
 
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat_a) * Math.cos(lat_b);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = earthRadius * c;
    return d
};
 
exports.get_score = function(problem, orders) {
    var total_distance_solution = 0;
    var total_bonus_solution = 0;
     
    var pos = {
        lat: 0.5,
        lng: 0.5
    };
     
    _.each(orders, function (order_id, i_order) {
        var order = _.find(problem.orders, function (o) {
            return o.order_id == order_id
        });
        var distance_order = exports.compute_dist(pos.lat, pos.lng, order.pos_lat, order.pos_lng);
        var bonus_order = Math.max(0, order.amount - i_order);
 
        total_distance_solution += distance_order;
        total_bonus_solution += bonus_order;
         
        pos.lat = order.pos_lat;
        pos.lng = order.pos_lng;
    });
 
    return {
        total_distance: total_distance_solution,
        total_bonus: total_bonus_solution,
        score: total_bonus_solution - total_distance_solution
    };
};