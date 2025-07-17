#ifndef LOGIND_H
#define LOGIND_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <pwd.h>
#include <security/pam_appl.h>
#include <json-c/json.h>

// Constants
#define DEFAULT_PORT 3001
#define BUFFER_SIZE 1024
#define MAX_USERNAME_LEN 256
#define MAX_PASSWORD_LEN 256

// Function declarations
int init_logind(void);
void cleanup_logind(void);
int start_logind_server(int port, int *server_socket_ptr);
int authenticate_user(const char *username, const char *password);
json_object *get_user_info(const char *username);
int parse_login_request(const char *json_str, char *username, char *password);
char *create_response(int success, const char *message, json_object *user_data);
void handle_request(int client_socket);

#endif // LOGIND_H