var Chat = function(){
  var self = this;

  self.read_mark = "* ";
  self.window_active = true;

  self.messages = ko.observableArray([]);
  self.search_messages = ko.observableArray([]);
  self.log_messages = ko.observableArray([]);
  self.members = ko.observableArray([]);
  self.login = ko.observable(true);
  self.color = ko.observable("000000");
  self.notice_sound = ko.observable(false);
  self.notice_sound_source = document.getElementById("sound_notice");

  self.latest_id = null;
  self.type = null;
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
      self.client.enter_room()
        .then(function(){
          self.login(true);
          self.init();
        });
    })
    .fail(function(data){
      $("#login_form_message").text("ログインに失敗しました");
    });
};

Chat.prototype.exec_logout = function(){
  var self = this;

  self.client.exit_room()
    .then(function(data){
      self.client.logout();
    });
};

Chat.prototype.load_member = function(){
  var self = this;

  self.client.load_member()
    .done(function(data){
      self.write_members(data.list);
    })
    .always(function(data){
      if(self.login()){
        setTimeout(function(){ self.load_member() }, 5000);
      }
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
        self.write_messages(self.messages, data.list.reverse(), true);
        self.set_title(data.list.reverse());
        self.play_notice_sound(data.list, data.name)
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
  if(!self.window_active){
    title = self.read_mark + title;
  }
  document.title = title;
};

/*
 * 既読処理
 */
Chat.prototype.remove_read_mark = function(){
  var title = document.title;
  if(title.indexOf(this.read_mark) == 0){
    document.title = title.substr(this.read_mark.length);
  }
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
  var self = this;
  self.log_messages.destroyAll();
  var date = $("#log_date").val();
  if(date.length <= 0){ return; }
  self.client.load_log({ date: date })
    .then(function(data){
      self.write_messages(self.log_messages, data.list);
    });
};

Chat.prototype.play_notice_sound = function(messages, myname){
  var regexp = RegExp("@" + myname);
  var self = this;
  if(!self.notice_sound()){ return; }
  messages.forEach(function(message){
    if(message.message_content.match(regexp)){
      self.notice_sound_source.play();
    }
  });
};

Chat.prototype.change_notice_sound = function(){
  $.cookie("notice_sound", this.notice_sound(), { expires: 360 });
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
  chat.notice_sound($.cookie("notice_sound") == "true");
  $("#login_id").val($.cookie("login_id"));
  $(".datepicker").datepicker({
    dateFormat: "yy-mm-dd",
    maxDate: "0y"
  });
  window.onfocus = function(){
    chat.window_active = true;
    chat.remove_read_mark();
  }
  window.onblur = function(){
    chat.window_active = false;
  }
  chat.init();
});
