#ifndef IDLE_H
#define IDLE_H

// Idle detection functions
int init_idle_detection(void);
void cleanup_idle_detection(void);
int get_idle_time(void);
int set_idle_timeout(int seconds);
void register_idle_callback(void (*callback)(int idle_time));

#endif // IDLE_H