import spotipy
import json
from spotipy.oauth2 import SpotifyOAuth
from http.server import HTTPServer, BaseHTTPRequestHandler

api_id = ""
api_secret = ""
port = 42280
maxPlays = 2
blocked_artists = ["66CXWjxzNUsdJxJ2JdwvnR",  # Ariana Grande
                   "6jJ0s89eD6GaHleKKya26X"   # Katy Perry
                   ]

blocked_genres = ['metal']
already_played = []


def convertMillis(millis):
    seconds = (millis / 1000) % 60
    minutes = (millis / (1000 * 60)) % 60
    return '{:02.0f}:{:02.0f}'.format(minutes, seconds)


def currentlyPlaying():
    item = sp.currently_playing()['item']
    output = {"results": [{"song": item['name'],
                           "artist": item['artists'][0]['name'],
                           "album": item['album']['name'],
                           "duration": convertMillis(item['duration_ms']),
                           "cover": item['album']['images'][0]['url'],
                           "uri": item['uri']}]}
    return json.dumps(output)


def addToQueue(self):
    content_length = int(self.headers['Content-Length'])
    body = self.rfile.read(content_length)
    data = json.loads(body.decode("utf-8"))
    uri = data["uri"]
    artist = sp.track(uri)['artists'][0]['id']
    if (already_played.count(uri) < maxPlays) or (maxPlays == 0):
        if artist not in blocked_artists:
            if not any(genre in sp.artist(artist)['genres'] for genre in blocked_genres):
                sp.add_to_queue(uri)
                already_played.append(uri)
                self.send_response(200)
                self.end_headers()
                self.wfile.write(
                    bytes(json.dumps({"alert": "success", "msg": "Song was added to Queue"}),
                          'utf-8'))
            else:
                print("Genre is blocked")
                self.send_response(200)
                self.end_headers()
                self.wfile.write(
                    bytes(json.dumps({"alert": "error", "msg": "This genre is blocked"}), 'utf-8'))
        else:
            print("Artist is blocked")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(
                bytes(json.dumps({"alert": "error", "msg": "This artist is blocked"}), 'utf-8'))
    else:
        print("Song played to often")
        self.send_response(200)
        self.end_headers()
        self.wfile.write(
            bytes(json.dumps({"alert": "error", "msg": "This song was played to often"}), 'utf-8'))


def search(self):
    content_length = int(self.headers['Content-Length'])
    body = self.rfile.read(content_length)
    data = json.loads(body.decode("utf-8"))
    q = data["q"]
    if q != "":
        print(q)
        result = sp.search(q, limit=48, type="track", market="DE")
        output = {"results": []}
        for item in result['tracks']['items']:
            output["results"].append({"song": item['name'],
                                      "artist": item['artists'][0]['name'],
                                      "album": item['album']['name'],
                                      "duration": convertMillis(item['duration_ms']),
                                      "cover": item['album']['images'][2]['url'],
                                      "uri": item['uri']})
        self.send_response(200)
        self.end_headers()
        self.wfile.write(bytes(json.dumps(output), 'utf-8'))
    else:
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{}')


if __name__ == '__main__':
    # Connect to Spotify
    print("Connecting to Spotify...")
    scope = "user-read-playback-state,user-modify-playback-state,user-read-currently-playing,user-library-read"
    sp = spotipy.Spotify(client_credentials_manager=SpotifyOAuth(client_id=api_id,
                                                                 client_secret=api_secret,
                                                                 redirect_uri="http://127.0.0.1:22022",
                                                                 open_browser=False,
                                                                 scope=scope))
    print("Connected")
    print("Spinging up Web Server...")


    class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/api/np":
                self.send_response(200)
                self.end_headers()
                self.wfile.write(bytes(currentlyPlaying(), 'utf-8'))
            else:
                self.send_response(405)
                self.end_headers()
                self.wfile.write(b'not allowed')

        def do_POST(self):
            if self.path == "/api/search":
                search(self)
            elif self.path == "/api/queue":
                addToQueue(self)
            else:
                self.send_response(405)
                self.end_headers()


    class CORSRequestHandler(SimpleHTTPRequestHandler):
        def end_headers(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            SimpleHTTPRequestHandler.end_headers(self)


    httpd = HTTPServer(('', port), CORSRequestHandler)
    print("Listening on port", port)
    httpd.serve_forever()