var Chat = function(){
  var self = this;

  self.messages = ko.observableArray([]);
  self.members = ko.observableArray([]);
  self.login = ko.observable(true);

  self.latest_id = null;
  self.type = null;
  self.color = "000000";
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
      self.write_messages(data.list);
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
        self.write_messages(data.list, true);
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
Chat.prototype.write_messages = function(messages, prev){
  var self = this;

  messages.forEach(function(obj){
    var message = new Message(obj, self.client);
    prev ? self.messages.unshift(message) : self.messages.push(message);
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
    color: self.color,
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

Chat.prototype.set_color_form = function(current_color){
  var self = this;

  var div = $("#color_select");
  var colors = ["000000", "808080", "800000", "808000", "008000", "008080", "000080", "800080", "FF00FF", "FF6600"];
  self.color = current_color;
  colors.forEach(function(color){
    var span = $("<span></span>", {
      css: { color: "#" + color },
      addClass: "color_select_color" + (color == current_color ? " selected" : ""),
      on: {
        click: function(){
          self.color = color;
          $.cookie("color", color, { expires: 360 });
          $(this).nextAll().removeClass("selected");
          $(this).prevAll().removeClass("selected");
          $(this).addClass("selected");
        }
      }
    });
    span.text("■");
    div.append(span);
  });
};

$(document).ready(function(){
  var chat = new Chat();
  ko.applyBindings(chat);
  chat.set_color_form($.cookie("color"));
  $("#login_id").val($.cookie("login_id"));
  chat.init();
});
