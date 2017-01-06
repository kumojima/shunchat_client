require "sinatra"
require "httpclient"

get "/" do
  send_file File.join(settings.public_folder, "index.html")
end

get "/page_title" do
  url = params["url"]
  if url.nil? || url.empty?
    return({ result: "" }.to_json)
  end
  client = HTTPClient.new
  res = client.get(url)
  reg = /<title.*?>(.*?)<\/title>/.match(
    res.body.encode("UTF-8", "UTF-8", replace: "?")
  )
  title = reg&.captures&.first || url
  { result: title }.to_json
end
