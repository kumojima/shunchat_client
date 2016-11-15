var MessagePiece = function(piece){
  var self = this;
  self.message = piece.message;
  self.url = self.is_url(piece.url);
  self.title = ko.observable(piece.url);
  if(self.url){
    self.a_attrs = { href: piece.url };
    self.img_attrs = { src: "http://favicon.hatena.ne.jp/?url=" + piece.url };
    Chat.client.get_page_title({
      url: piece.url
    })
      .done(function(data){
        self.title(data.result);
      });
  }else{
    self.a_attrs = {};
    self.img_attrs = {};
  }
};

MessagePiece.prototype.is_url = function(message){
  return message.substr(0, 4) == "http";
};
