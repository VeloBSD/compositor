#include "desktopsession.h"

static desktop_session_t active_sessions[MAX_SESSIONS];
static int session_count = 0;

int init_desktop_session(void) {
    printf("🖥️  Initializing desktop session manager...\n");
    memset(active_sessions, 0, sizeof(active_sessions));
    session_count = 0;
    return 0;
}

void cleanup_desktop_session(void) {
    printf("🖥️  Cleaning up desktop session manager...\n");
    // Cleanup any active sessions if needed
}

int start_desktop_session(const char *username) {
    if (session_count >= MAX_SESSIONS) {
        return -1; // Too many sessions
    }
    
    desktop_session_t *session = &active_sessions[session_count];
    strncpy(session->username, username, sizeof(session->username) - 1);
    session->session_pid = getpid(); // In real implementation, this would be the session process
    session->state = SESSION_ACTIVE;
    session->start_time = time(NULL);
    snprintf(session->display, sizeof(session->display), ":0");
    snprintf(session->tty, sizeof(session->tty), "tty1");
    
    session_count++;
    return 0;
}

int stop_desktop_session(const char *username) {
    for (int i = 0; i < session_count; i++) {
        if (strcmp(active_sessions[i].username, username) == 0) {
            // Move last session to this position
            if (i < session_count - 1) {
                active_sessions[i] = active_sessions[session_count - 1];
            }
            session_count--;
            return 0;
        }
    }
    return -1; // Session not found
}

int get_active_sessions(desktop_session_t *sessions, int max_sessions) {
    int count = (session_count < max_sessions) ? session_count : max_sessions;
    memcpy(sessions, active_sessions, count * sizeof(desktop_session_t));
    return count;
}

int lock_session(const char *username) {
    for (int i = 0; i < session_count; i++) {
        if (strcmp(active_sessions[i].username, username) == 0) {
            active_sessions[i].state = SESSION_LOCKED;
            return 0;
        }
    }
    return -1;
}

int unlock_session(const char *username) {
    for (int i = 0; i < session_count; i++) {
        if (strcmp(active_sessions[i].username, username) == 0) {
            active_sessions[i].state = SESSION_ACTIVE;
            return 0;
        }
    }
    return -1;
}

int get_session_info(const char *username, desktop_session_t *session) {
    for (int i = 0; i < session_count; i++) {
        if (strcmp(active_sessions[i].username, username) == 0) {
            *session = active_sessions[i];
            return 0;
        }
    }
    return -1;
}

json_object *list_directory(const char *path) {
    DIR *dir;
    struct dirent *entry;
    struct stat file_stat;
    char full_path[MAX_PATH_LEN];
    
    if (!is_valid_path(path)) {
        return NULL;
    }
    
    dir = opendir(path);
    if (!dir) {
        return NULL;
    }
    
    json_object *files_array = json_object_new_array();
    
    while ((entry = readdir(dir)) != NULL) {
        // Skip . and .. entries
        if (strcmp(entry->d_name, ".") == 0 || strcmp(entry->d_name, "..") == 0) {
            continue;
        }
        
        snprintf(full_path, sizeof(full_path), "%s/%s", path, entry->d_name);
        
        if (stat(full_path, &file_stat) == 0) {
            json_object *file_obj = json_object_new_object();
            json_object_object_add(file_obj, "name", json_object_new_string(entry->d_name));
            json_object_object_add(file_obj, "path", json_object_new_string(full_path));
            json_object_object_add(file_obj, "is_directory", json_object_new_boolean(S_ISDIR(file_stat.st_mode)));
            json_object_object_add(file_obj, "size", json_object_new_int64(file_stat.st_size));
            json_object_object_add(file_obj, "size_formatted", json_object_new_string(format_file_size(file_stat.st_size)));
            json_object_object_add(file_obj, "modified_time", json_object_new_int64(file_stat.st_mtime));
            json_object_object_add(file_obj, "modified_formatted", json_object_new_string(format_time(file_stat.st_mtime)));
            json_object_object_add(file_obj, "permissions", json_object_new_string(format_permissions(file_stat.st_mode)));
            json_object_object_add(file_obj, "owner_uid", json_object_new_int(file_stat.st_uid));
            json_object_object_add(file_obj, "owner_gid", json_object_new_int(file_stat.st_gid));
            
            json_object_array_add(files_array, file_obj);
        }
    }
    
    closedir(dir);
    return files_array;
}

