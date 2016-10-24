var Client = Client || {
  color: "808000",

  /*
   * ログイン
   * obj.id: メールアドレス
   * obj.password: パスワード
   */
  login: function(obj){
    return $.post({
      url: "/proxy",
      data: {
        path: "/login",
        method: "post",
        data: { name: obj.id, pass: obj.password }
      },
      dataType: "json"
    });
  },

  /*
   * ログアウト
   */
  logout: function(){
    return this.post_proxy({
      path: "/logout",
      method: "post",
      data: {}
    });
  },

  /*
   * 初回読み込み
   */
  load_init: function(obj){
    return this.post_proxy({
      path: "/load",
      method: "post",
      data: { type: "last" }
    });
  },

  /*
   * 最新発言読み込み
   * obj.latest_id: 最新ID
   */
  load_latest: function(obj){
    return this.post_proxy({
      path: "/load",
      method: "post",
      data: { type: "latest", id: obj.latest_id }
    });
  },

  /*
   * 発言
   * obj.color: 発言色
   * obj.message: 発言
   */
  create_message: function(obj){
    return this.post_proxy({
      path: "/post",
      method: "post",
      data: { color: obj.color, message: obj.message }
    });
  },

  /*
   * 状態変更
   * obj.stauts: 状態
   */
  change_status: function(obj){
    return this.post_proxy({
      path: "/post",
      method: "post",
      data: { type: "status", message: obj.status }
    });
  },

  /*
   * ジャッジ
   * obj.message: 発言
   */
  create_judge: function(obj){
    return this.post_proxy({
      path: "/post",
      method: "post",
      data: { type: "judge", message: obj.message }
    });
  },

  /*
   * 自動
   */
  create_auto: function(){
    return this.post_proxy({
      path: "/post",
      method: "post",
      data: { type: "auto" }
    });
  },

  /*
   * ページのタイトル取得
   * obj.url: URL
   */
  get_page_title: function(obj){
    return $.get({
      url: "/page_title",
      data: { url: obj.url }
    });
  },

  /*
   * プロキシへのアクセス
   * obj.path: アクセス先のパス
   * obj.method: HTTPメソッド
   * obj.data: POSTパラメータ
   */
  post_proxy: function(obj){
    return $.post({
      url: "/proxy",
      data: {
        path: obj.path,
        method: obj.method,
        data: obj.data
      },
      dataType: "json",
    })
      .done(function(data){
        if(!data.login){
          Chat.login_to_logout();
          return Promise.reject(data);
        }
        return Promise.resolve(data);
      });
  }
}
