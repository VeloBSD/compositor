#include "logind.h"
#include "desktopsession.h"
#include "idle.h"
#include <signal.h>
#include <sys/wait.h>
#include <sys/select.h>
#include <openssl/sha.h>
#include <openssl/evp.h>
#include <openssl/bio.h>
#include <openssl/buffer.h>

// WebSocket constants
#define WS_MAGIC_STRING "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
#define MAX_CLIENTS 100
#define WS_FRAME_SIZE 1024

// WebSocket opcodes
#define WS_OPCODE_CONTINUATION 0x0
#define WS_OPCODE_TEXT 0x1
#define WS_OPCODE_BINARY 0x2
#define WS_OPCODE_CLOSE 0x8
#define WS_OPCODE_PING 0x9
#define WS_OPCODE_PONG 0xA

// Global server socket and client management
static int g_server_socket = -1;
static int g_client_sockets[MAX_CLIENTS];
static int g_client_count = 0;

// WebSocket client structure
typedef struct {
    int socket;
    int handshake_complete;
} ws_client_t;

static ws_client_t g_ws_clients[MAX_CLIENTS];

// Base64 encoding function
char* base64_encode(const unsigned char* input, int length) {
    BIO *bio, *b64;
    BUF_MEM *bufferPtr;
    
    b64 = BIO_new(BIO_f_base64());
    bio = BIO_new(BIO_s_mem());
    bio = BIO_push(b64, bio);
    
    BIO_set_flags(bio, BIO_FLAGS_BASE64_NO_NL);
    BIO_write(bio, input, length);
    BIO_flush(bio);
    BIO_get_mem_ptr(bio, &bufferPtr);
    
    char* result = malloc(bufferPtr->length + 1);
    memcpy(result, bufferPtr->data, bufferPtr->length);
    result[bufferPtr->length] = '\0';
    
    BIO_free_all(bio);
    return result;
}

// WebSocket handshake
int perform_websocket_handshake(int client_socket, const char* request) {
    char* key_start = strstr(request, "Sec-WebSocket-Key: ");
    if (!key_start) return 0;
    
    key_start += 19; // Length of "Sec-WebSocket-Key: "
    char* key_end = strstr(key_start, "\r\n");
    if (!key_end) return 0;
    
    char key[256];
    int key_len = key_end - key_start;
    strncpy(key, key_start, key_len);
    key[key_len] = '\0';
    
    // Concatenate key with magic string
    char concat[512];
    snprintf(concat, sizeof(concat), "%s%s", key, WS_MAGIC_STRING);
    
    // Calculate SHA1 hash
    unsigned char hash[SHA_DIGEST_LENGTH];
    SHA1((unsigned char*)concat, strlen(concat), hash);
    
    // Base64 encode the hash
    char* accept_key = base64_encode(hash, SHA_DIGEST_LENGTH);
    
    // Send handshake response
    char response[1024];
    snprintf(response, sizeof(response),
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        "Sec-WebSocket-Accept: %s\r\n"
        "\r\n", accept_key);
    
    int result = send(client_socket, response, strlen(response), 0);
    free(accept_key);
    
    return result > 0;
}

// Parse WebSocket frame
int parse_websocket_frame(const char* buffer, int buffer_len, char* payload, int* payload_len) {
    if (buffer_len < 2) return 0;
    
    unsigned char first_byte = buffer[0];
    unsigned char second_byte = buffer[1];
    
    int fin = (first_byte >> 7) & 1;
    int opcode = first_byte & 0x0F;
    int masked = (second_byte >> 7) & 1;
    int payload_length = second_byte & 0x7F;
    
    int header_len = 2;
    
    // Extended payload length
    if (payload_length == 126) {
        if (buffer_len < 4) return 0;
        payload_length = (buffer[2] << 8) | buffer[3];
        header_len = 4;
    } else if (payload_length == 127) {
        if (buffer_len < 10) return 0;
        // For simplicity, we'll limit to 32-bit payload lengths
        payload_length = (buffer[6] << 24) | (buffer[7] << 16) | (buffer[8] << 8) | buffer[9];
        header_len = 10;
    }
    
    // Masking key
    unsigned char mask[4];
    if (masked) {
        if (buffer_len < header_len + 4) return 0;
        memcpy(mask, buffer + header_len, 4);
        header_len += 4;
    }
    
    if (buffer_len < header_len + payload_length) return 0;
    
    // Extract and unmask payload
    for (int i = 0; i < payload_length; i++) {
        payload[i] = buffer[header_len + i];
        if (masked) {
            payload[i] ^= mask[i % 4];
        }
    }
    payload[payload_length] = '\0';
    *payload_len = payload_length;
    
    return opcode;
}