json_object *get_file_info(const char *path) {
    struct stat file_stat;
    
    if (!is_valid_path(path) || stat(path, &file_stat) != 0) {
        return NULL;
    }
    
    json_object *file_obj = json_object_new_object();
    json_object_object_add(file_obj, "path", json_object_new_string(path));
    json_object_object_add(file_obj, "is_directory", json_object_new_boolean(S_ISDIR(file_stat.st_mode)));
    json_object_object_add(file_obj, "is_regular_file", json_object_new_boolean(S_ISREG(file_stat.st_mode)));
    json_object_object_add(file_obj, "is_symlink", json_object_new_boolean(S_ISLNK(file_stat.st_mode)));
    json_object_object_add(file_obj, "size", json_object_new_int64(file_stat.st_size));
    json_object_object_add(file_obj, "size_formatted", json_object_new_string(format_file_size(file_stat.st_size)));
    json_object_object_add(file_obj, "access_time", json_object_new_int64(file_stat.st_atime));
    json_object_object_add(file_obj, "modified_time", json_object_new_int64(file_stat.st_mtime));
    json_object_object_add(file_obj, "change_time", json_object_new_int64(file_stat.st_ctime));
    json_object_object_add(file_obj, "permissions", json_object_new_string(format_permissions(file_stat.st_mode)));
    json_object_object_add(file_obj, "owner_uid", json_object_new_int(file_stat.st_uid));
    json_object_object_add(file_obj, "owner_gid", json_object_new_int(file_stat.st_gid));
    
    return file_obj;
}

int create_directory(const char *path, mode_t mode) {
    if (!is_valid_path(path)) {
        return -1;
    }
    return mkdir(path, mode);
}

int delete_file(const char *path) {
    if (!is_valid_path(path)) {
        return -1;
    }
    
    struct stat file_stat;
    if (stat(path, &file_stat) != 0) {
        return -1;
    }
    
    if (S_ISDIR(file_stat.st_mode)) {
        return rmdir(path);
    } else {
        return unlink(path);
    }
}

int copy_file(const char *src, const char *dest) {
    if (!is_valid_path(src) || !is_valid_path(dest)) {
        return -1;
    }
    
    FILE *source = fopen(src, "rb");
    if (!source) return -1;
    
    FILE *destination = fopen(dest, "wb");
    if (!destination) {
        fclose(source);
        return -1;
    }
    
    char buffer[8192];
    size_t bytes;
    
    while ((bytes = fread(buffer, 1, sizeof(buffer), source)) > 0) {
        if (fwrite(buffer, 1, bytes, destination) != bytes) {
            fclose(source);
            fclose(destination);
            return -1;
        }
    }
    
    fclose(source);
    fclose(destination);
    return 0;
}

int move_file(const char *src, const char *dest) {
    if (!is_valid_path(src) || !is_valid_path(dest)) {
        return -1;
    }
    return rename(src, dest);
}

int change_permissions(const char *path, mode_t mode) {
    if (!is_valid_path(path)) {
        return -1;
    }
    return chmod(path, mode);
}

int change_owner(const char *path, uid_t uid, gid_t gid) {
    if (!is_valid_path(path)) {
        return -1;
    }
    return chown(path, uid, gid);
}

