var Chat = function(){
  var self = this;

  self.messages = ko.observableArray([]);
  self.search_messages = ko.observableArray([]);
  self.log_messages = ko.observableArray([]);
  self.members = ko.observableArray([]);
  self.login = ko.observable(true);
  self.color = ko.observable("000000");

  self.latest_id = null;
  self.type = null;
  self.load_member_timer = null;
  self.client = new Client({
    login_failed_callback: function(){
      self.login(false);
    }
  });
};

Chat.prototype.init = function(){
  var self = this;

  self.client.enter_room()
    .done(function(){
      self.load_init();
    });
};

Chat.prototype.load_init = function(){
  var self = this;

  self.client.load_init()
    .done(function(data){
      self.latest_id = data.list[0].message_id;
      self.type = data.list[0].chat_id;
      self.write_messages(self.messages, data.list);
      self.set_title(data.list);
      self.load_member();
      self.load_member_timer = setInterval(function(){
        if(self.login()){
          self.load_member();
        }else{
          clearInterval(self.load_member_timer);
        }
      }, 5000);
      self.load_latest();
    });
};

Chat.prototype.exec_login = function(){
  var self = this;

  var id = $("#login_id").val();
  var password = $("#login_password").val();
  $.cookie("login_id", id, { expires: 360});
  self.client.login({
    id: id,
    password: password
  })
    .then(function(data){
      self.login(true);
      self.init();
    })
    .fail(function(data){
      $("#login_form_message").text("ログインに失敗しました");
    });
};

Chat.prototype.exec_logout = function(){
  var self = this;

  self.client.logout();
};

Chat.prototype.load_member = function(){
  var self = this;

  self.client.load_member()
    .done(function(data){
      self.write_members(data.list);
    });
};

Chat.prototype.load_latest = function(){
  var self = this;

  self.client.load_latest({
    latest_id: self.latest_id,
    type: self.type
  })
    .done(function(data){
      var ul = $("#chat_body_ul");
      if(data.list.length > 0){
        self.latest_id = data.list[0].message_id;
        self.type = data.list[0].chat_id;
        self.write_messages(self.messages, data.list, true);
        self.set_title(data.list.reverse());
      }
    })
    .always(function(data){
      if(self.login()){
        setTimeout(function(){ self.load_latest() }, 5000);
      }
    });
};

/*
 * 発言書き出し
 * messages: レスポンスのlistオブジェクト
 * prev: trueならprepend, falseならappend(デフォルト)
 */
Chat.prototype.write_messages = function(arr, messages, prev){
  var self = this;

  messages.forEach(function(obj){
    var message = new Message(obj, self.client);
    prev ? arr.unshift(message) : arr.push(message);
  });
};

/*
 * titleへのセット
 * messages: レスポンスのlistオブジェクト
 */
Chat.prototype.set_title = function(messages){
  var self = this;

  if(messages.length <= 0){ return; }
  var message = messages[0];
  var title = "(" + message.name + ")" + message.message_content;
  document.title = title;
};

/*
 * メンバー整形・書き出し
 * members: レスポンスのlistオブジェクト
 */
Chat.prototype.write_members = function(members){
  var self = this;

  self.members.removeAll();
  members.forEach(function(obj){
    var member = new Member(obj);
    self.members.push(member);
  });
};

Chat.prototype.create_message = function(){
  var self = this;

  var message = $("#message").val();
  if(message.length <= 0){ return; }
  $("#message").val("");
  self.client.create_message({
    color: self.color(),
    message: message
  });
};

Chat.prototype.change_status = function(){
  var self = this;

  var new_status = $("#status").val();
  self.client.change_status({
    status: new_status
  });
};

Chat.prototype.create_judge = function(){
  var self = this;

  var judge = $("#judge").val();
  if(judge.length <= 0){ return; }
  $("#judge").val("");
  self.client.create_judge({
    message: judge
  });
};

Chat.prototype.create_auto = function(){
  var self = this;
  self.client.create_auto();
};

Chat.prototype.change_color = function(){
  $.cookie("color", this.color(), { expires: 360 });
};

Chat.prototype.search_message = function(){
  var self = this;
  self.search_messages.destroyAll();
  var query = $("#search_query").val();
  if(query.length <= 0){ return; }
  self.client.search_message({ query: query })
    .then(function(data){
      self.write_messages(self.search_messages, data.list);
    });
};

Chat.prototype.load_log = function(){
};

$(document).ready(function(){
  var chat = new Chat();
  ko.applyBindings(chat);
  var color = $.cookie("color");
  if(color){
    chat.color(color);
    var select = $("#select_color");
    select.val(color);
    select.selectpicker("refresh");
  }
  $("#login_id").val($.cookie("login_id"));
  chat.init();
});