// Create WebSocket frame
int create_websocket_frame(const char* payload, int payload_len, char* frame, int frame_size) {
    if (frame_size < payload_len + 10) return 0;
    
    int frame_len = 0;
    
    // First byte: FIN=1, opcode=text
    frame[frame_len++] = 0x80 | WS_OPCODE_TEXT;
    
    // Payload length
    if (payload_len < 126) {
        frame[frame_len++] = payload_len;
    } else if (payload_len < 65536) {
        frame[frame_len++] = 126;
        frame[frame_len++] = (payload_len >> 8) & 0xFF;
        frame[frame_len++] = payload_len & 0xFF;
    } else {
        frame[frame_len++] = 127;
        // Zero out the first 4 bytes (we're using 32-bit lengths)
        for (int i = 0; i < 4; i++) frame[frame_len++] = 0;
        frame[frame_len++] = (payload_len >> 24) & 0xFF;
        frame[frame_len++] = (payload_len >> 16) & 0xFF;
        frame[frame_len++] = (payload_len >> 8) & 0xFF;
        frame[frame_len++] = payload_len & 0xFF;
    }
    
    // Copy payload
    memcpy(frame + frame_len, payload, payload_len);
    frame_len += payload_len;
    
    return frame_len;
}

// Broadcast message to all connected WebSocket clients
void broadcast_message(const char* message) {
    char frame[WS_FRAME_SIZE];
    int frame_len = create_websocket_frame(message, strlen(message), frame, sizeof(frame));
    
    for (int i = 0; i < g_client_count; i++) {
        if (g_ws_clients[i].handshake_complete) {
            send(g_ws_clients[i].socket, frame, frame_len, 0);
        }
    }
}

