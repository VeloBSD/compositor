CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -D_GNU_SOURCE
LDFLAGS = -lpam -ljson-c

TARGET = vldwmapi
SOURCE = vldwmapi.c

# Default target
all: $(TARGET)

# Build the server
$(TARGET): $(SOURCE)
	$(CC) $(CFLAGS) -o $(TARGET) $(SOURCE) $(LDFLAGS)

# Install dependencies (Ubuntu/Debian)
install-deps:
	sudo apt-get update
	sudo apt-get install -y build-essential libpam0g-dev libjson-c-dev

# Install dependencies (CentOS/RHEL/Fedora)
install-deps-rpm:
	sudo dnf install -y gcc pam-devel json-c-devel
	# or for older systems: sudo yum install -y gcc pam-devel json-c-devel

# Clean build files
clean:
	rm -f $(TARGET)

# Run the server
run: $(TARGET)
	sudo ./$(TARGET)

# Run in background
daemon: $(TARGET)
	sudo ./$(TARGET) &

# Stop the server
stop:
	sudo pkill -f $(TARGET)

.PHONY: all clean install-deps install-deps-rpm run daemon stop