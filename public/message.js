var Message = function(data, client){
  var self = this;
  var regexp = /https?:\/\/[^\s]*/g;
  var urls = data.message_content.match(regexp);
  var texts = data.message_content.split(regexp) || [];

  self.name = data.name;
  self.message_pieces = ko.observableArray([]);
  self.posted_at = "(" + data.posted_at + ")";
  self.message_color = data.message_color;

  texts.forEach(function(text, i){
    var url = "";
    if(urls && urls[i]){
      url = urls[i];
    }
    self.message_pieces.push(new MessagePiece({ message: text, url: url }, client));
  });

  self.quote = function(){
    var input = $("#message");
    var result = input.val() + self.posted_at + self.name + "-->";
    self.message_pieces().forEach(function(i){
      result += i.message;
      result += i.title();
    });
    input.val(result);
    input.focus();
  };
}
