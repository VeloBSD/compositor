#ifndef DESKTOPSESSION_H
#define DESKTOPSESSION_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <dirent.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <sys/sysinfo.h>
#include <pwd.h>
#include <grp.h>
#include <time.h>
#include <json-c/json.h>

// Constants
#define MAX_PATH_LEN 4096
#define MAX_SESSIONS 64
#define MAX_PROCESSES 1024
#define SESSION_ACTIVE 1
#define SESSION_INACTIVE 0
#define SESSION_LOCKED 2

// Structures
typedef struct {
    char username[256];
    pid_t session_pid;
    int state;
    time_t start_time;
    char display[32];
    char tty[32];
} desktop_session_t;

typedef struct {
    char name[256];
    char path[MAX_PATH_LEN];
    int is_directory;
    off_t size;
    time_t modified_time;
    mode_t permissions;
    uid_t owner_uid;
    gid_t owner_gid;
} file_entry_t;

typedef struct {
    unsigned long total_memory;
    unsigned long free_memory;
    unsigned long used_memory;
    unsigned long cached_memory;
    double cpu_usage;
    unsigned long uptime;
    double load_average[3];
    int process_count;
} system_status_t;

// Desktop session management functions
int init_desktop_session(void);
void cleanup_desktop_session(void);
int start_desktop_session(const char *username);
int stop_desktop_session(const char *username);
int get_active_sessions(desktop_session_t *sessions, int max_sessions);
int lock_session(const char *username);
int unlock_session(const char *username);
int get_session_info(const char *username, desktop_session_t *session);

// Directory and file system operations
json_object *list_directory(const char *path);
json_object *get_file_info(const char *path);
int create_directory(const char *path, mode_t mode);
int delete_file(const char *path);
int copy_file(const char *src, const char *dest);
int move_file(const char *src, const char *dest);
int change_permissions(const char *path, mode_t mode);
int change_owner(const char *path, uid_t uid, gid_t gid);

// System status and monitoring
json_object *get_system_status(void);
json_object *get_process_list(void);
json_object *get_disk_usage(const char *path);
json_object *get_network_interfaces(void);
int kill_process(pid_t pid, int signal);

// Utility functions
char *get_home_directory(const char *username);
int is_valid_path(const char *path);
char *format_file_size(off_t size);
char *format_permissions(mode_t mode);
char *format_time(time_t time);

#endif // DESKTOPSESSION_H