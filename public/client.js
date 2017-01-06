var Client = function(obj){
  var self = this;

  self.login_failed_callback = obj.login_failed_callback;
};

/*
 * ログイン
 * obj.id: メールアドレス
 * obj.password: パスワード
 */
Client.prototype.login = function(obj){
  return this.send({
    path: "/auth",
    method: "post",
    data: { command: "login", mail: obj.id, pass: obj.password }
  });
};

/*
 * ログアウト
 */
Client.prototype.logout = function(){
  return this.send({
    path: "/auth",
    method: "post",
    data: { command: "logout" }
  });
};

/*
 * 入室
 */
Client.prototype.enter_room = function(){
  return this.send({
    path: "/chat",
    method: "post",
    data: { target: "room", command: "enter" }
  });
};

/*
 * 退室
 */
Client.prototype.exit_room = function(){
  return this.send({
    path: "/chat",
    method: "post",
    data: { target: "room", command: "exit" }
  });
};

/*
 * 初回読み込み
 */
Client.prototype.load_init = function(obj){
  return this.send({
    path: "/chat",
    method: "post",
    data: { target: "message", command: "load", reverse: true }
  });
};

/*
 * 最新発言読み込み
 * obj.latest_id: 最新ID
 * obj.type: チャット識別子
 */
Client.prototype.load_latest = function(obj){
  return this.send({
    path: "/chat",
    method: "post",
    data: {
      target: "message",
      command: "load",
      chat_id_more: obj.type,
      message_id_more: obj.latest_id,
      wait: true,
      timeout: 5,
      reverse: true
    }
  });
};

/*
 * メンバー読み込み
 */
Client.prototype.load_member = function(){
  return this.send({
    path: "/chat",
    method: "post",
    data: {
      target: "member",
      command: "load"
    }
  });
};

/*
 * 発言
 * obj.color: 発言色
 * obj.message: 発言
 */
Client.prototype.create_message = function(obj){
  return this.send({
    path: "/chat",
    method: "post",
    data: { target: "message", command: "post", color: obj.color, content: obj.message }
  });
};

/*
 * 状態変更
 * obj.stauts: 状態
 */
Client.prototype.change_status = function(obj){
  return this.send({
    path: "/chat",
    method: "post",
    data: { target: "member", command: "post", content: obj.status }
  });
};

/*
 * ジャッジ
 * obj.message: 発言
 */
Client.prototype.create_judge = function(obj){
  return this.send({
    path: "/chat",
    method: "post",
    data: { target: "message", command: "judge", content: obj.message }
  });
};

/*
 * 自動
 */
Client.prototype.create_auto = function(){
  return this.send({
    path: "/chat",
    method: "post",
    data: { target: "message", command: "auto" }
  });
};

/*
 * ページのタイトル取得
 * obj.url: URL
 */
Client.prototype.get_page_title = function(obj){
  return $.get({
    url: "/page_title",
    data: { url: obj.url },
    dataType: "json"
  });
};

/*
 * メッセージ検索
 * obj.query: クエリ
 */
Client.prototype.search_message = function(obj){
  return this.send({
    path: "/chat",
    method: "post",
    data: { target: "message", command: "load", query: obj.query, reverse: true }
  });
};

/*
 * ログ読み込み
 * obj.date: 日付(YYYY-MM-DD)
 */
Client.prototype.load_log = function(obj){
  var d1 = new Date(obj.date);
  var d2 = new Date(obj.date);
  d2.setDate(d2.getDate() + 1);
  var posted_from = (d1.getFullYear() % 1000) + "/" + (d1.getMonth() + 1) + "/" + d1.getDate() + " 00:00:00";
  var posted_to = (d2.getFullYear() % 1000) + "/" + (d2.getMonth() + 1) + "/" + d2.getDate() + " 00:00:00";
  return this.send({
    path: "/chat",
    method: "post",
    data: {
      target: "message",
      command: "load",
      posted_from: posted_from,
      posted_to: posted_to,
      reverse: true
    }
  });
};

/*
 * プロキシへのアクセス
 * obj.path: アクセス先のパス
 * obj.method: HTTPメソッド
 * obj.data: POSTパラメータ
 */
Client.prototype.send = function(obj){
  var self = this;
  var date = new Date().toLocaleString();
  var api_status = $("#api_status");
  var params = {
    url: "http://chat.shun256.com" + obj.path,
    data: obj.data,
    dataType: "json",
    crossDomain: true,
    xhrFields: {
      withCredentials: true
    }
  };
  return (obj.method == "get" ? $.get(params) : $.post(params))
    .then(function(data){
      var icon = $("<span></span>", { addClass: "glyphicon glyphicon-check text-success" });
      var message = " [OK] " + obj.path + " (" + date + ")";
      api_status.empty();
      api_status.append(icon);
      api_status.append(message);
      api_status.effect("highlight", {}, 1500);
      if(!data.login){
        self.login_failed_callback();
        return Promise.reject(data);
      }
      if(!data.success){
        return Promise.reject(data);
      }
      return Promise.resolve(data);
    })
    .fail(function(data){
      var icon = $("<span></span>", { addClass: "glyphicon glyphicon-ban-circle text-danger" });
      var message = " [NG] " + obj.path + " (" + date + ")";
      api_status.empty();
      api_status.append(icon);
      api_status.append(message);
      api_status.effect("highlight", { color: "#d9534f" }, 1500);
      return Promise.reject(data);
    });
}
