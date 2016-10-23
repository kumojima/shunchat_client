var Client = Client || {
  color: "808000",

  /*
   * ログイン
   * obj.id: メールアドレス
   * obj.password: パスワード
   * obj.success: 成功時のコールバック
   */
  login: function(obj){
    $.post({
      url: "/proxy",
      data: {
        path: "/login",
        method: "post",
        data: { name: obj.id, pass: obj.password }
      },
      dataType: "json",
      success: obj.success
    });
  },

  /*
   * ログアウト
   * obj.success: 成功時のコールバック
   */
  logout: function(obj){
    this.post_proxy({
      path: "/logout",
      method: "post",
      data: {},
      success: obj.success
    });
  },

  /*
   * 初回読み込み
   * obj.success: 成功時のコールバック
   */
  load_init: function(obj){
    this.post_proxy({
      path: "/load",
      method: "post",
      data: { type: "last" },
      success: obj.success
    });
  },

  /*
   * 最新発言読み込み
   * obj.latest_id: 最新ID
   * obj.success: 成功時のコールバック
   */
  load_latest: function(obj){
    this.post_proxy({
      path: "/load",
      method: "post",
      data: { type: "latest", id: obj.latest_id },
      success: obj.success
    });
  },

  /*
   * 発言
   * obj.color: 発言色
   * obj.message: 発言
   * obj.success: 成功時のコールバック
   */
  create_message: function(obj){
    this.post_proxy({
      path: "/post",
      method: "post",
      data: { color: obj.color, message: obj.message },
      success: obj.success
    });
  },

  /*
   * 状態変更
   * obj.stauts: 状態
   * obj.success: 成功時のコールバック
   */
  change_status: function(obj){
    this.post_proxy({
      path: "/post",
      method: "post",
      data: { type: "status", message: obj.status },
      success: obj.success
    });
  },

  /*
   * ジャッジ
   * obj.message: 発言
   * obj.success: 成功時のコールバック
   */
  create_judge: function(obj){
    this.post_proxy({
      path: "/post",
      method: "post",
      data: { type: "judge", message: obj.message },
      success: obj.success
    });
  },

  /*
   * 自動
   * obj.success: 成功時のコールバック
   */
  create_auto: function(obj){
    this.post_proxy({
      path: "/post",
      method: "post",
      data: { type: "auto" },
      success: obj.success
    });
  },

  /*
   * ページのタイトル取得
   * obj.url: URL
   * obj.success: 成功時のコールバック
   */
  get_page_title: function(obj){
    $.get({
      url: "/page_title",
      data: { url: obj.url },
      success: obj.success,
      dataType: "json"
    });
  },

  /*
   * プロキシへのアクセス
   * obj.path: アクセス先のパス
   * obj.method: HTTPメソッド
   * obj.data: POSTパラメータ
   * obj.success: 成功時のコールバック
   */
  post_proxy: function(obj){
    $.post({
      url: "/proxy",
      data: {
        path: obj.path,
        method: obj.method,
        data: obj.data
      },
      dataType: "json",
      success: function(data){
        if(data.login){
          obj.success(data);
        }else{
          Chat.login_to_logout();
        }
      }
    });
  }
}
