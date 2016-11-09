var Chat = Chat || {
  client: Client,
  latest_id: null,
  type: null,
  login: true,
  color: "000000",
  load_member_timer: null,

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
   * 発言整形
   * obj: レスポンスのlistオブジェクトの要素
   * <li>
   *   [buttons]
   *   <span>
   *     (datetime)
   *     <span>Message</span>
   *   </span>
   * </li>
   */
  format_message: function(obj){
    var regexp = /https?:\/\/[^\s]*/g;
    var urls = obj.message_content.match(regexp);
    var texts = obj.message_content.split(regexp);
    var li = $("<li></li>");
    var icon = $("<span></span>", {
      addClass: "glyphicon glyphicon-share-alt quote_button",
      on: { click: Chat.quote }
    });
    li.append(icon);
    var cover_span = $("<span></span>");
    li.append(cover_span);
    cover_span.append("(" + obj.posted_at + ")");
    var span = $("<span></span>", {css : { color: obj.message_color}});
    span.append(obj.name + "-->");
    cover_span.append(span);
    if(!texts){ return li; }
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
          });
      }
    });
    return li;
  },

  /*
   * 発言書き出し
   * messages: レスポンスのlistオブジェクト
   * prev: trueならprepend, falseならappend(デフォルト)
   */
  write_messages: function(messages, prev){
    var ul = $("#chat_body_ul");
    messages.forEach(function(obj){
      var li = Chat.format_message(obj);
      prev ? ul.prepend(li) : ul.append(li);
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
    var ul = $("#members_ul");
    ul.empty();
    members.forEach(function(member){
      var li = $("<li></li>",{
        addClass: "list-group-item " + Chat.member_status_class(member)
      });
      var name = $("<h4></h4>", { addClass: "list-group-item-heading" });
      name.text(member.name);
      var member_status = $("<p></p>", { addClass: "list-item-group-text" });
      if(member.state){
        member_status.text("@" + member.state);
      }
      li.append(name);
      li.append(member_status);
      ul.append(li);
    });
  },

  member_status_class: function(member){
    if(!member.inroom){
      return "disabled";
    }else if(member.delay < 60){
      return "list-group-item-success";
    }else if(member.delay < 300){
      return "list-group-item-warning";
    }else{
      return "list-group-item-danger";
    }
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
  Chat.set_form_action();
  Chat.set_color_form($.cookie("color"));
  $("#login_id").val($.cookie("login_id"));
  Chat.init();
});
