#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <pwd.h>
#include <security/pam_appl.h>
#include <json-c/json.h>

#define PORT 3001
#define BUFFER_SIZE 1024

// PAM conversation (no pam_misc needed!)
static int pam_conv(int num_msg, const struct pam_message **msg,
                    struct pam_response **resp, void *appdata_ptr) {
    struct pam_response *reply = calloc(num_msg, sizeof(struct pam_response));
    if (!reply) return PAM_CONV_ERR;

    for (int i = 0; i < num_msg; ++i) {
        if (msg[i]->msg_style == PAM_PROMPT_ECHO_OFF ||
            msg[i]->msg_style == PAM_PROMPT_ECHO_ON) {
            reply[i].resp = strdup((char *)appdata_ptr);
        } else {
            reply[i].resp = NULL;
        }
        reply[i].resp_retcode = 0;
    }

    *resp = reply;
    return PAM_SUCCESS;
}

int authenticate_user(const char *username, const char *password) {
    pam_handle_t *pamh = NULL;
    int retval;

    struct pam_conv conv = { pam_conv, (void *)password };

    retval = pam_start("login", username, &conv, &pamh);
    if (retval != PAM_SUCCESS) return 0;

    retval = pam_authenticate(pamh, 0);
    if (retval != PAM_SUCCESS) {
        pam_end(pamh, retval);
        return 0;
    }

    retval = pam_acct_mgmt(pamh, 0);
    pam_end(pamh, retval);
    return retval == PAM_SUCCESS;
}

json_object *get_user_info(const char *username) {
    struct passwd *pwd = getpwnam(username);
    if (!pwd) return NULL;

    json_object *user_obj = json_object_new_object();
    json_object_object_add(user_obj, "username", json_object_new_string(pwd->pw_name));
    json_object_object_add(user_obj, "uid", json_object_new_int(pwd->pw_uid));
    json_object_object_add(user_obj, "gid", json_object_new_int(pwd->pw_gid));
    json_object_object_add(user_obj, "home", json_object_new_string(pwd->pw_dir));
    json_object_object_add(user_obj, "shell", json_object_new_string(pwd->pw_shell));
    json_object_object_add(user_obj, "fullname", json_object_new_string(pwd->pw_gecos));

    return user_obj;
}

int parse_login_request(const char *json_str, char *username, char *password) {
    json_object *root = json_tokener_parse(json_str);
    if (!root) return 0;

    json_object *username_obj, *password_obj;

    if (!json_object_object_get_ex(root, "username", &username_obj) ||
        !json_object_object_get_ex(root, "password", &password_obj)) {
        json_object_put(root);
        return 0;
    }

    strncpy(username, json_object_get_string(username_obj), 255);
    strncpy(password, json_object_get_string(password_obj), 255);

    json_object_put(root);
    return 1;
}

char *create_response(int success, const char *message, json_object *user_data) {
    json_object *response = json_object_new_object();
    json_object_object_add(response, "success", json_object_new_boolean(success));
    json_object_object_add(response, "message", json_object_new_string(message));
    if (user_data)
        json_object_object_add(response, "user", user_data);

    const char *json_str = json_object_to_json_string(response);
    char *copy = strdup(json_str);
    json_object_put(response);
    return copy;
}

void handle_request(int client_socket) {
    char buffer[BUFFER_SIZE];
    char username[256], password[256];
    char *json_start;

    int bytes_read = read(client_socket, buffer, BUFFER_SIZE - 1);
    if (bytes_read <= 0) {
        close(client_socket);
        return;
    }
    buffer[bytes_read] = '\0';

    json_start = strstr(buffer, "\r\n\r\n");
    if (!json_start) {
        const char *res = "HTTP/1.1 400 Bad Request\r\n"
                          "Content-Type: application/json\r\n"
                          "Access-Control-Allow-Origin: *\r\n\r\n"
                          "{\"success\": false, \"message\": \"Invalid request\"}";
        write(client_socket, res, strlen(res));
        close(client_socket);
        return;
    }
    json_start += 4;

    if (strncmp(buffer, "OPTIONS", 7) == 0) {
        const char *res = "HTTP/1.1 200 OK\r\n"
                          "Access-Control-Allow-Origin: *\r\n"
                          "Access-Control-Allow-Methods: POST, OPTIONS\r\n"
                          "Access-Control-Allow-Headers: Content-Type\r\n\r\n";
        write(client_socket, res, strlen(res));
        close(client_socket);
        return;
    }

    if (!parse_login_request(json_start, username, password)) {
        const char *res = "HTTP/1.1 400 Bad Request\r\n"
                          "Content-Type: application/json\r\n"
                          "Access-Control-Allow-Origin: *\r\n\r\n"
                          "{\"success\": false, \"message\": \"Invalid JSON\"}";
        write(client_socket, res, strlen(res));
        close(client_socket);
        return;
    }

    int auth = authenticate_user(username, password);
    char *json_res;

    if (auth) {
        json_object *info = get_user_info(username);
        json_res = create_response(1, "Authentication successful", info);
    } else {
        json_res = create_response(0, "Invalid credentials", NULL);
    }

    char http_res[2048];
    snprintf(http_res, sizeof(http_res),
             "HTTP/1.1 %s\r\n"
             "Content-Type: application/json\r\n"
             "Access-Control-Allow-Origin: *\r\n"
             "Access-Control-Allow-Methods: POST, OPTIONS\r\n"
             "Access-Control-Allow-Headers: Content-Type\r\n"
             "Content-Length: %zu\r\n\r\n%s",
             auth ? "200 OK" : "401 Unauthorized",
             strlen(json_res),
             json_res);

    write(client_socket, http_res, strlen(http_res));
    free(json_res);
    close(client_socket);
}

int main() {
    int server_socket, client_socket;
    struct sockaddr_in server_addr;
    socklen_t addr_len = sizeof(server_addr);

    server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket < 0) {
        perror("Socket");
        exit(1);
    }

    int opt = 1;
    setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(PORT);
    server_addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(server_socket, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0) {
        perror("Bind");
        exit(1);
    }

    if (listen(server_socket, 5) < 0) {
        perror("Listen");
        exit(1);
    }

    printf("🔥 vldwcweb is running on port %d (FreeBSD Edition)\n", PORT);

    while (1) {
        client_socket = accept(server_socket, (struct sockaddr *)&server_addr, &addr_len);
        if (client_socket >= 0) {
            handle_request(client_socket);
        }
    }

    close(server_socket);
    return 0;
}