// Handle WebSocket client
void handle_websocket_client(int client_index) {
    char buffer[BUFFER_SIZE];
    int bytes_read = recv(g_ws_clients[client_index].socket, buffer, sizeof(buffer) - 1, 0);
    
    if (bytes_read <= 0) {
        // Client disconnected
        close(g_ws_clients[client_index].socket);
        // Remove client from array
        for (int i = client_index; i < g_client_count - 1; i++) {
            g_ws_clients[i] = g_ws_clients[i + 1];
        }
        g_client_count--;
        printf("🔌 WebSocket client disconnected. Active clients: %d\n", g_client_count);
        return;
    }
    
    buffer[bytes_read] = '\0';
    
    if (!g_ws_clients[client_index].handshake_complete) {
        // Perform WebSocket handshake
        if (perform_websocket_handshake(g_ws_clients[client_index].socket, buffer)) {
            g_ws_clients[client_index].handshake_complete = 1;
            printf("🤝 WebSocket handshake completed for client %d\n", client_index);
            
            // Send welcome message
            char* welcome = "{\"type\": \"welcome\", \"message\": \"Connected to VLDWM API\"}";
            char frame[WS_FRAME_SIZE];
            int frame_len = create_websocket_frame(welcome, strlen(welcome), frame, sizeof(frame));
            send(g_ws_clients[client_index].socket, frame, frame_len, 0);
        } else {
            printf("❌ WebSocket handshake failed for client %d\n", client_index);
            close(g_ws_clients[client_index].socket);
            // Remove client from array
            for (int i = client_index; i < g_client_count - 1; i++) {
                g_ws_clients[i] = g_ws_clients[i + 1];
            }
            g_client_count--;
        }
    } else {
        // Handle WebSocket frame
        char payload[BUFFER_SIZE];
        int payload_len;
        int opcode = parse_websocket_frame(buffer, bytes_read, payload, &payload_len);
        
        switch (opcode) {
            case WS_OPCODE_TEXT: {
                printf("📨 Received WebSocket message: %s\n", payload);
                
                // Parse JSON and handle different message types
                json_object *root = json_tokener_parse(payload);
                if (root) {
                    json_object *type_obj;
                    if (json_object_object_get_ex(root, "type", &type_obj)) {
                        const char* msg_type = json_object_get_string(type_obj);
                        
                        if (strcmp(msg_type, "login") == 0) {
                            // Handle login request
                            char username[MAX_USERNAME_LEN], password[MAX_PASSWORD_LEN];
                            if (parse_login_request(payload, username, password)) {
                                int auth = authenticate_user(username, password);
                                char *json_res;
                                
                                if (auth) {
                                    json_object *info = get_user_info(username);
                                    json_res = create_response(1, "Authentication successful", info);
                                } else {
                                    json_res = create_response(0, "Invalid credentials", NULL);
                                }
                                
                                // Send response back to this client
                                char frame[WS_FRAME_SIZE];
                                int frame_len = create_websocket_frame(json_res, strlen(json_res), frame, sizeof(frame));
                                send(g_ws_clients[client_index].socket, frame, frame_len, 0);
                                free(json_res);
                            }
                        } else if (strcmp(msg_type, "desktop_session") == 0) {
                            // Handle desktop session requests
                            // This would integrate with desktopsession.c functions
                            char* response = "{\"type\": \"desktop_session\", \"status\": \"handled\"}";
                            char frame[WS_FRAME_SIZE];
                            int frame_len = create_websocket_frame(response, strlen(response), frame, sizeof(frame));
                            send(g_ws_clients[client_index].socket, frame, frame_len, 0);
                        }
                    }
                    json_object_put(root);
                }
                break;
            }
            case WS_OPCODE_PING: {
                // Respond with pong
                char pong_frame[10];
                pong_frame[0] = 0x80 | WS_OPCODE_PONG;
                pong_frame[1] = 0; // No payload
                send(g_ws_clients[client_index].socket, pong_frame, 2, 0);
                break;
            }
            case WS_OPCODE_CLOSE: {
                printf("🔒 WebSocket close frame received from client %d\n", client_index);
                close(g_ws_clients[client_index].socket);
                // Remove client from array
                for (int i = client_index; i < g_client_count - 1; i++) {
                    g_ws_clients[i] = g_ws_clients[i + 1];
                }
                g_client_count--;
                break;
            }
        }
    }
}

// Signal handler for graceful shutdown
void signal_handler(int sig) {
    printf("\n🛑 Received signal %d, shutting down vldwmapi...\n", sig);
    
    // Close all client connections
    for (int i = 0; i < g_client_count; i++) {
        close(g_ws_clients[i].socket);
    }
    
    if (g_server_socket >= 0) {
        close(g_server_socket);
    }
    exit(0);
}

// Initialize all subsystems
int init_vldwmapi() {
    printf("🚀 Initializing VLDWM API subsystems...\n");
    
    // Initialize WebSocket client array
    memset(g_ws_clients, 0, sizeof(g_ws_clients));
    g_client_count = 0;
    
    // Initialize desktop session management
    if (init_desktop_session() != 0) {
        fprintf(stderr, "❌ Failed to initialize desktop session\n");
        return -1;
    }
    
    // Initialize idle detection
    if (init_idle_detection() != 0) {
        fprintf(stderr, "❌ Failed to initialize idle detection\n");
        return -1;
    }
    
    // Initialize login daemon
    if (init_logind() != 0) {
        fprintf(stderr, "❌ Failed to initialize login daemon\n");
        return -1;
    }
    
    printf("✅ All subsystems initialized successfully\n");
    return 0;
}

