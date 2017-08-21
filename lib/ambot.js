'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');
var http = require('http');
var https = require('https');
var req = require('request');
//Global Variables
var clinic_name = "";
var access_token = "";

var ambot = function Constructor(settings){
    this.settings = settings;
    this.settings.name = "stu";
    this.dbPath = settings.dbPath || path.resolve(process.cwd(), "data","norrisbot.db");
    this.user = null;
    this.db = null;
};

util.inherits(ambot, Bot);

module.exports = ambot;

ambot.prototype.run = function(){
    ambot.super_.call(this,this.settings);

    this.on('start', this._onStart);
    this.on('message',this._onMessage);
};

ambot.prototype._onStart = function(){
    this._loadBotUser();
    this._Mornin();
};
ambot.prototype._Mornin = function(){
  this.postMessageToChannel(this.channels[0].name, 'Hi..',
      {as_user: true});

};

ambot.prototype._isChatMessage = function(message){
    return message.type === 'message' && Boolean(message.text);
};
ambot.prototype._isChannelConversation = function (message) {
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C';
};
ambot.prototype._isFromamBot = function (message) {
    return message.user === this.user.id;
};
ambot.prototype._onMessage = function(message){
      if (this._isChatMessage(message) &&
          this._isChannelConversation(message) &&
          !this._isFromamBot(message)
      ) {
        if(this._isActivationCommand(message)){
          this._activateClinic(message);
        }else if(this._isConfirmed(message)){
          this._confirmed(message);
        } else if(this._isSayingHi(message)){
          this._sayHi(message);
        }else if(this._isTalkingtoMe(message)){
          this._showerThought(message);
        }else if(this._isSayingHi(message)){
          this._sayHi(message);
        }
      }else if (this._isChatMessage(message) &&
                !this._isChannelConversation(message) &&
                !this._isFromamBot(message)
            ){
              this._showerThoughtUser(message);

      }
};

ambot.prototype._loadBotUser = function(){
    var self = this;
    this.user = this.users.filter(function(user){
      return user.name === self.name;
    })[0];
};
ambot.prototype._isActivationCommand = function (message) {
    return message.text.toLowerCase().indexOf('activate') > -1 ;
};
ambot.prototype._isTalkingtoMe = function (message) {
    return message.text.toLowerCase().indexOf('stu') > -1;
};
ambot.prototype._isConfirmed = function (message) {
    return message.text.toLowerCase().indexOf('yes') > -1
};
ambot.prototype._isSayingHi = function (message) {
    return message.text.toLowerCase().indexOf('sense') > -1;
};
ambot.prototype._activateClinic = function (message) {
  var self = this;
  var channel = self._getChannelById(message.channel);
  var clinic = message.text.split("activate");
  clinic_name = clinic[clinic.length-1];
  if(clinic_name.length<2){
    self.postMessageToChannel(channel.name,"Activate what?", {as_user: true});
    clinic_name = "";
  }else{
    self.postMessageToChannel(channel.name,"Please confirm activation for:"+clinic[clinic.length-1], {as_user: true});
  }


};
ambot.prototype._showerThought = function (originalMessage) {
    var self = this;
    https.get('https://www.reddit.com/r/showerthoughts.json', function(res){
            var str = '';
            res.on('data', function (chunk) {
                   str += chunk;
             });
            res.on('end', function () {
              var json = JSON.parse(str);
              var random = Math.floor((Math.random() * json.data.children.length-1) + 1);
              console.log(random);
              var channel = self._getChannelById(originalMessage.channel);
              self.postMessageToChannel(channel.name,json.data.children[random].data.title, {as_user: true});
            });
      });
};
ambot.prototype._showerThoughtUser = function (originalMessage) {
    var self = this;
    https.get('https://www.reddit.com/r/showerthoughts.json', function(res){
            var str = '';
            res.on('data', function (chunk) {
                   str += chunk;
             });
            res.on('end', function () {
              var json = JSON.parse(str);
              var random = Math.floor((Math.random() * json.data.children.length-1) + 1);
              console.log(random);
              self.postMessage(originalMessage.user,json.data.children[random].data.title, {as_user: true});
            });
      });
};
ambot.prototype._showerThoughtFromFile = function(originalMessage){
  var self = this;
  var file = path.resolve(process.cwd(), "data","showerthoughts.json");
  fs.readFile(file, (err, data) => {
    var json = JSON.parse(data);
    var random = Math.floor((Math.random() * json.data.children.length) + 1);
    console.log(random);
    var channel = self._getChannelById(originalMessage.channel);
    self.postMessageToChannel(channel.name,json.data.children[random].data.title, {as_user: true});
  });
};
ambot.prototype._sayHi = function(originalMessage){
  var self = this;
  var channel = self._getChannelById(originalMessage.channel);
  self.postMessageToChannel(channel.name,"", {as_user: true});

};
ambot.prototype._confirmed = function(message){
  var self = this;
  var channel = self._getChannelById(message.channel);
  if(clinic_name.length<2){
    self.postMessageToChannel(channel.name,"There's nothing to activate", {as_user: true});
    return;
  }
  self.postMessageToChannel(channel.name,"Activating:"+clinic_name, {as_user: true});
  clinic_name = clinic_name.replace(/^\s+|\s+$/g, "");
  //Get Token
  req.post({
   url: 'http://amobileservice.cloudapp.net/token',
   form: { username: 'Admin', password: 'admin', grant_type: 'password'},
   headers: {
      'Accept': 'application/json',
      'Content-Type' : 'application/x-www-form-urlencoded'
   },
   method: 'POST'
  },

  function (e, r, body) {
      var json = JSON.parse(body);
      access_token = json.access_token;
      //Activating clinic_name
      req.post({
       url: 'http://amobileservice.cloudapp.net/api/Messaging/addFacility',
       form: { name: clinic_name, country: 'Kenya', configuration: 'kenyaqueue'},
       headers: {
          'Accept': 'application/json',
          'Content-Type' : 'application/json',
          'Authorization': 'Bearer '+access_token
       },
       method: 'POST'
      },

      function (e, r, body) {
          self.postMessageToChannel(channel.name,"Request complete. "+clinic_name+" has been activated", {as_user: true});
      });
  });
};
ambot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};
