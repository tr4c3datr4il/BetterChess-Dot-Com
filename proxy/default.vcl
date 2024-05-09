vcl 4.1;

backend websocket_server {
    .host = "websocket";
    .port = "1337";
}

backend default_server {
    .host = "better_chess";
    .port = "8000";
}

sub vcl_recv {
    if (req.url ~ "/socket.io") {
        set req.backend_hint = websocket_server;
        if (req.http.upgrade ~ "(?i)websocket") {
            return (pipe);
        }
    } else {
        set req.backend_hint = default_server;
    }
}

sub vcl_pipe {
    if (req.http.upgrade) {
        set bereq.http.upgrade = req.http.upgrade;
        set bereq.http.connection = req.http.connection;
    }
}