// Cleanup all subsystems
void cleanup_vldwmapi() {
    printf("🧹 Cleaning up VLDWM API subsystems...\n");
    
    // Close all client connections
    for (int i = 0; i < g_client_count; i++) {
        close(g_ws_clients[i].socket);
    }
    
    cleanup_logind();
    cleanup_idle_detection();
    cleanup_desktop_session();
}

// Start WebSocket server
int start_websocket_server(int port) {
    struct sockaddr_in server_addr, client_addr;
    socklen_t client_len = sizeof(client_addr);
    fd_set read_fds;
    int max_fd;
    
    // Create server socket
    g_server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (g_server_socket < 0) {
        perror("Socket creation failed");
        return -1;
    }
    
    // Set socket options
    int opt = 1;
    setsockopt(g_server_socket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    
    // Bind socket
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(port);
    server_addr.sin_addr.s_addr = INADDR_ANY;
    
    if (bind(g_server_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        perror("Bind failed");
        close(g_server_socket);
        return -1;
    }
    
    // Listen for connections
    if (listen(g_server_socket, 10) < 0) {
        perror("Listen failed");
        close(g_server_socket);
        return -1;
    }
    
    printf("🌐 WebSocket server listening on port %d\n", port);
    
    // Main server loop
    while (1) {
        FD_ZERO(&read_fds);
        FD_SET(g_server_socket, &read_fds);
        max_fd = g_server_socket;
        
        // Add client sockets to fd_set
        for (int i = 0; i < g_client_count; i++) {
            FD_SET(g_ws_clients[i].socket, &read_fds);
            if (g_ws_clients[i].socket > max_fd) {
                max_fd = g_ws_clients[i].socket;
            }
        }
        
        // Wait for activity
        int activity = select(max_fd + 1, &read_fds, NULL, NULL, NULL);
        if (activity < 0) {
            perror("Select error");
            break;
        }
        
        // Check for new connections
        if (FD_ISSET(g_server_socket, &read_fds)) {
            int new_socket = accept(g_server_socket, (struct sockaddr*)&client_addr, &client_len);
            if (new_socket >= 0 && g_client_count < MAX_CLIENTS) {
                g_ws_clients[g_client_count].socket = new_socket;
                g_ws_clients[g_client_count].handshake_complete = 0;
                g_client_count++;
                printf("🔗 New WebSocket connection. Active clients: %d\n", g_client_count);
            } else if (g_client_count >= MAX_CLIENTS) {
                printf("⚠️ Maximum clients reached, rejecting connection\n");
                close(new_socket);
            }
        }
        
        // Check existing clients for data
        for (int i = 0; i < g_client_count; i++) {
            if (FD_ISSET(g_ws_clients[i].socket, &read_fds)) {
                handle_websocket_client(i);
            }
        }
    }
    
    return 0;
}

int main(int argc, char *argv[]) {
    int port = DEFAULT_PORT;
    
    // Parse command line arguments
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "-p") == 0 || strcmp(argv[i], "--port") == 0) {
            if (i + 1 < argc) {
                port = atoi(argv[i + 1]);
                i++; // Skip next argument
            } else {
                fprintf(stderr, "Error: Port number required after %s\n", argv[i]);
                return 1;
            }
        } else if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "--help") == 0) {
            printf("VLDWM API WebSocket Server\n");
            printf("Usage: %s [options]\n", argv[0]);
            printf("Options:\n");
            printf("  -p, --port <port>    Set server port (default: %d)\n", DEFAULT_PORT);
            printf("  -h, --help           Show this help message\n");
            return 0;
        }
    }
    
    // Set up signal handlers
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    
    // Initialize all subsystems
    if (init_vldwmapi() != 0) {
        fprintf(stderr, "❌ Failed to initialize VLDWM API\n");
        return 1;
    }
    
    // Start the WebSocket server
    printf("🔥 Starting VLDWM API WebSocket server on port %d (FreeBSD Edition)\n", port);
    int result = start_websocket_server(port);
    
    // Cleanup on exit
    cleanup_vldwmapi();
    
    return result;
}