json_object *get_system_status(void) {
    struct sysinfo info;
    FILE *loadavg_file, *meminfo_file;
    char line[256];
    
    json_object *status_obj = json_object_new_object();
    
    // Get system info
    if (sysinfo(&info) == 0) {
        json_object_object_add(status_obj, "uptime", json_object_new_int64(info.uptime));
        json_object_object_add(status_obj, "total_memory", json_object_new_int64(info.totalram * info.mem_unit));
        json_object_object_add(status_obj, "free_memory", json_object_new_int64(info.freeram * info.mem_unit));
        json_object_object_add(status_obj, "used_memory", json_object_new_int64((info.totalram - info.freeram) * info.mem_unit));
        json_object_object_add(status_obj, "process_count", json_object_new_int(info.procs));
    }
    
    // Get load average
    loadavg_file = fopen("/proc/loadavg", "r");
    if (loadavg_file) {
        float load1, load5, load15;
        if (fscanf(loadavg_file, "%f %f %f", &load1, &load5, &load15) == 3) {
            json_object *load_array = json_object_new_array();
            json_object_array_add(load_array, json_object_new_double(load1));
            json_object_array_add(load_array, json_object_new_double(load5));
            json_object_array_add(load_array, json_object_new_double(load15));
            json_object_object_add(status_obj, "load_average", load_array);
        }
        fclose(loadavg_file);
    }
    
    // Get detailed memory info
    meminfo_file = fopen("/proc/meminfo", "r");
    if (meminfo_file) {
        long cached = 0, buffers = 0;
        while (fgets(line, sizeof(line), meminfo_file)) {
            if (strncmp(line, "Cached:", 7) == 0) {
                sscanf(line, "Cached: %ld kB", &cached);
            } else if (strncmp(line, "Buffers:", 8) == 0) {
                sscanf(line, "Buffers: %ld kB", &buffers);
            }
        }
        json_object_object_add(status_obj, "cached_memory", json_object_new_int64((cached + buffers) * 1024));
        fclose(meminfo_file);
    }
    
    return status_obj;
}

json_object *get_process_list(void) {
    DIR *proc_dir;
    struct dirent *entry;
    char path[256], line[256];
    FILE *stat_file;
    
    json_object *processes_array = json_object_new_array();
    
    proc_dir = opendir("/proc");
    if (!proc_dir) return processes_array;
    
    while ((entry = readdir(proc_dir)) != NULL) {
        // Check if directory name is a number (PID)
        if (strspn(entry->d_name, "0123456789") != strlen(entry->d_name)) {
            continue;
        }
        
        snprintf(path, sizeof(path), "/proc/%s/stat", entry->d_name);
        stat_file = fopen(path, "r");
        if (stat_file) {
            int pid, ppid;
            char comm[256], state;
            unsigned long utime, stime;
            
            if (fscanf(stat_file, "%d %s %c %d %*d %*d %*d %*d %*u %*u %*u %*u %*u %lu %lu",
                      &pid, comm, &state, &ppid, &utime, &stime) >= 4) {
                json_object *process_obj = json_object_new_object();
                json_object_object_add(process_obj, "pid", json_object_new_int(pid));
                json_object_object_add(process_obj, "ppid", json_object_new_int(ppid));
                json_object_object_add(process_obj, "name", json_object_new_string(comm));
                json_object_object_add(process_obj, "state", json_object_new_string(&state));
                json_object_object_add(process_obj, "cpu_time", json_object_new_int64(utime + stime));
                
                json_object_array_add(processes_array, process_obj);
            }
            fclose(stat_file);
        }
    }
    
    closedir(proc_dir);
    return processes_array;
}

json_object *get_disk_usage(const char *path) {
    struct statvfs vfs;
    
    if (!is_valid_path(path) || statvfs(path, &vfs) != 0) {
        return NULL;
    }
    
    json_object *disk_obj = json_object_new_object();
    unsigned long total = vfs.f_blocks * vfs.f_frsize;
    unsigned long free = vfs.f_bavail * vfs.f_frsize;
    unsigned long used = total - free;
    
    json_object_object_add(disk_obj, "path", json_object_new_string(path));
    json_object_object_add(disk_obj, "total_bytes", json_object_new_int64(total));
    json_object_object_add(disk_obj, "free_bytes", json_object_new_int64(free));
    json_object_object_add(disk_obj, "used_bytes", json_object_new_int64(used));
    json_object_object_add(disk_obj, "usage_percent", json_object_new_double((double)used / total * 100));
    
    return disk_obj;
}

