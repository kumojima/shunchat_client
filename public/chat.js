var Message = function(data){
  var self = this;

  self.name = data.name;
  self.message = ko.observable(data.message_content);
  self.posted_at = "(" + data.posted_at + ")";
  self.message_color = data.message_color;

  self.quote = function(){
    var input = $("#message");
    input.val(input.val() + self.posted_at + self.name + "-->" + $("<span>" + self.message() + "</span>").text());
    input.focus();
  };

  self.replace_url(data.message_content);
}

Message.prototype.replace_url = function(message){
  var self = this;
  var regexp = /https?:\/\/[^\s]*/g;
  var urls = message.match(regexp);
  var texts = message.split(regexp);
  var span = $("<span></span>");
  if(!texts){ return; }
  texts.forEach(function(text, i){
    span.append(text);
    if(urls && urls[i]){
      var url = urls[i];
      var favicon = $("<img>", {
        src: "http://favicon.hatena.ne.jp/?url=" + url
      });
      var a = $("<a></a>", {
        href: url,
        target: "_blank"
      });
      a.text(url);
      span.append(favicon);
      span.append(a);
      Chat.client.get_page_title({
        url: url
      })
        .done(function(data){
          a.text(data.result);
          self.message(span.html());
        });
    }
  });
  self.message(span.html());
};

var Member = function(data){
  var self = this;

  self.name = data.name;
  self.status = data.state ? "@" + data.state : "";
  self.member_style = self.member_status_class(data);
};

Member.prototype.member_status_class = function(member){
  if(!member.inroom){
    return "disabled";
  }else if(member.delay < 60){
    return "list-group-item-success";
  }else if(member.delay < 300){
    return "list-group-item-warning";
  }else{
    return "list-group-item-danger";
  }
};

var viewModel = function(){
  var self = this;

  self.messages = ko.observableArray([]);
  self.members = ko.observableArray([]);
}

var Chat = Chat || {
  client: Client,
  latest_id: null,
  type: null,
  login: true,
  color: "000000",
  load_member_timer: null,
  view_model: null,

  init: function(){
    $("#login").show();
    $("#logout").hide();
    this.client.enter_room()
      .done(function(){
        Chat.load_init();
      });
  },

  load_init: function(){
    this.client.load_init()
      .done(function(data){
        Chat.latest_id = data.list[0].message_id;
        Chat.type = data.list[0].chat_id;
        Chat.write_messages(data.list);
        Chat.set_title(data.list);
        Chat.load_member();
        Chat.load_member_timer = setInterval(function(){ Chat.load_member() }, 5000);
        Chat.load_latest();
      });
  },

  login_to_logout: function(){
    Chat.login = false;
    document.title = "chat";
    if(Chat.load_member_timer){
      clearInterval(Chat.load_member_timer);
    }
    $("#chat_body_ul").empty();
    $("#login").hide();
    $("#logout").show();
  },

  exec_login: function(){
    var id = $("#login_id").val();
    var password = $("#login_password").val();
    $.cookie("login_id", id, { expires: 360});
    this.client.login({
      id: id,
      password: password
    })
      .done(function(data){
        if(data.success){
          Chat.login = true;
          Chat.init();
        }else{
          $("#login_form_message").text("ログインに失敗しました");
        }
      });
  },

  exec_logout: function(){
    this.client.logout()
      .done(function(data){
        Chat.login_to_logout();
      });
  },

  load_member: function(){
    Chat.client.load_member()
      .done(function(data){
        Chat.write_members(data.list);
      });
  },

  load_latest: function(){
    Chat.client.load_latest({
      latest_id: Chat.latest_id,
      type: Chat.type
    })
      .done(function(data){
        var ul = $("#chat_body_ul");
        if(data.list.length > 0){
          Chat.latest_id = data.list[0].message_id;
          Chat.type = data.list[0].chat_id;
          Chat.write_messages(data.list, true);
          Chat.set_title(data.list.reverse());
        }
      })
      .always(function(data){
        if(Chat.login){
          setTimeout(Chat.load_latest, 5000);
        }
      });
  },

  /*
   * 発言書き出し
   * messages: レスポンスのlistオブジェクト
   * prev: trueならprepend, falseならappend(デフォルト)
   */
  write_messages: function(messages, prev){
    messages.forEach(function(obj){
      var message = new Message(obj);
      prev ? Chat.view_model.messages.unshift(message) : Chat.view_model.messages.push(message);
    });
  },

  /*
   * titleへのセット
   * messages: レスポンスのlistオブジェクト
   */
  set_title: function(messages){
    if(messages.length <= 0){ return; }
    var message = messages[0];
    var title = "(" + message.name + ")" + message.message_content;
    document.title = title;
  },

  /*
   * メンバー整形・書き出し
   * members: レスポンスのlistオブジェクト
   */
  write_members: function(members){
    Chat.view_model.members.removeAll();
    members.forEach(function(obj){
      var member = new Member(obj);
      Chat.view_model.members.push(member);
    });
  },

  create_message: function(){
    var message = $("#message").val();
    if(message.length <= 0){ return; }
    $("#message").val("");
    this.client.create_message({
      color: this.color,
      message: message
    });
  },

  change_status: function(){
    var new_status = $("#status").val();
    this.client.change_status({
      status: new_status
    });
  },

  create_judge: function(){
    var judge = $("#judge").val();
    if(judge.length <= 0){ return; }
    $("#judge").val("");
    this.client.create_judge({
      message: judge
    });
  },

  create_auto: function(){
    this.client.create_auto();
  },

  set_form_action: function(){
    $("#login_form").submit(function(){
      Chat.exec_login();
      return false;
    });
    $("#message_form").submit(function(){
      Chat.create_message();
      return false;
    });
    $("#status_form").submit(function(){
      Chat.change_status();
      return false;
    });
    $("#judge_form").submit(function(){
      Chat.create_judge();
      return false;
    });
    $("#auto_form").submit(function(){
      Chat.create_auto();
      return false;
    });
    $("#logout_form").submit(function(){
      Chat.exec_logout();
      return false;
    });
  },

  set_color_form: function(current_color){
    var div = $("#color_select");
    var colors = ["000000", "808080", "800000", "808000", "008000", "008080", "000080", "800080", "FF00FF", "FF6600"];
    this.color = current_color;
    colors.forEach(function(color){
      var span = $("<span></span>", {
        css: { color: "#" + color },
        addClass: "color_select_color" + (color == current_color ? " selected" : ""),
        on: {
          click: function(){
            Chat.set_color(color);
            $(this).nextAll().removeClass("selected");
            $(this).prevAll().removeClass("selected");
            $(this).addClass("selected");
          }
        }
      });
      span.text("■");
      div.append(span);
    });
  },

  set_color: function(color){
    this.color = color;
    $.cookie("color", color, { expires: 360 });
  },

  quote: function(){
    var input = $("#message");
    input.val(input.val() + $(this).next().text());
    input.focus();
  }
}

$(document).ready(function(){
  var vm = new viewModel();
  ko.applyBindings(vm);
  Chat.view_model = vm;
  Chat.set_form_action();
  Chat.set_color_form($.cookie("color"));
  $("#login_id").val($.cookie("login_id"));
  Chat.init();
});
