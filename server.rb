require "sinatra"
require "httpclient"

def http_client(cookies: [])
  client = HTTPClient.new
  cookies.each do |cookie|
    c = WebAgent::Cookie.new
    c.name = cookie[:name]
    c.value = cookie[:value]
    c.url = URI.parse(cookie[:url])
    client.cookie_manager.add c
  end
  client
end

get "/" do
  send_file File.join(settings.public_folder, "index.html")
end

post "/proxy" do
  client = http_client(
    cookies: [
      {
        name: "session",
        value: request.cookies["session"],
        url: "http://chat.shun256.com/"
      },
    ]
    )
  url = File.join("http://chat.shun256.com/", params["path"])
  if params["method"] == "get"
    res = client.get(url)
  elsif params["method"] == "post"
    res = client.post(url, body: params[:data])
  end
  if res.headers["Set-Cookie"]
    headers "Set-Cookie" => res.headers["Set-Cookie"].gsub(/domain=\W*/, "")
  end
  res.body
end

get "/page_title" do
  url = params["url"]
  if url.nil? || url.empty?
    return({ result: "" }.to_json)
  end
  client = http_client
  res = client.get(url)
  reg = /<title.*?>(.*?)<\/title>/.match(
    res.body.encode("UTF-8", "UTF-8", replace: "?")
  )
  title = reg&.captures&.first || url
  { result: title }.to_json
end