json_object *get_network_interfaces(void) {
    FILE *net_file;
    char line[256];
    json_object *interfaces_array = json_object_new_array();
    
    net_file = fopen("/proc/net/dev", "r");
    if (!net_file) return interfaces_array;
    
    // Skip header lines
    fgets(line, sizeof(line), net_file);
    fgets(line, sizeof(line), net_file);
    
    while (fgets(line, sizeof(line), net_file)) {
        char interface[32];
        unsigned long rx_bytes, tx_bytes;
        
        if (sscanf(line, "%31[^:]: %lu %*u %*u %*u %*u %*u %*u %*u %lu",
                  interface, &rx_bytes, &tx_bytes) >= 3) {
            // Trim whitespace
            char *trimmed = interface;
            while (*trimmed == ' ') trimmed++;
            
            json_object *iface_obj = json_object_new_object();
            json_object_object_add(iface_obj, "name", json_object_new_string(trimmed));
            json_object_object_add(iface_obj, "rx_bytes", json_object_new_int64(rx_bytes));
            json_object_object_add(iface_obj, "tx_bytes", json_object_new_int64(tx_bytes));
            
            json_object_array_add(interfaces_array, iface_obj);
        }
    }
    
    fclose(net_file);
    return interfaces_array;
}

int kill_process(pid_t pid, int signal) {
    return kill(pid, signal);
}

char *get_home_directory(const char *username) {
    struct passwd *pwd = getpwnam(username);
    if (pwd) {
        return strdup(pwd->pw_dir);
    }
    return NULL;
}

int is_valid_path(const char *path) {
    if (!path || strlen(path) == 0 || strlen(path) >= MAX_PATH_LEN) {
        return 0;
    }
    
    // Basic security check - no .. traversal
    if (strstr(path, "..") != NULL) {
        return 0;
    }
    
    return 1;
}

char *format_file_size(off_t size) {
    static char buffer[64];
    const char *units[] = {"B", "KB", "MB", "GB", "TB"};
    int unit = 0;
    double dsize = size;
    
    while (dsize >= 1024 && unit < 4) {
        dsize /= 1024;
        unit++;
    }
    
    if (unit == 0) {
        snprintf(buffer, sizeof(buffer), "%.0f %s", dsize, units[unit]);
    } else {
        snprintf(buffer, sizeof(buffer), "%.1f %s", dsize, units[unit]);
    }
    
    return buffer;
}

char *format_permissions(mode_t mode) {
    static char buffer[12];
    
    buffer[0] = S_ISDIR(mode) ? 'd' : (S_ISLNK(mode) ? 'l' : '-');
    buffer[1] = (mode & S_IRUSR) ? 'r' : '-';
    buffer[2] = (mode & S_IWUSR) ? 'w' : '-';
    buffer[3] = (mode & S_IXUSR) ? 'x' : '-';
    buffer[4] = (mode & S_IRGRP) ? 'r' : '-';
    buffer[5] = (mode & S_IWGRP) ? 'w' : '-';
    buffer[6] = (mode & S_IXGRP) ? 'x' : '-';
    buffer[7] = (mode & S_IROTH) ? 'r' : '-';
    buffer[8] = (mode & S_IWOTH) ? 'w' : '-';
    buffer[9] = (mode & S_IXOTH) ? 'x' : '-';
    buffer[10] = '\0';
    
    return buffer;
}

char *format_time(time_t time) {
    static char buffer[64];
    struct tm *tm_info = localtime(&time);
    strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", tm_info);
    return buffer;
}