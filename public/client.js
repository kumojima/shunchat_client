var Client = Client || {
  /*
   * ログイン
   * obj.id: メールアドレス
   * obj.password: パスワード
   */
  login: function(obj){
    return $.post({
      url: "/proxy",
      data: {
        path: "/auth",
        method: "post",
        data: { command: "login", mail: obj.id, pass: obj.password }
      },
      dataType: "json"
    });
  },

  /*
   * ログアウト
   */
  logout: function(){
    return this.post_proxy({
      path: "/auth",
      method: "post",
      data: { command: "logout" }
    });
  },

  /*
   * 入室
   */
  enter_room: function(){
    return this.post_proxy({
      path: "/chat",
      method: "post",
      data: { target: "room", command: "enter" }
    });
  },

  /*
   * 初回読み込み
   */
  load_init: function(obj){
    return this.post_proxy({
      path: "/chat",
      method: "post",
      data: { target: "message", command: "load", reverse: true }
    });
  },

  /*
   * 最新発言読み込み
   * obj.latest_id: 最新ID
   * obj.type: チャット識別子
   */
  load_latest: function(obj){
    return this.post_proxy({
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
  },

  /*
   * メンバー読み込み
   */
  load_member: function(){
    return this.post_proxy({
      path: "/chat",
      method: "post",
      data: {
        target: "member",
        command: "load"
      }
    });
  },

  /*
   * 発言
   * obj.color: 発言色
   * obj.message: 発言
   */
  create_message: function(obj){
    return this.post_proxy({
      path: "/chat",
      method: "post",
      data: { target: "message", command: "post", color: obj.color, content: obj.message }
    });
  },

  /*
   * 状態変更
   * obj.stauts: 状態
   */
  change_status: function(obj){
    return this.post_proxy({
      path: "/chat",
      method: "post",
      data: { target: "member", command: "post", content: obj.status }
    });
  },

  /*
   * ジャッジ
   * obj.message: 発言
   */
  create_judge: function(obj){
    return this.post_proxy({
      path: "/chat",
      method: "post",
      data: { target: "message", command: "judge", content: obj.message }
    });
  },

  /*
   * 自動
   */
  create_auto: function(){
    return this.post_proxy({
      path: "/chat",
      method: "post",
      data: { target: "message", command: "auto" }
    });
  },

  /*
   * ページのタイトル取得
   * obj.url: URL
   */
  get_page_title: function(obj){
    return $.get({
      url: "/page_title",
      data: { url: obj.url },
      dataType: "json"
    });
  },

  /*
   * プロキシへのアクセス
   * obj.path: アクセス先のパス
   * obj.method: HTTPメソッド
   * obj.data: POSTパラメータ
   */
  post_proxy: function(obj){
    var date = new Date().toLocaleString();
    var api_status = $("#api_status");
    return $.post({
      url: "/proxy",
      data: {
        path: obj.path,
        method: obj.method,
        data: obj.data
      },
      dataType: "json",
    })
      .then(function(data){
        var icon = $("<span></span>", { addClass: "glyphicon glyphicon-check text-success" });
        var message = " [OK] " + obj.path + " (" + date + ")";
        api_status.empty();
        api_status.append(icon);
        api_status.append(message);
        api_status.effect("highlight", {}, 1500);
        if(!data.login){
          Chat.view_model.login(false);
          return Promise.reject(data);
        }
        if(!data.success){
          return Promise.reject(data);
        }
        if(!data.inroom){
          Client.enter_room();
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
}
