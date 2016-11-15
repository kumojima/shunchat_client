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
